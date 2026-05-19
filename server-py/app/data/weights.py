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

# Survival / self_care always get a bump to importance (basic-care first).
SURVIVAL_BOOST = 3.0

# The cheapest, highest-dopamine task is floated to position 1.
MOMENTUM_BOOST = 1.5
