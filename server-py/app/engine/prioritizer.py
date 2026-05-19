"""ADHD-aware prioritization.

Two outputs: the chosen do_now list (capped by state) and the leftover
skip_today list. Encodes the ADHD principles:

  * momentum first  -> cheapest highest-dopamine task floats to position 1
  * survival > optimization -> SURVIVAL_BOOST adds to score
  * reduce paralysis -> activation_energy weighted more negatively when bad
  * avoid stacking focus -> swap apart any two consecutive focus>=4 tasks
  * small lists when bad -> MAX_TASKS shrinks with state
"""
from app.data.weights import (
    PRIORITY_WEIGHTS, MAX_TASKS, SURVIVAL_BOOST, MOMENTUM_BOOST,
)
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


def prioritize(tasks: list[ScoredTask], state: str) -> tuple[list[ScoredTask], list[ScoredTask]]:
    if not tasks:
        return [], []

    for t in tasks:
        t.priority_score = _score(t, state)

    ordered = sorted(tasks, key=lambda t: t.priority_score, reverse=True)

    # Momentum boost: the cheapest, highest-dopamine task wins position 1.
    momentum = max(
        ordered,
        key=lambda t: t.scores.dopamine_reward - t.scores.activation_energy + (MOMENTUM_BOOST if t.scores.duration_minutes <= 5 else 0),
    )
    if momentum is not ordered[0]:
        ordered.remove(momentum)
        ordered.insert(0, momentum)

    ordered = _avoid_focus_stacking(ordered)

    cap = MAX_TASKS[state]
    return ordered[:cap], ordered[cap:]
