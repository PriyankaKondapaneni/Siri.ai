"""Emotional state from user-provided feelings (no auto energy detection).

The user selects how they feel via emoji checkboxes; that drives state + energy.
We still derive overwhelm_score deterministically (from the chosen state + task
count) and keep a light keyword scan for distress_signals as informational data.
"""
from app.data.keywords import (
    DISTRESS_KEYWORDS_ENERGY,
    DISTRESS_KEYWORDS_OVERWHELM,
    DISTRESS_KEYWORDS_SHUTDOWN,
    DISTRESS_KEYWORDS_EMOTIONAL,
)
from app.data.weights import COGNITIVE_LOAD_BUDGETS, ENERGY_MODE_BY_STATE, MAX_TASKS
from app.models.state import EmotionalAssessment
from app.models.task import ScoredTask

# Emoji feeling key -> (state, energy). This is the only place feelings map to
# the engine's internal state model.
FEELING_TO_STATE_ENERGY: dict[str, tuple[str, str]] = {
    "okay":        ("okay", "medium"),
    "energized":   ("okay", "high"),
    "stressed":    ("stressed", "medium"),
    "overwhelmed": ("overwhelmed", "low"),
    "drained":     ("low_energy", "low"),
    "frozen":      ("shutdown_risk", "low"),
}

_ENERGY_ORDER = {"low": 0, "medium": 1, "high": 2}
_STATE_BASE_OVERWHELM = {
    "okay": 1, "stressed": 4, "low_energy": 5, "overwhelmed": 7, "shutdown_risk": 9,
}


def resolve_feelings(feelings: list[str]) -> tuple[str, str] | None:
    """Map selected feelings to a single (state, energy).

    When several are selected, pick the most protective state (smallest task
    cap) and the lowest energy — err toward gentleness.
    """
    pairs = [FEELING_TO_STATE_ENERGY[f] for f in feelings if f in FEELING_TO_STATE_ENERGY]
    if not pairs:
        return None
    state = min((p[0] for p in pairs), key=lambda s: MAX_TASKS[s])
    energy = min((p[1] for p in pairs), key=lambda e: _ENERGY_ORDER[e])
    return state, energy


def assess(
    dump: str,
    meta: list[str],
    scored: list[ScoredTask],
    feelings: list[str] | None = None,
) -> EmotionalAssessment:
    full_lower = (dump + " " + " ".join(meta)).lower()
    distress = sorted(set(
        [k for k in DISTRESS_KEYWORDS_ENERGY if k in full_lower]
        + [k for k in DISTRESS_KEYWORDS_OVERWHELM if k in full_lower]
        + [k for k in DISTRESS_KEYWORDS_SHUTDOWN if k in full_lower]
        + [k for k in DISTRESS_KEYWORDS_EMOTIONAL if k in full_lower]
    ))

    resolved = resolve_feelings(feelings or [])
    state, energy = resolved if resolved else ("okay", "medium")

    n_tasks = len(scored)
    overwhelm = min(10, _STATE_BASE_OVERWHELM[state] + max(0, n_tasks - 4))

    return EmotionalAssessment(
        state=state,
        energy=energy,
        energy_mode=ENERGY_MODE_BY_STATE[state],
        overwhelm_score=overwhelm,
        cognitive_load_budget=COGNITIVE_LOAD_BUDGETS[state],
        distress_signals=distress,
        in_recovery=False,
    )
