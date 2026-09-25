"""Module 5 (notify): alert state machine, news guard-rails, Telegram chunking."""
from types import SimpleNamespace

from sipquant.config import load_config
from sipquant.notify import news
from sipquant.notify.alerts import evaluate_alerts
from sipquant.notify.telegram import chunks

CFG = load_config()


def test_holding_alert_fires_once_and_rearms():
    msgs, st = evaluate_alerts({"X.NS": -0.30}, True, None, {}, CFG)
    assert any("X is -30.0%" in m for m in msgs)
    msgs, st = evaluate_alerts({"X.NS": -0.35}, True, None, st, CFG)
    assert msgs == []                                   # still down: no repeat
    msgs, st = evaluate_alerts({"X.NS": -0.10}, True, None, st, CFG)
    msgs, st = evaluate_alerts({"X.NS": -0.26}, True, None, st, CFG)
    assert len(msgs) == 1                               # re-armed after recovering


def test_regime_flip_alerts_both_ways_but_not_on_first_run():
    msgs, st = evaluate_alerts({}, True, None, {}, CFG)
    assert msgs == []
    msgs, st = evaluate_alerts({}, False, None, st, CFG)
    assert "BELOW" in msgs[0]
    msgs, st = evaluate_alerts({}, True, None, st, CFG)
    assert "ABOVE" in msgs[0]


def test_drawdown_levels_fire_in_order_and_rearm():
    msgs, st = evaluate_alerts({}, True, -0.22, {}, CFG)
    assert len(msgs) == 1 and "-20%" in msgs[0]
    msgs, st = evaluate_alerts({}, True, -0.31, st, CFG)
    assert len(msgs) == 1 and "-30%" in msgs[0]
    msgs, st = evaluate_alerts({}, True, -0.18, st, CFG)   # recovered, but not 5 pts above -20%
    msgs, st = evaluate_alerts({}, True, -0.21, st, CFG)
    assert msgs == []
    msgs, st = evaluate_alerts({}, True, -0.10, st, CFG)   # well above: both re-arm
    msgs, st = evaluate_alerts({}, True, -0.21, st, CFG)
    assert len(msgs) == 1


def test_advice_language_is_rejected():
    assert news.is_clean("The company reported quarterly revenue of Rs 1,200 crore and appointed a new CFO.")
    for bad in ["Analysts say investors should buy the dip.", "The stock will rise after results.",
                "Brokerage sets a target price of Rs 900.", "Shares look undervalued.", "A good time to sell."]:
        assert not news.is_clean(bad), bad


class FakeClient:
    """Stands in for anthropic.Anthropic(); records the request and returns a canned reply."""

    def __init__(self, reply, stop_reason="end_turn"):
        self.reply, self.stop_reason, self.calls = reply, stop_reason, []
        self.beta = SimpleNamespace(messages=SimpleNamespace(create=self._create))

    def _create(self, **kw):
        self.calls.append(kw)
        return SimpleNamespace(stop_reason=self.stop_reason,
                               content=[SimpleNamespace(type="text", text=self.reply)])


def test_summarise_uses_neutral_prompt_and_filters_output():
    good = FakeClient("The company announced a new plant in Pune.")
    assert news.summarise("ACME", ["ACME opens Pune plant"], "claude-opus-5", good) == good.reply
    sent = good.calls[0]
    assert "Never give an opinion" in sent["system"] and sent["fallbacks"] == "default"
    bad = FakeClient("Strong results; investors may want to buy more.")
    assert news.summarise("ACME", ["x"], "claude-opus-5", bad) == news.WITHHELD
    refused = FakeClient("", stop_reason="refusal")
    assert news.summarise("ACME", ["x"], "claude-opus-5", refused) == "(summary unavailable)"
    assert news.summarise("ACME", [], "claude-opus-5", good) == "No recent headlines."


def test_news_section_disabled_without_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setattr(news.env, "load_env", lambda: None)
    assert news.news_section(["A.NS"], CFG) is None


def test_chunks_respect_limit_and_keep_all_text():
    text = "\n".join(f"line {i} " + "x" * 50 for i in range(300))
    parts = chunks(text, limit=1000)
    assert all(len(p) <= 1000 for p in parts)
    assert "".join(parts).replace("\n", "") == text.replace("\n", "")
