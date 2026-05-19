from app.engine.categorizer import categorize
from app.engine.scoring import score


def test_reply_to_manager_is_high_emotional_resistance_quick():
    cat = categorize("reply to manager")
    assert cat == "communication"
    s = score("reply to manager", cat)
    assert s.emotional_resistance >= 6
    assert s.duration_minutes <= 5
    assert s.urgency >= 7  # manager keyword bumps urgency


def test_clean_room_is_high_activation_low_emo():
    cat = categorize("clean room")
    assert cat == "chore"
    s = score("clean room", cat)
    assert s.activation_energy >= 6
    assert s.emotional_resistance <= 3


def test_study_dsa_is_high_focus_high_activation():
    cat = categorize("study DSA")
    assert cat == "work"
    s = score("study DSA", cat)
    assert s.focus_required == 5
    assert s.activation_energy >= 7


def test_havent_eaten_is_survival_urgent():
    cat = categorize("havent eaten today")
    assert cat == "survival"
    s = score("havent eaten today", cat)
    assert s.urgency >= 7
    assert s.importance >= 9
