"""Recovery Mode.

When a user disappears, accumulates a backlog, or rides a streak of high
overwhelm, the system should make re-entry emotionally safe: shrink the plan to
a single basic-care action, hide the backlog, and never mention what was
'missed'. The trigger logic here is pure (testable without a DB); the plan
transform mutates a PlanResponse that the route already built.
"""
from app.engine.breakdown import low_energy_steps, normal_steps, shutdown_step
from app.models.plan import PlanResponse
from app.models.task import ActionStep, PlannedTask

# Thresholds (tunable).
DAYS_AWAY_TRIGGER = 3
BACKLOG_TRIGGER = 12
OVERWHELM_STREAK_TRIGGER = 3

SURVIVAL_CATEGORIES = ("survival", "self_care")


def evaluate(days_since_seen: float, open_outcomes: int, overwhelm_streak: int) -> tuple[bool, str | None]:
    """Return (in_recovery, hint). Pure."""
    if days_since_seen >= DAYS_AWAY_TRIGGER:
        return True, "Welcome back. No catch-up needed — just one small thing today."
    if open_outcomes >= BACKLOG_TRIGGER:
        return True, "A lot piled up. It's set aside for now. Let's start with one thing."
    if overwhelm_streak >= OVERWHELM_STREAK_TRIGGER:
        return True, "Rough stretch lately. Today is for one gentle thing, nothing more."
    return False, None


def _fallback_task() -> PlannedTask:
    return PlannedTask(
        raw="hydrate",
        rewrite="Drink one glass of water",
        category="survival",
        duration_minutes=2,
        priority="high",
        why="Re-entry starts with one basic thing. That's the whole goal today.",
        cognitive_load=2.0,
        tiny_steps=[ActionStep(order=1, text="Find any cup or bottle")],
        low_energy_steps=low_energy_steps("survival"),
        shutdown_step=shutdown_step("survival"),
    )


def apply(plan: PlanResponse, hint: str | None) -> PlanResponse:
    """Collapse the plan to a single basic-care action and mark recovery."""
    plan.assessment.in_recovery = True
    plan.assessment.energy_mode = "shutdown"
    plan.recovery_hint = hint

    survival = [t for t in plan.do_now if t.category in SURVIVAL_CATEGORIES]
    chosen = survival[0] if survival else (plan.do_now[0] if plan.do_now else _fallback_task())

    # Everything else becomes invisible for now (not 'skipped', not 'failed').
    others = [t.raw for t in plan.do_now if t is not chosen]
    plan.skip_today = []  # don't show a pile during re-entry
    plan.do_now = [chosen]
    plan.one_tiny_step = chosen.tiny_steps[0] if chosen.tiny_steps else chosen.shutdown_step
    _ = others  # intentionally hidden; remains in stored plan_json for analytics
    return plan
