"""End-to-end orchestrator. Compose all engines into a PlanResponse."""
from app.data.templates import rewrite_for
from app.engine.breakdown import steps_for
from app.engine.categorizer import categorize
from app.engine.emotional_state import assess
from app.engine.parser import parse
from app.engine.prioritizer import prioritize
from app.engine.scoring import score as score_task
from app.models.plan import PlanResponse
from app.models.task import ActionStep, PlannedTask, ScoredTask


def _priority_label(state: str, score: float, top: float) -> str:
    # Relative priority within the do_now list.
    if top == 0:
        return "medium"
    ratio = score / top if top else 1.0
    if ratio >= 0.85:
        return "high"
    if ratio >= 0.5:
        return "medium"
    return "low"


def _why(task: ScoredTask, state: str) -> str:
    s = task.scores
    bits: list[str] = []
    if s.duration_minutes <= 5:
        bits.append(f"only {s.duration_minutes} min")
    if s.dopamine_reward >= 7:
        bits.append("quick win")
    if s.urgency >= 7:
        bits.append("time-sensitive")
    if task.category in ("survival", "self_care"):
        bits.append("basic-care first")
    if s.emotional_resistance >= 7 and s.duration_minutes <= 5:
        bits.append("removes a lingering worry fast")
    if not bits:
        bits.append("good momentum task")
    return ", ".join(bits).capitalize() + "."


def build_plan(dump: str) -> PlanResponse:
    raw_tasks, meta = parse(dump)

    scored: list[ScoredTask] = []
    for raw in raw_tasks:
        cat = categorize(raw)
        scored.append(ScoredTask(raw=raw, category=cat, scores=score_task(raw, cat), priority_score=0.0))

    assessment = assess(dump, meta, scored)
    do_now, skipped = prioritize(scored, assessment.state)

    top_score = do_now[0].priority_score if do_now else 0.0
    planned: list[PlannedTask] = []
    for t in do_now:
        planned.append(
            PlannedTask(
                raw=t.raw,
                rewrite=rewrite_for(t.category, t.raw),
                category=t.category,
                duration_minutes=t.scores.duration_minutes,
                priority=_priority_label(assessment.state, t.priority_score, top_score),
                why=_why(t, assessment.state),
                tiny_steps=steps_for(t.category),
            )
        )

    one_step: ActionStep = (
        planned[0].tiny_steps[0] if planned else ActionStep(order=1, text="Sit up. That's enough for now.")
    )

    return PlanResponse(
        assessment=assessment,
        do_now=planned,
        skip_today=[t.raw for t in skipped],
        one_tiny_step=one_step,
        encouragement=None,
    )
