from app.engine.formatter import build_plan
from app.engine.prioritizer import prioritize
from app.engine.categorizer import categorize
from app.engine.scoring import score
from app.data.weights import COGNITIVE_LOAD_BUDGETS
from app.models.task import ScoredTask


def _scored(raw: str) -> ScoredTask:
    cat = categorize(raw)
    return ScoredTask(raw=raw, category=cat, scores=score(raw, cat))


def test_assessment_exposes_energy_mode_and_budget():
    plan = build_plan("reply to alice, draft brief, walk 20 min")
    a = plan.assessment
    assert a.energy_mode in ("normal", "low_energy", "shutdown")
    assert a.cognitive_load_budget == COGNITIVE_LOAD_BUDGETS[a.state]
    assert a.in_recovery is False


def test_each_task_has_three_variants():
    plan = build_plan("reply to alice, draft brief")
    for t in plan.do_now:
        assert len(t.tiny_steps) >= 1
        assert len(t.low_energy_steps) >= 1
        assert t.shutdown_step.text
        assert t.cognitive_load > 0


def test_shutdown_mode_leads_with_permission_step():
    # Heavy distress -> shutdown_risk -> energy_mode shutdown -> tiny_steps is the
    # single permission line.
    plan = build_plan(
        "clean whole house, study DSA for exam, finish overdue work report, "
        "feeling completely exhausted and frozen, cant start anything, too much pending"
    )
    assert plan.assessment.energy_mode == "shutdown"
    assert len(plan.do_now) == 1
    assert len(plan.do_now[0].tiny_steps) == 1  # permission line only


def test_cognitive_load_budget_trims_below_max_tasks():
    # Five deep-focus work tasks in an 'okay' state. MAX_TASKS would allow 4,
    # but the load budget should cut it shorter.
    tasks = [
        _scored("study DSA"),
        _scored("write the design doc"),
        _scored("review the architecture spec"),
        _scored("debug the deploy pipeline"),
    ]
    do_now, skipped = prioritize(tasks, "okay")
    used = sum(t.scores.cognitive_load for t in do_now)
    # budget for okay is 30; four work tasks (~11 each) would be ~44, so it must trim
    assert used <= COGNITIVE_LOAD_BUDGETS["okay"] + 0.01
    assert len(do_now) < 4
    assert len(skipped) >= 1


def test_at_least_one_task_even_if_over_budget():
    # A single very heavy task in shutdown_risk (budget 4) must still appear.
    heavy = _scored("study DSA for the whole afternoon")
    do_now, _ = prioritize([heavy], "shutdown_risk")
    assert len(do_now) == 1


def test_anti_shame_scrubs_banned_language():
    from app.engine.anti_shame import _sanitize_text
    assert "overdue" not in _sanitize_text("this task is overdue").lower()
    assert "you failed" not in _sanitize_text("you failed to finish").lower()
    assert _sanitize_text("reply to manager") == "reply to manager"
