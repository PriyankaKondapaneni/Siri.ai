import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from nanoid import generate as nanoid
from pydantic import BaseModel

from app.db import execute, query_all, query_one, row_to_dict
from app.deps import require_auth

router = APIRouter(prefix="/tasks")


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    duration: Optional[int] = None
    reminder: Optional[str] = None
    repeat_rule: Optional[str] = None
    priority: Optional[str] = "medium"
    list: Optional[str] = "inbox"
    parent_id: Optional[str] = None


class TaskPatch(BaseModel):
    model_config = {"extra": "allow"}


def _now_ms() -> int:
    return int(time.time() * 1000)


@router.get("")
def list_tasks(list: Optional[str] = None, status: Optional[str] = None,
               user=Depends(require_auth)):
    sql = "SELECT * FROM tasks WHERE user_id = ?"
    params: list = [user["id"]]
    if list:
        sql += " AND list = ?"; params.append(list)
    if status:
        sql += " AND status = ?"; params.append(status)
    sql += " ORDER BY starred DESC, due_date ASC, created_at DESC"
    return {"tasks": [row_to_dict(r) for r in query_all(sql, tuple(params))]}


@router.post("")
def create_task(body: TaskCreate, user=Depends(require_auth)):
    if not body.title:
        raise HTTPException(400, "title is required")
    task_id = nanoid()
    now = _now_ms()
    execute(
        """INSERT INTO tasks
           (id, user_id, title, description, due_date, due_time, duration, reminder, repeat_rule,
            priority, status, list, starred, parent_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, ?, ?, ?)""",
        (
            task_id, user["id"], body.title, body.description, body.due_date, body.due_time,
            int(body.duration) if body.duration is not None else None,
            body.reminder, body.repeat_rule, body.priority or "medium",
            body.list or "inbox", body.parent_id, now, now,
        ),
    )
    return {"task": row_to_dict(query_one("SELECT * FROM tasks WHERE id = ?", (task_id,)))}


_PATCH_FIELDS = (
    "title", "description", "due_date", "due_time", "duration",
    "reminder", "repeat_rule", "priority", "status", "list", "starred",
    "parent_id",
)


@router.patch("/{task_id}")
def update_task(task_id: str, body: dict, user=Depends(require_auth)):
    existing = query_one("SELECT * FROM tasks WHERE id = ? AND user_id = ?", (task_id, user["id"]))
    if not existing:
        raise HTTPException(404, "Task not found")

    updates: list[str] = []
    values: list = []
    for f in _PATCH_FIELDS:
        if f in body:
            updates.append(f"{f} = ?")
            v = body[f]
            if f == "starred":
                v = 1 if v else 0
            elif f == "duration":
                v = int(v) if v is not None else None
            values.append(v)
    if not updates:
        return {"task": row_to_dict(existing)}

    updates.append("updated_at = ?")
    values.extend([_now_ms(), task_id, user["id"]])
    execute(
        f"UPDATE tasks SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
        tuple(values),
    )
    return {"task": row_to_dict(query_one("SELECT * FROM tasks WHERE id = ?", (task_id,)))}


@router.delete("/{task_id}")
def delete_task(task_id: str, user=Depends(require_auth)):
    execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, user["id"]))
    return {"ok": True}
