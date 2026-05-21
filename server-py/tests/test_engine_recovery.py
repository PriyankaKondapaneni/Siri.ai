from app.engine import recovery
from app.engine.formatter import build_plan


def test_no_trigger_for_fresh_user():
    assert recovery.evaluate(0.0, 0, 0) == (False, None)


def test_trigger_after_days_away():
    fired, hint = recovery.evaluate(4.0, 0, 0)
    assert fired and "Welcome back" in hint


def test_trigger_on_backlog():
    fired, hint = recovery.evaluate(0.0, 15, 0)
    assert fired and hint


def test_trigger_on_overwhelm_streak():
    fired, hint = recovery.evaluate(0.0, 0, 3)
    assert fired and hint


def test_apply_collapses_to_one_basic_care_task():
    plan = build_plan("study DSA, reply to manager, clean room, bathe, groceries")
    plan = recovery.apply(plan, "Welcome back.")
    assert plan.assessment.in_recovery is True
    assert plan.assessment.energy_mode == "shutdown"
    assert len(plan.do_now) == 1
    assert plan.do_now[0].category in ("survival", "self_care")
    assert plan.skip_today == []          # no backlog shown during re-entry
    assert plan.recovery_hint == "Welcome back."


def test_apply_synthesizes_task_when_no_basic_care_present():
    plan = build_plan("study DSA, reply to manager, finish work report")
    plan = recovery.apply(plan, "hi")
    assert len(plan.do_now) == 1
    # falls back to hydration when the dump has no survival/self_care task
    assert plan.do_now[0].duration_minutes <= 5
