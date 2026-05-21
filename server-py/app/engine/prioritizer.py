"""ADHD-aware prioritization.

Two outputs: the chosen do_now list and the leftover skip_today list. Encodes
the ADHD principles:

  * momentum first    -> cheapest highest-dopamine task floats to position 1
  * survival > optimization -> SURVIVAL_BOOST adds to score
  * reduce paralysis  -> activation_energy weighted more negatively when bad
  * avoid stacking focus -> swap apart runs of three consecutive focus>=4 tasks
  * small lists when bad -> MAX_TASKS shrinks with state
  * protect the nervous system -> COGNITIVE_LOAD_BUDGET caps total mental load,
    so a plan can be trimmed below MAX_TASKS when the tasks are heavy
  * chores are demoralizing -> small maintenance-burden penalty
"""
from app.data.weights import (
    PRIORITY_WEIGHTS, MAX_TASKS, SURVIVAL_BOOST, MOMENTUM_BOOST,
    MAINTENANCE_PENALTY_WEIGHT, COGNITIVE_LOAD_BUDGETS,
)
from app.engine.cognitive_load import ADJACENCY_FOCUS_THRESHOLD, ADJACENCY_PENALTY
from app.models.task import ScoredTask


def _score(task: ScoredTask, state: str) -> float:
    w = PRIORITY_WEIGHTS[state]
    s = task.scores
    score = (
        w[0] * s.urgency
        + w[1] * s.importance
        + w[2] * s.dopamine_reward
        + w[3] * s.activation_energy
        + w[4] * s.emotional_resistance
        + w[5] * s.focus_required
        + w[6] * (s.duration_minutes / 10.0)
    )
    if task.category in ("survival", "self_care"):
        score += SURVIVAL_BOOST
    score -= MAINTENANCE_PENALTY_WEIGHT * s.maintenance_burden
    return score


def _avoid_focus_stacking(tasks: list[ScoredTask]) -> list[ScoredTask]:
    """Break up runs of three consecutive focus_required>=4 tasks.

    Conservative: only swaps the third with a later low-focus task if one exists.
    """
    out = list(tasks)
    for i in range(2, len(out)):
        if (
            out[i].scores.focus_required >= 4
            and out[i - 1].scores.focus_required >= 4
            and out[i - 2].scores.focus_required >= 4
        ):
            for j in range(i + 1, len(out)):
                if out[j].scores.focus_required < 4:
                    out[i], out[j] = out[j], out[i]
                    break
    return out


def _select_within_budget(ordered: list[ScoredTask], state: str) -> list[ScoredTask]:
    """Greedy pack by priority, gated by both MAX_TASKS and the load budget.

    Always includes at least one task (the top-priority / momentum one) so the
    user is never handed an empty plan when they have things to do.
    """
    cap = MAX_TASKS[state]
    budget = COGNITIVE_LOAD_BUDGETS[state]
    chosen: list[ScoredTask] = []
    used = 0.0
    for t in ordered:
        if len(chosen) >= cap:
            break
        if not chosen:
            chosen.append(t)
            used = t.scores.cognitive_load
            continue
        projected = used + t.scores.cognitive_load
        if (
            chosen[-1].scores.focus_required >= ADJACENCY_FOCUS_THRESHOLD
            and t.scores.focus_required >= ADJACENCY_FOCUS_THRESHOLD
        ):
            projected += ADJACENCY_PENALTY
        if projected > budget:
            continue  # too heavy; keep scanning for something that fits
        chosen.append(t)
        used = projected
    return chosen


def prioritize(tasks: list[ScoredTask], state: str) -> tuple[list[ScoredTask], list[ScoredTask]]:
    if not tasks:
        return [], []

    for t in tasks:
        t.priority_score = _score(t, state)

    ordered = sorted(tasks, key=lambda t: t.priority_score, reverse=True)

    # Momentum boost: the cheapest, highest-dopamine task wins position 1 —
    # but only while there's energy to spend on momentum. In low_energy and
    # shutdown_risk states, survival/self-care order (already encoded in the
    # weighted score) must win, so we leave the order alone.
    if state in ("okay", "stressed", "overwhelmed"):
        momentum = max(
            ordered,
            key=lambda t: t.scores.dopamine_reward - t.scores.activation_energy
            + (MOMENTUM_BOOST if t.scores.duration_minutes <= 5 else 0),
        )
        if momentum is not ordered[0]:
            ordered.remove(momentum)
            ordered.insert(0, momentum)

    ordered = _avoid_focus_stacking(ordered)

    chosen = _select_within_budget(ordered, state)
    chosen_ids = {id(t) for t in chosen}
    skipped = [t for t in ordered if id(t) not in chosen_ids]
    return chosen, skipped
