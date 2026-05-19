from fastapi import APIRouter, Depends, HTTPException, Request

from app.db import execute, query_all, query_one, row_to_dict
from app.deps import require_auth

router = APIRouter(prefix="/emails")


@router.get("")
def list_emails(request: Request, user=Depends(require_auth)):
    label = request.query_params.get("label")
    unread = request.query_params.get("unread")
    sql = "SELECT * FROM emails WHERE user_id = ?"
    params: list = [user["id"]]
    if label:
        sql += " AND label = ?"; params.append(label)
    if unread == "1":
        sql += " AND is_read = 0"
    sql += " ORDER BY received_at DESC"
    return {"emails": [row_to_dict(r) for r in query_all(sql, tuple(params))]}


_PATCH_FIELDS = ("is_read", "is_starred", "label")


@router.patch("/{email_id}")
def update_email(email_id: str, body: dict, user=Depends(require_auth)):
    existing = query_one("SELECT * FROM emails WHERE id = ? AND user_id = ?", (email_id, user["id"]))
    if not existing:
        raise HTTPException(404, "Email not found")
    updates: list[str] = []
    values: list = []
    for f in _PATCH_FIELDS:
        if f in body:
            updates.append(f"{f} = ?")
            v = body[f]
            if f in ("is_read", "is_starred"):
                v = 1 if v else 0
            values.append(v)
    if not updates:
        return {"email": row_to_dict(existing)}
    values.extend([email_id, user["id"]])
    execute(
        f"UPDATE emails SET {', '.join(updates)} WHERE id = ? AND user_id = ?",
        tuple(values),
    )
    return {"email": row_to_dict(query_one("SELECT * FROM emails WHERE id = ?", (email_id,)))}


@router.delete("/{email_id}")
def delete_email(email_id: str, user=Depends(require_auth)):
    execute("DELETE FROM emails WHERE id = ? AND user_id = ?", (email_id, user["id"]))
    return {"ok": True}
