from datetime import datetime, timezone
from typing import Optional

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.ai.refiner import refine
from app.config import ANTHROPIC_API_KEY, CLAUDE_MODEL
from app.db import query_all, query_one
from app.deps import require_auth
from app.engine.anti_shame import sanitize_plan
from app.engine.formatter import build_plan
from app.models.plan import PlanRequest, PlanResponse

router = APIRouter(prefix="/assistant")


def _claude() -> Optional[anthropic.Anthropic]:
    if not ANTHROPIC_API_KEY:
        return None
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


@router.post("/adhd-plan", response_model=PlanResponse)
def adhd_plan(body: PlanRequest, user=Depends(require_auth)):
    if not body.dump or not body.dump.strip():
        raise HTTPException(400, "dump is required")
    plan = build_plan(body.dump)
    if body.refine_with_ai:
        plan = sanitize_plan(refine(plan))  # re-scrub any wording the LLM introduced
    return plan


class SummarizeRequest(BaseModel):
    text: str
    instruction: Optional[str] = None


@router.post("/plan-day")
def plan_day(user=Depends(require_auth)):
    me = query_one("SELECT id, name FROM users WHERE id = ?", (user["id"],))
    today = datetime.now(timezone.utc).date().isoformat()
    tasks = query_all(
        "SELECT title, priority, due_date FROM tasks WHERE user_id = ? AND status = 'pending' ORDER BY priority",
        (user["id"],),
    )
    events = query_all(
        "SELECT title, start_at, end_at FROM events WHERE user_id = ? AND start_at LIKE ?",
        (user["id"], f"{today}%"),
    )

    client = _claude()
    if not client:
        return {"plan": "Add ANTHROPIC_API_KEY to enable AI-powered day planning."}

    task_lines = [f"- [{r['priority']}] {r['title']}" + (f" (due {r['due_date']})" if r["due_date"] else "") for r in tasks] or ["(none)"]
    event_lines = [f"- {r['start_at']} {r['title']}" for r in events] or ["(none)"]
    summary = f"Tasks:\n" + "\n".join(task_lines) + "\n\nMeetings today:\n" + "\n".join(event_lines)

    try:
        resp = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=800,
            system=f"You are Siri, an AI productivity assistant. Help {me['name']} plan their day with a clear time-blocked schedule. Be concise and use markdown.",
            messages=[{"role": "user", "content": f"Plan my day. Here is my data:\n\n{summary}"}],
        )
        text = "\n".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
        return {"plan": text}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/summarize")
def summarize(body: SummarizeRequest, user=Depends(require_auth)):
    if not body.text:
        raise HTTPException(400, "text is required")
    client = _claude()
    if not client:
        return {"result": "Add ANTHROPIC_API_KEY to enable AI summarization."}
    try:
        resp = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=600,
            system="You are Siri, an AI productivity assistant. Be concise and structured.",
            messages=[{"role": "user", "content": f"{body.instruction or 'Summarize the following:'}\n\n{body.text}"}],
        )
        text = "\n".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
        return {"result": text}
    except Exception as e:
        raise HTTPException(500, str(e))
