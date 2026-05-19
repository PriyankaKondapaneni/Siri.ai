"""Detect emotional state and energy from the dump + task signals.

Pure heuristic. Used both as the primary classifier (no AI) and as a
fallback (when AI parsing fails).
"""
from app.data.keywords import (
    DISTRESS_KEYWORDS_ENERGY,
    DISTRESS_KEYWORDS_OVERWHELM,
    DISTRESS_KEYWORDS_SHUTDOWN,
    DISTRESS_KEYWORDS_EMOTIONAL,
)
from app.models.state import EmotionalAssessment
from app.models.task import ScoredTask


def assess(dump: str, meta: list[str], scored: list[ScoredTask]) -> EmotionalAssessment:
    full_lower = (dump + " " + " ".join(meta)).lower()

    energy_hits = [k for k in DISTRESS_KEYWORDS_ENERGY if k in full_lower]
    overwhelm_hits = [k for k in DISTRESS_KEYWORDS_OVERWHELM if k in full_lower]
    shutdown_hits = [k for k in DISTRESS_KEYWORDS_SHUTDOWN if k in full_lower]
    emotional_hits = [k for k in DISTRESS_KEYWORDS_EMOTIONAL if k in full_lower]

    distress = sorted(set(energy_hits + overwhelm_hits + shutdown_hits + emotional_hits))

    n_tasks = len(scored)
    n_high_emo = sum(1 for t in scored if t.scores.emotional_resistance >= 7)
    n_high_urg = sum(1 for t in scored if t.scores.urgency >= 7)

    overwhelm = min(
        10,
        len(distress) * 2
        + max(0, n_tasks - 4)
        + n_high_emo
        + (2 if overwhelm_hits else 0),
    )

    if energy_hits or n_tasks >= 7:
        energy = "low"
    elif n_tasks <= 2 and overwhelm == 0:
        energy = "high"
    else:
        energy = "medium"

    if shutdown_hits or (overwhelm >= 7 and energy == "low"):
        state = "shutdown_risk"
    elif overwhelm >= 5 or n_tasks >= 6 or n_high_emo >= 2:
        state = "overwhelmed"
    elif n_high_urg >= 3:
        state = "stressed"
    elif energy == "low":
        state = "low_energy"
    else:
        state = "okay"

    return EmotionalAssessment(
        state=state,
        energy=energy,
        overwhelm_score=overwhelm,
        distress_signals=distress,
    )
