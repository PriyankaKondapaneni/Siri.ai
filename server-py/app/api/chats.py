import random
import time

from fastapi import APIRouter, Depends, HTTPException
from nanoid import generate as nanoid

from app.db import execute, query_all, query_one, row_to_dict
from app.deps import require_auth
from app.models.chat import ChatCreate, MessageCreate

router = APIRouter(prefix="/chats")


def _now_ms() -> int:
    return int(time.time() * 1000)


STUB_REPLIES = [
    "Got it. I'm running in stub mode right now — Claude isn't wired in for the chat route yet. The /assistant/adhd-plan endpoint is the live AI surface; this chat endpoint will get wired up next.",
    "Stub reply. Chat is a placeholder. The ADHD planner endpoint works with or without an API key.",
    "Thanks for the prompt. Chat is still stubbed in this build; only /assistant/adhd-plan is live.",
]


@router.get("")
def list_chats(user=Depends(require_auth)):
    rows = query_all(
        "SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC",
        (user["id"],),
    )
    return {"chats": [row_to_dict(r) for r in rows]}


@router.get("/{chat_id}")
def get_chat(chat_id: str, user=Depends(require_auth)):
    chat = query_one("SELECT * FROM chats WHERE id = ? AND user_id = ?", (chat_id, user["id"]))
    if not chat:
        raise HTTPException(404, "Chat not found")
    messages = query_all(
        "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
        (chat_id,),
    )
    return {"chat": row_to_dict(chat), "messages": [row_to_dict(m) for m in messages]}


@router.post("")
def create_chat(body: ChatCreate, user=Depends(require_auth)):
    chat_id = nanoid()
    now = _now_ms()
    execute(
        "INSERT INTO chats (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (chat_id, user["id"], body.title or "New chat", now, now),
    )
    return {"chat": row_to_dict(query_one("SELECT * FROM chats WHERE id = ?", (chat_id,)))}


@router.delete("/{chat_id}")
def delete_chat(chat_id: str, user=Depends(require_auth)):
    execute("DELETE FROM chats WHERE id = ? AND user_id = ?", (chat_id, user["id"]))
    return {"ok": True}


@router.post("/{chat_id}/messages")
def post_message(chat_id: str, body: MessageCreate, user=Depends(require_auth)):
    if not body.content:
        raise HTTPException(400, "content is required")
    chat = query_one("SELECT * FROM chats WHERE id = ? AND user_id = ?", (chat_id, user["id"]))
    if not chat:
        raise HTTPException(404, "Chat not found")

    now = _now_ms()
    user_msg_id = nanoid()
    execute(
        "INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)",
        (user_msg_id, chat_id, body.content, now),
    )

    assistant_text = random.choice(STUB_REPLIES)
    asst_msg_id = nanoid()
    reply_time = _now_ms()
    execute(
        "INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)",
        (asst_msg_id, chat_id, assistant_text, reply_time),
    )

    title = chat["title"]
    count_row = query_one("SELECT COUNT(*) AS c FROM messages WHERE chat_id = ?", (chat_id,))
    if count_row and count_row["c"] <= 2 and (title in (None, "New chat", "Conversation", "Quick chat")):
        title = body.content[:60]
        execute("UPDATE chats SET title = ?, updated_at = ? WHERE id = ?", (title, reply_time, chat_id))
    else:
        execute("UPDATE chats SET updated_at = ? WHERE id = ?", (reply_time, chat_id))

    return {
        "userMessage": {
            "id": user_msg_id, "chat_id": chat_id, "role": "user",
            "content": body.content, "created_at": now,
        },
        "assistantMessage": {
            "id": asst_msg_id, "chat_id": chat_id, "role": "assistant",
            "content": assistant_text, "created_at": reply_time,
        },
        "chat": {**row_to_dict(chat), "title": title, "updated_at": reply_time},
    }
