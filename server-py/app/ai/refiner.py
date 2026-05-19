"""Optional AI tone refiner.

The backend has already decided which tasks to do, in what order, with what
durations and tiny steps. This module asks Claude only to:

  1. Rewrite each `rewrite` string in slightly warmer / more specific
     language without changing the meaning or the duration.
  2. Produce a single short, non-saccharine `encouragement` line.

It must never reorder do_now, remove or add tasks, or change durations.
"""
import json
import os
from typing import Optional

import anthropic

from app.config import ANTHROPIC_API_KEY, CLAUDE_MODEL
from app.models.plan import PlanResponse


REFINER_PROMPT = """You polish ADHD-friendly task wording. The user is sensitive
to overwhelm. You will receive a JSON plan that has already been prioritized
deterministically. DO NOT reorder, add, or remove tasks. DO NOT change any
duration_minutes value. DO NOT add motivational platitudes.

For each task, you may rewrite the `rewrite` field to be slightly warmer and
more specific while keeping the same meaning and same length range. You may
also fill `encouragement` with ONE plain short line (max 12 words), no
exclamation marks, no "you got this", no "it's okay to rest".

Respond ONLY with JSON:
{
  "rewrites": ["...", "..."],   // same length as do_now, in the same order
  "encouragement": "..."
}"""


def _make_client() -> Optional[anthropic.Anthropic]:
    if not ANTHROPIC_API_KEY:
        return None
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def refine(plan: PlanResponse) -> PlanResponse:
    client = _make_client()
    if client is None or not plan.do_now:
        return plan

    payload = {
        "state": plan.assessment.state,
        "energy": plan.assessment.energy,
        "do_now": [
            {"category": t.category, "rewrite": t.rewrite, "duration_minutes": t.duration_minutes}
            for t in plan.do_now
        ],
    }

    try:
        resp = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=400,
            system=REFINER_PROMPT,
            messages=[{"role": "user", "content": json.dumps(payload)}],
        )
        text = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
        cleaned = text.replace("```json", "").replace("```", "").strip()
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1:
            return plan
        data = json.loads(cleaned[start : end + 1])
        rewrites = data.get("rewrites") or []
        if isinstance(rewrites, list) and len(rewrites) == len(plan.do_now):
            for t, new in zip(plan.do_now, rewrites):
                if isinstance(new, str) and new.strip():
                    t.rewrite = new.strip()
        enc = data.get("encouragement")
        if isinstance(enc, str) and enc.strip():
            plan.encouragement = enc.strip()
        return plan
    except Exception:
        return plan
