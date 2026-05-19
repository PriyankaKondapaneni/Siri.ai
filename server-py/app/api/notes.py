import time

from fastapi import APIRouter, Depends, HTTPException
from nanoid import generate as nanoid

from app.db import execute, query_all, query_one, row_to_dict
from app.deps import require_auth
from app.models.note import NoteCreate

router = APIRouter(prefix="/notes")


def _now_ms() -> int:
    return int(time.time() * 1000)


@router.get("")
def list_notes(user=Depends(require_auth)):
    rows = query_all(
        "SELECT * FROM notes WHERE user_id = ? ORDER BY pinned DESC, updated_at DESC",
        (user["id"],),
    )
    return {"notes": [row_to_dict(r) for r in rows]}


@router.get("/{note_id}")
def get_note(note_id: str, user=Depends(require_auth)):
    row = query_one("SELECT * FROM notes WHERE id = ? AND user_id = ?", (note_id, user["id"]))
    if not row:
        raise HTTPException(404, "Note not found")
    return {"note": row_to_dict(row)}


@router.post("")
def create_note(body: NoteCreate, user=Depends(require_auth)):
    note_id = nanoid()
    now = _now_ms()
    execute(
        """INSERT INTO notes (id, user_id, title, content, tags, pinned, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?)""",
        (note_id, user["id"], body.title or "Untitled", body.content or "", body.tags or "", now, now),
    )
    return {"note": row_to_dict(query_one("SELECT * FROM notes WHERE id = ?", (note_id,)))}


_PATCH_FIELDS = ("title", "content", "tags", "pinned")


@router.patch("/{note_id}")
def update_note(note_id: str, body: dict, user=Depends(require_auth)):
    existing = query_one("SELECT * FROM notes WHERE id = ? AND user_id = ?", (note_id, user["id"]))
    if not existing:
        raise HTTPException(404, "Note not found")
    updates: list[str] = []
    values: list = []
    for f in _PATCH_FIELDS:
        if f in body:
            updates.append(f"{f} = ?")
            values.append(1 if (f == "pinned" and body[f]) else (0 if f == "pinned" else body[f]))
    if not updates:
        return {"note": row_to_dict(existing)}
    updates.append("updated_at = ?")
    values.extend([_now_ms(), note_id, user["id"]])
    execute(
        f"UPDATE notes SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
        tuple(values),
    )
    return {"note": row_to_dict(query_one("SELECT * FROM notes WHERE id = ?", (note_id,)))}


@router.delete("/{note_id}")
def delete_note(note_id: str, user=Depends(require_auth)):
    execute("DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, user["id"]))
    return {"ok": True}
