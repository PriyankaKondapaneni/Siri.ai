from app.engine.parser import parse


def test_splits_on_commas_newlines_and_and():
    dump = "clean room, reply to manager\nstudy DSA and bathe"
    tasks, meta = parse(dump)
    assert tasks == ["clean room", "reply to manager", "study DSA", "bathe"]
    assert meta == []


def test_strips_lead_filler():
    tasks, _ = parse("need to clean room, have to bathe, i should reply to manager")
    assert tasks == ["clean room", "bathe", "reply to manager"]


def test_pulls_out_meta_phrases():
    tasks, meta = parse("clean room, feeling exhausted, too many things pending")
    assert tasks == ["clean room"]
    assert any("exhausted" in m for m in meta)
    assert any("too many" in m for m in meta)


def test_bullets_get_stripped():
    tasks, _ = parse("- clean room\n• reply to manager\n* bathe")
    assert tasks == ["clean room", "reply to manager", "bathe"]
