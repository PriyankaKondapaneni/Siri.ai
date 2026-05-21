from app.engine.cognitive_load import adjacency_penalty, plan_load, task_load
from app.engine.categorizer import categorize
from app.engine.scoring import score
from app.models.task import ScoredTask


def _scored(raw: str) -> ScoredTask:
    cat = categorize(raw)
    return ScoredTask(raw=raw, category=cat, scores=score(raw, cat))


def test_scoring_populates_new_fields():
    s = score("study DSA", "work")
    assert 0 <= s.context_switching_cost <= 5
    assert 0 <= s.maintenance_burden <= 10
    assert s.cognitive_load > 0
    # work is deep focus + high context switch -> heavy
    assert s.cognitive_load >= 9


def test_quick_communication_is_light():
    s = score("reply to manager", "communication")
    # short, low focus -> relatively light despite emotional resistance
    assert s.cognitive_load < score("study DSA", "work").cognitive_load


def test_task_load_formula_matches_components():
    # focus 5, dur 30, emo 4, ctx 4, maint 3
    expected = 5 * 2 + 30 / 10 + 4 / 2 + 4 + 3 / 4
    assert task_load(5, 30, 4, 4, 3) == round(expected, 2)


def test_adjacency_penalty_counts_consecutive_deep_focus():
    a = _scored("study DSA")          # focus 5
    b = _scored("review the spec doc")  # focus ~5 (work)
    c = _scored("reply to alice")      # focus 2 (comm)
    # a,b are both high focus -> one penalty; b,c not -> none
    assert adjacency_penalty([a, b, c]) >= 2.0
    assert adjacency_penalty([a, c, b]) == 0.0


def test_plan_load_sums_tasks_plus_adjacency():
    a = _scored("study DSA")
    b = _scored("write the design doc")
    total = plan_load([a, b])
    assert total >= a.scores.cognitive_load + b.scores.cognitive_load
