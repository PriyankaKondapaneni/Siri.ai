"""Store round-trip + recovery query tests against an isolated temp DB."""
import time

from nanoid import generate as nanoid

from app import store
from app.db import execute, init_db, query_one
from app.engine.formatter import build_plan

init_db()


def _make_user() -> str:
    uid = nanoid()
    execute(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (uid, f"{uid}@t.test", "T", "x", int(time.time() * 1000)),
    )
    return uid


def test_save_plan_persists_plan_and_outcomes():
    uid = _make_user()
    plan = build_plan("reply to alice, draft brief, walk 20 min")
    pid = store.save_plan(uid, "reply to alice, draft brief, walk 20 min", plan)

    saved = store.get_plan(pid, uid)
    assert saved is not None
    assert saved["dump"].startswith("reply to alice")

    n = query_one("SELECT COUNT(*) AS c FROM task_outcomes WHERE plan_id = ?", (pid,))
    assert n["c"] == len(plan.do_now)


def test_record_outcomes_marks_status():
    uid = _make_user()
    plan = build_plan("reply to alice, walk 20 min")
    pid = store.save_plan(uid, "reply to alice, walk 20 min", plan)

    store.record_outcomes(pid, uid, completed=[0], deferred=[1])
    done = query_one(
        "SELECT status, completed_at FROM task_outcomes WHERE plan_id=? AND position=0", (pid,)
    )
    deferred = query_one(
        "SELECT status FROM task_outcomes WHERE plan_id=? AND position=1", (pid,)
    )
    assert done["status"] == "completed" and done["completed_at"]
    assert deferred["status"] == "deferred"


def test_feedback_records_helpful_and_energy():
    uid = _make_user()
    plan = build_plan("walk 20 min")
    pid = store.save_plan(uid, "walk 20 min", plan)
    store.set_feedback(pid, uid, helpful=True, energy="low")
    row = store.get_plan(pid, uid)
    assert row["helpful"] == 1
    assert row["energy_self_report"] == "low"


def test_recovery_stats_backlog_and_streak():
    uid = _make_user()
    # Three high-overwhelm plans in a row -> streak should be 3. The user reports
    # feeling overwhelmed each time.
    for _ in range(3):
        p = build_plan(
            "clean whole house, study DSA for exam, finish report",
            feelings=["overwhelmed"],
        )
        store.save_plan(uid, "x", p)
    stats = store.recovery_stats(uid)
    assert stats.overwhelm_streak >= 3
    assert stats.open_outcomes >= 1


def test_restart_resets_and_archives():
    uid = _make_user()
    p = build_plan("clean house, study, work report, exhausted, too much pending")
    store.save_plan(uid, "x", p)
    store.restart_recovery(uid)
    stats = store.recovery_stats(uid)
    # After restart the clock is fresh and pending outcomes are archived.
    assert stats.days_since_seen <= 0.01
    assert stats.open_outcomes == 0
