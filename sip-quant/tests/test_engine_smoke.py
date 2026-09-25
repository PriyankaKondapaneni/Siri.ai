"""End-to-end run on a small synthetic market: checks bookkeeping, not performance."""
import pandas as pd
import pytest

from sipquant.backtest import benchmarks as B
from sipquant.backtest.engine import Simulator
from sipquant.config import load_config, with_overrides
from sipquant.data import market as mk
from sipquant.data.synthetic import make_market


@pytest.fixture(scope="module")
def setup(monkeypatch_module=None):
    cfg = with_overrides(load_config(), {"sip.start": "2012-01-01", "sip.end": "2016-12-31",
                                         "strategy.liquidity.min_median_traded_value": 1e6})
    prices, bench, fund, uni = make_market(end="2017-01-31", n_stocks=80, seed=3)
    notes = []
    b, used = mk._pick_benchmarks(cfg, bench, notes)
    m = mk.Market(prices["close"], prices["adj_close"], prices["volume"], fund, uni, b, used, notes, True)
    return m, cfg


def test_value_equals_holdings_and_invested_is_right(setup):
    m, cfg = setup
    sim = Simulator(m, cfg)
    r = sim.run()
    last = r.value.index[-1]
    holdings = sum(q * sim.value_px.at[last, t] for t, q in sim.pos.items())
    assert r.value.iloc[-1] == pytest.approx(holdings)
    assert r.invested.iloc[-1] == 25_000 * 60
    assert len(r.cashflows) == 60
    assert r.value.index[0] == r.cashflows[0][0]
    assert r.exit_value <= r.value.iloc[-1]
    held_stocks = [t for t in sim.pos if t.endswith(".NS")]
    assert 0 < len(held_stocks) <= cfg["strategy"]["top_n"]


def test_nifty_only_pays_no_tax_until_exit(setup):
    m, cfg = setup
    r = Simulator(m, B.nifty50_only(cfg)).run()
    assert r.tax_paid == 0
    assert (r.trades["side"] == "BUY").all()
