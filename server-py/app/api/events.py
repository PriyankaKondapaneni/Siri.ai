import time

from fastapi import APIRouter, Depends, HTTPException, Request
from nanoid import generate as nanoid

from app.db import execute, query_all, query_one, row_to_dict
from app.deps import require_auth
from app.models.event import EventCreate

router = APIRouter(prefix="/events")


def _now_ms() -> int:
    return int(time.time() * 1000)


@router.get("")
def list_events(request: Request, user=Depends(require_auth)):
    # `from` is a Python keyword, so read query params directly.
    from_value = request.query_params.get("from")
    to_value = request.query_params.get("to")
    sql = "SELECT * FROM events WHERE user_id = ?"
    params: list = [user["id"]]
    if from_value:
        sql += " AND start_at >= ?"; params.append(from_value)
    if to_value:
        sql += " AND start_at <= ?"; params.append(to_value)
    sql += " ORDER BY start_at ASC"
    return {"events": [row_to_dict(r) for r in query_all(sql, tuple(params))]}


@router.post("")
def create_event(body: EventCreate, user=Depends(require_auth)):
    if not body.title or not body.start_at or not body.end_at:
        raise HTTPException(400, "title, start_at, end_at are required")
    event_id = nanoid()
    execute(
        """INSERT INTO events (id, user_id, title, description, start_at, end_at, location, color, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (event_id, user["id"], body.title, body.description, body.start_at, body.end_at,
         body.location, body.color or "indigo", _now_ms()),
    )
    return {"event": row_to_dict(query_one("SELECT * FROM events WHERE id = ?", (event_id,)))}


_PATCH_FIELDS = ("title", "description", "start_at", "end_at", "location", "color")


@router.patch("/{event_id}")
def update_event(event_id: str, body: dict, user=Depends(require_auth)):
    existing = query_one("SELECT * FROM events WHERE id = ? AND user_id = ?", (event_id, user["id"]))
    if not existing:
        raise HTTPException(404, "Event not found")
    updates: list[str] = []
    values: list = []
    for f in _PATCH_FIELDS:
        if f in body:
            updates.append(f"{f} = ?"); values.append(body[f])
    if not updates:
        return {"event": row_to_dict(existing)}
    values.extend([event_id, user["id"]])
    execute(
        f"UPDATE events SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
        tuple(values),
    )
    return {"event": row_to_dict(query_one("SELECT * FROM events WHERE id = ?", (event_id,)))}


@router.delete("/{event_id}")
def delete_event(event_id: str, user=Depends(require_auth)):
    execute("DELETE FROM events WHERE id = ? AND user_id = ?", (event_id, user["id"]))
    return {"ok": True}
