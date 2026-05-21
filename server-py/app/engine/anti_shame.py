"""Anti-shame output sanitizer.

Scrubs shame-loaded language from every user-facing string before the plan
leaves the backend. Deterministic, case-insensitive, no AI. Applied as the
last step in the formatter so it covers rewrites, why-lines, tiny steps,
encouragement, and recovery hints uniformly.
"""
import re

from app.data.shame_phrases import BANNED_PHRASES, REPLACEMENTS
from app.models.plan import PlanResponse


def _sanitize_text(s: str | None) -> str | None:
    if not s:
        return s
    out = s
    for word, repl in REPLACEMENTS.items():
        out = re.sub(rf"\b{re.escape(word)}\b", repl, out, flags=re.IGNORECASE)
    for phrase in BANNED_PHRASES:
        out = re.sub(re.escape(phrase), "", out, flags=re.IGNORECASE)
    # Collapse any double spaces left by removed phrases.
    return re.sub(r"\s{2,}", " ", out).strip()


def sanitize_plan(plan: PlanResponse) -> PlanResponse:
    for task in plan.do_now:
        task.rewrite = _sanitize_text(task.rewrite) or task.rewrite
        task.why = _sanitize_text(task.why) or task.why
        for step in task.tiny_steps:
            step.text = _sanitize_text(step.text) or step.text
        for step in task.low_energy_steps:
            step.text = _sanitize_text(step.text) or step.text
        task.shutdown_step.text = _sanitize_text(task.shutdown_step.text) or task.shutdown_step.text
    plan.one_tiny_step.text = _sanitize_text(plan.one_tiny_step.text) or plan.one_tiny_step.text
    plan.encouragement = _sanitize_text(plan.encouragement)
    plan.recovery_hint = _sanitize_text(plan.recovery_hint)
    plan.skip_today = [_sanitize_text(t) or t for t in plan.skip_today]
    return plan
