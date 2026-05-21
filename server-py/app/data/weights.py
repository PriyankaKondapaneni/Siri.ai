"""State-adaptive priority weights and task-count caps.

Tuple order corresponds to:
  (urgency, importance, dopamine_reward, activation_energy,
   emotional_resistance, focus_required, duration/10)
"""

PRIORITY_WEIGHTS: dict[str, tuple[float, float, float, float, float, float, float]] = {
    "okay":          (2.0, 1.5, 1.5, -1.0, -1.0, -0.5, -0.5),
    "stressed":      (2.5, 1.5, 1.5, -1.5, -1.0, -1.0, -0.5),
    "overwhelmed":   (1.5, 0.5, 2.5, -2.5, -1.5, -1.5, -1.0),
    "low_energy":    (1.0, 0.5, 2.0, -3.0, -1.5, -2.0, -1.5),
    "shutdown_risk": (0.5, 0.5, 1.0, -4.0, -2.5, -3.0, -2.0),
}

MAX_TASKS: dict[str, int] = {
    "okay": 4,
    "stressed": 4,
    "overwhelmed": 3,
    "low_energy": 2,
    "shutdown_risk": 1,
}

# Per-state cognitive-load budget. Prioritizer stops adding tasks once the
# running total would exceed this. MAX_TASKS still wins as a hard cap; the
# budget is the softer, finer-grained cap that captures "this plan is too
# mentally heavy" even when the count is small.
# Tunable. Generous for healthy states (the MAX_TASKS count cap governs there),
# tight for bad states where protecting the nervous system matters most. A
# single deep-focus work task is ~18-20 load, so okay fits roughly two of them
# plus light tasks, while shutdown_risk fits only one basic-care item.
COGNITIVE_LOAD_BUDGETS: dict[str, float] = {
    "okay":          45.0,
    "stressed":      30.0,
    "overwhelmed":   14.0,
    "low_energy":     8.0,
    "shutdown_risk":  4.0,
}

# Map detected emotional state → the energy mode the breakdown engine uses
# to pick tiny-step variants.
ENERGY_MODE_BY_STATE: dict[str, str] = {
    "okay":          "normal",
    "stressed":      "normal",
    "overwhelmed":   "low_energy",
    "low_energy":    "low_energy",
    "shutdown_risk": "shutdown",
}

# Survival / self_care always get a bump to importance (basic-care first).
SURVIVAL_BOOST = 3.0

# The cheapest, highest-dopamine task is floated to position 1.
MOMENTUM_BOOST = 1.5

# High-maintenance tasks (chores, recurring care) get a small priority
# penalty — they're demoralizing and come back. Kept small so it never
# overrides SURVIVAL_BOOST for basic-care items.
MAINTENANCE_PENALTY_WEIGHT = 0.15
