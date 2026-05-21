"""User-provided feelings drive state/energy; brain-dump items become today's tasks."""
import time
from datetime import date

from fastapi.testclient import TestClient
from nanoid import generate as nanoid

from app import store
from app.db import execute, init_db, query_all
from app.engine.emotional_state import resolve_feelings
from app.engine.formatter import build_plan
from app.main import app

client = TestClient(app)
init_db()


def test_resolve_single_feeling():
    assert resolve_feelings(["drained"]) == ("low_energy", "low")
    assert resolve_feelings(["energized"]) == ("okay", "high")
    assert resolve_feelings([]) is None


def test_resolve_multiple_picks_most_protective_and_lowest_energy():
    # frozen (shutdown_risk, cap 1) is more protective than stressed (cap 4)
    state, energy = resolve_feelings(["stressed", "frozen"])
    assert state == "shutdown_risk"
    assert energy == "low"


def test_no_feeling_defaults_to_neutral_not_detected():
    # Text screams overwhelm, but with no feeling selected we stay neutral.
    plan = build_plan("everything is too much, exhausted, cant start, drowning")
    assert plan.assessment.state == "okay"
    assert plan.assessment.energy == "medium"


def test_feeling_overrides_text():
    plan = build_plan("reply to alice, walk", feelings=["overwhelmed"])
    assert plan.assessment.state == "overwhelmed"
    assert plan.assessment.energy == "low"


def _make_user() -> str:
    uid = nanoid()
    execute(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (uid, f"{uid}@t.test", "T", "x", int(time.time() * 1000)),
    )
    return uid


def test_create_today_tasks_dates_them_today_and_dedupes():
    uid = _make_user()
    today = date.today().isoformat()
    created = store.create_today_tasks(uid, ["clean room", "reply to manager", "clean room"])
    assert len(created) == 2  # duplicate "clean room" deduped
    rows = query_all(
        "SELECT title, due_date, list, status FROM tasks WHERE user_id=? AND due_date=?",
        (uid, today),
    )
    titles = {r["title"] for r in rows}
    assert titles == {"clean room", "reply to manager"}
    assert all(r["due_date"] == today and r["status"] == "pending" for r in rows)

    # Re-running with an overlapping item doesn't create another duplicate.
    again = store.create_today_tasks(uid, ["clean room", "groceries"])
    assert again == [c for c in again]  # only groceries is new
    assert len(again) == 1


def test_plan_endpoint_creates_tasks_and_reports_count():
    r = client.post("/api/auth/signup", json={"email": f"{nanoid()}@t.test", "password": "pw", "name": "X"})
    token = r.json()["token"]
    uid = r.json()["user"]["id"]
    resp = client.post(
        "/api/assistant/adhd-plan",
        headers={"Authorization": f"Bearer {token}"},
        json={"dump": "reply to alice, walk 20 min, draft brief", "feelings": ["stressed"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["assessment"]["state"] == "stressed"
    assert body["tasks_created"] == 3
    today = date.today().isoformat()
    titles = {
        r["title"] for r in query_all(
            "SELECT title FROM tasks WHERE user_id=? AND due_date=? AND status='pending'",
            (uid, today),
        )
    }
    # The 3 brain-dump items are present and dated today (alongside any demo seed).
    assert {"reply to alice", "walk 20 min", "draft brief"} <= titles
