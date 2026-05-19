import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from nanoid import generate as nanoid

from app.db import execute, query_one
from app.deps import require_auth
from app.models.user import AuthResponse, LoginRequest, SignupRequest, User
from app.security import hash_password, sign_token, verify_password

router = APIRouter()


def _now_ms() -> int:
    return int(time.time() * 1000)


@router.post("/signup", response_model=AuthResponse)
def signup(body: SignupRequest):
    if not body.email or not body.password or not body.name:
        raise HTTPException(400, "email, password, and name are required")
    email = body.email.lower()
    if query_one("SELECT id FROM users WHERE email = ?", (email,)):
        raise HTTPException(409, "Email already in use")
    user_id = nanoid()
    execute(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, email, body.name, hash_password(body.password), _now_ms()),
    )
    _seed_demo_data(user_id)
    user = User(id=user_id, email=email, name=body.name)
    return AuthResponse(token=sign_token(user.model_dump()), user=user)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest):
    if not body.email or not body.password:
        raise HTTPException(400, "email and password are required")
    row = query_one("SELECT * FROM users WHERE email = ?", (body.email.lower(),))
    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    user = User(id=row["id"], email=row["email"], name=row["name"])
    return AuthResponse(token=sign_token(user.model_dump()), user=user)


@router.get("/me")
def me(user_token=Depends(require_auth)):
    row = query_one("SELECT id, email, name FROM users WHERE id = ?", (user_token["id"],))
    if not row:
        raise HTTPException(404, "User not found")
    return {"user": {"id": row["id"], "email": row["email"], "name": row["name"]}}


def _seed_demo_data(user_id: str) -> None:
    now = _now_ms()
    day_ms = 24 * 60 * 60 * 1000
    today = datetime.now(timezone.utc).date().isoformat()
    tomorrow = (datetime.now(timezone.utc).date() + timedelta(days=1)).isoformat()
    tasks = [
        ("Welcome to siri.ai", "Try asking the assistant to summarize your day", today, "high", "pending", "today", 1),
        ("Plan weekly review", "Block 30 minutes on Friday for a weekly review", tomorrow, "medium", "pending", "today", 0),
        ("Draft project brief", "Outline scope, goals and timeline", None, "medium", "pending", "inbox", 0),
        ("Read research paper", "Latest on agentic workflows", None, "low", "pending", "inbox", 0),
    ]
    for title, desc, due, prio, status, lst, starred in tasks:
        execute(
            """INSERT INTO tasks
               (id, user_id, title, description, due_date, priority, status, list, starred, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (nanoid(), user_id, title, desc, due, prio, status, lst, starred, now, now),
        )

    execute(
        """INSERT INTO notes (id, user_id, title, content, tags, pinned, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            nanoid(), user_id, "Getting started",
            "# Welcome\n\nSiri is your AI second brain. Capture thoughts, tasks, and meetings — and let the assistant connect the dots.\n\n- Ask it to plan your day\n- Draft a follow-up from a meeting\n- Triage your inbox",
            "welcome,intro", 1, now, now,
        ),
    )

    def _at(hour: int, minute: int = 0) -> datetime:
        return datetime.now(timezone.utc).replace(hour=hour, minute=minute, second=0, microsecond=0)

    start_t = _at(10)
    end_t = start_t + timedelta(hours=1)
    execute(
        """INSERT INTO events (id, user_id, title, description, start_at, end_at, location, color, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (nanoid(), user_id, "Team standup", "Daily sync", start_t.isoformat(), end_t.isoformat(), "Google Meet", "indigo", now),
    )
    start_2 = _at(14, 30)
    end_2 = start_2 + timedelta(minutes=45)
    execute(
        """INSERT INTO events (id, user_id, title, description, start_at, end_at, location, color, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (nanoid(), user_id, "Focus block", "Deep work on roadmap", start_2.isoformat(), end_2.isoformat(), "", "emerald", now),
    )

    emails = [
        ("Avery Chen", "avery@example.com", "Welcome aboard",
         "Glad to have you on the team — here are some resources to get started…",
         "Hi! Welcome to the team. Here are a few resources to help you ramp up over the next two weeks.",
         0, 1, "work"),
        ("GitHub", "noreply@github.com", "[siri-ai] New pull request opened",
         "A new pull request has been opened in your repository…",
         "A new pull request has been opened in your repository.", 0, 0, "updates"),
        ("Stripe", "no-reply@stripe.com", "Your weekly report",
         "Here is your weekly summary across all accounts…",
         "Weekly summary attached.", 1, 0, "reports"),
    ]
    for i, (sender, sender_email, subject, preview, body, is_read, is_starred, label) in enumerate(emails):
        execute(
            """INSERT INTO emails
               (id, user_id, sender, sender_email, subject, preview, body, received_at, is_read, is_starred, label)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (nanoid(), user_id, sender, sender_email, subject, preview, body,
             now - i * 3600 * 1000, is_read, is_starred, label),
        )
