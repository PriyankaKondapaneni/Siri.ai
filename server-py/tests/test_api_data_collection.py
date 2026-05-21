"""Verify that, while data collection is paused (default), the planner returns a
plan but persists nothing."""
from fastapi.testclient import TestClient

from app.config import COLLECT_PLAN_DATA
from app.db import query_one
from app.main import app

client = TestClient(app)


def _signup() -> tuple[str, str]:
    import time
    email = f"dc{int(time.time()*1000)}@t.test"
    r = client.post("/api/auth/signup", json={"email": email, "password": "pw", "name": "DC"})
    body = r.json()
    return body["token"], body["user"]["id"]


def test_collection_is_paused_by_default():
    assert COLLECT_PLAN_DATA is False


def test_plan_returns_no_id_and_persists_nothing_when_paused():
    token, uid = _signup()
    r = client.post(
        "/api/assistant/adhd-plan",
        headers={"Authorization": f"Bearer {token}"},
        json={"dump": "reply to alice, walk 20 min, draft brief"},
    )
    assert r.status_code == 200
    body = r.json()
    # Plan is still produced...
    assert body["do_now"]
    # ...but nothing is stored.
    assert body["plan_id"] is None
    cnt = query_one("SELECT COUNT(*) AS c FROM plans WHERE user_id = ?", (uid,))
    assert cnt["c"] == 0
    out = query_one("SELECT COUNT(*) AS c FROM task_outcomes WHERE user_id = ?", (uid,))
    assert out["c"] == 0
