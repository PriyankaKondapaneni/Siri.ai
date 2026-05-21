"""Per-task scoring. Pure functions, deterministic, keyword-driven."""
from app.data.keywords import URGENCY_KEYWORDS, EMOTIONAL_LOAD_KEYWORDS
from app.engine.cognitive_load import task_load
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

# Per-category context-switching cost (0-5): how jarring it is to enter/leave
# this mode. Deep-focus work is the most expensive to switch into.
CONTEXT_SWITCHING_COST: dict[str, int] = {
    "survival": 1,
    "self_care": 1,
    "communication": 2,
    "chore": 2,
    "emotional": 3,
    "work": 4,
    "other": 2,
}

# Per-category maintenance burden (0-10): how much ongoing upkeep a single
# completion implies. Chores and basic care recur; a one-off message doesn't.
MAINTENANCE_BURDEN: dict[str, int] = {
    "survival": 8,
    "self_care": 8,
    "communication": 1,
    "chore": 6,
    "work": 3,
    "emotional": 4,
    "other": 3,
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

    context_switching_cost = CONTEXT_SWITCHING_COST.get(category, 2)
    maintenance_burden = MAINTENANCE_BURDEN.get(category, 3)
    foc_c = _clamp(foc, 1, 5)
    emo_c = _clamp(emotional_resistance, 0, 10)
    dur_c = max(1, duration)

    cognitive_load = task_load(
        foc_c, dur_c, emo_c, context_switching_cost, maintenance_burden
    )

    return TaskScores(
        urgency=_clamp(urgency, 0, 10),
        importance=_clamp(imp, 0, 10),
        activation_energy=_clamp(act, 0, 10),
        emotional_resistance=emo_c,
        focus_required=foc_c,
        duration_minutes=dur_c,
        dopamine_reward=_clamp(dop, 0, 10),
        context_switching_cost=context_switching_cost,
        maintenance_burden=maintenance_burden,
        cognitive_load=cognitive_load,
    )
