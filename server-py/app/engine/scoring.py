"""Per-task scoring. Pure functions, deterministic, keyword-driven."""
from app.data.keywords import URGENCY_KEYWORDS, EMOTIONAL_LOAD_KEYWORDS
from app.engine.time_estimator import estimate as estimate_minutes
from app.models.task import TaskScores

# Category baselines: (importance, activation, emo_resistance, focus, dopamine)
# Duration is handled by the time_estimator so it can be tuned independently.
CATEGORY_BASELINES: dict[str, tuple[int, int, int, int, int]] = {
    "survival":      (9, 4, 2, 1, 6),
    "communication": (5, 3, 6, 2, 8),
    "self_care":     (7, 4, 2, 1, 6),
    "chore":         (4, 6, 2, 2, 7),
    "work":          (5, 8, 4, 5, 4),
    "emotional":     (3, 7, 8, 3, 5),
    "other":         (4, 5, 3, 3, 5),
}


def _clamp(n: int | float, lo: int, hi: int) -> int:
    return int(max(lo, min(hi, n)))


def _max_keyword_score(lower: str, table: dict[int, list[str]], default: int) -> int:
    best = default
    for score, words in table.items():
        if any(w in lower for w in words):
            best = max(best, score)
    return best


def score(raw: str, category: str) -> TaskScores:
    lower = raw.lower()
    imp, act, emo, foc, dop = CATEGORY_BASELINES[category]

    urgency = _max_keyword_score(lower, URGENCY_KEYWORDS, default=3)
    emotional_resistance = max(
        emo, _max_keyword_score(lower, EMOTIONAL_LOAD_KEYWORDS, default=emo)
    )

    if any(w in lower for w in ("quick ", "just ", "one ", "1 ")):
        act -= 2
    if any(w in lower for w in ("whole ", "entire ", "all of ")):
        act += 2
    if "havent" in lower or "haven't" in lower:
        urgency = max(urgency, 7)
    if category == "survival":
        imp = max(imp, 9)
        urgency = max(urgency, 6)

    duration = estimate_minutes(category, raw)

    return TaskScores(
        urgency=_clamp(urgency, 0, 10),
        importance=_clamp(imp, 0, 10),
        activation_energy=_clamp(act, 0, 10),
        emotional_resistance=_clamp(emotional_resistance, 0, 10),
        focus_required=_clamp(foc, 1, 5),
        duration_minutes=max(1, duration),
        dopamine_reward=_clamp(dop, 0, 10),
    )
