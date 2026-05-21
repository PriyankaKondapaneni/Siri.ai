from app.engine.formatter import build_plan


def test_user_example_produces_minimal_plan_when_shutdown_risk():
    dump = "Need to clean room, reply to manager, study DSA, bathe, groceries, feeling exhausted, too many things pending"
    # State now comes from the user's selected feeling, not auto-detection.
    plan = build_plan(dump, feelings=["overwhelmed"])
    assert plan.assessment.state in ("shutdown_risk", "overwhelmed", "low_energy")
    # do_now is small when the state is bad.
    assert 1 <= len(plan.do_now) <= 3
    # Skipped list is non-empty (we had ~5 real tasks).
    assert len(plan.skip_today) >= 2
    # The single tiny step is always present.
    assert plan.one_tiny_step.order == 1
    assert plan.one_tiny_step.text


def test_healthy_dump_keeps_full_plan():
    dump = "reply to alice, draft project brief, walk 20 min, read paper"
    plan = build_plan(dump)
    assert plan.assessment.state in ("okay", "stressed")
    assert 2 <= len(plan.do_now) <= 4


def test_empty_dump_is_safe():
    plan = build_plan("")
    assert plan.do_now == []
    assert plan.skip_today == []
    assert plan.one_tiny_step.text  # has a graceful fallback


def test_momentum_first_quick_communication_wins_top_slot():
    # 'reply to alice' is a cheap dopamine task; should float to position 1.
    dump = "study DSA for exam, reply to alice, clean kitchen"
    plan = build_plan(dump)
    assert plan.do_now
    assert "alice" in plan.do_now[0].raw.lower()


def test_survival_boost_floats_basic_care():
    dump = "study DSA, havent eaten anything today, code review ticket"
    plan = build_plan(dump)
    raws_top2 = [t.raw.lower() for t in plan.do_now[:2]]
    assert any("eaten" in r for r in raws_top2)
