"""Cognitive Load Manager.

Per-task load is a single number capturing how much working memory + emotional
+ context-switching burden a task carries. Per-plan load sums those and adds an
adjacency penalty for back-to-back deep-focus tasks (the thing ADHD brains
handle worst).

task_load = focus_required*2
          + duration_minutes/10
          + emotional_resistance/2
          + context_switching_cost
          + maintenance_burden/4
"""
from app.models.task import ScoredTask, TaskScores

ADJACENCY_FOCUS_THRESHOLD = 4
ADJACENCY_PENALTY = 2.0


def task_load(
    focus_required: int,
    duration_minutes: int,
    emotional_resistance: int,
    context_switching_cost: int,
    maintenance_burden: int,
) -> float:
    return round(
        focus_required * 2
        + duration_minutes / 10
        + emotional_resistance / 2
        + context_switching_cost
        + maintenance_burden / 4,
        2,
    )


def task_load_from_scores(s: TaskScores) -> float:
    return task_load(
        s.focus_required,
        s.duration_minutes,
        s.emotional_resistance,
        s.context_switching_cost,
        s.maintenance_burden,
    )


def adjacency_penalty(tasks: list[ScoredTask]) -> float:
    penalty = 0.0
    for a, b in zip(tasks, tasks[1:]):
        if (
            a.scores.focus_required >= ADJACENCY_FOCUS_THRESHOLD
            and b.scores.focus_required >= ADJACENCY_FOCUS_THRESHOLD
        ):
            penalty += ADJACENCY_PENALTY
    return penalty


def plan_load(tasks: list[ScoredTask]) -> float:
    return round(sum(t.scores.cognitive_load for t in tasks) + adjacency_penalty(tasks), 2)
