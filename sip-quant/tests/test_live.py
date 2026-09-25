"""Module 4 (live): holdings parsing, monthly plan, rebalance tax estimate, tracker."""
from datetime import datetime

import pandas as pd
import pytest

from sipquant.config import load_config, with_overrides
from sipquant.live.context import IST, LiveContext, build_context, last_complete_day
from sipquant.live.holdings import load_holdings, positions
from sipquant.live.plan import monthly_plan, rebalance_plan
from sipquant.live.tracker import portfolio_status


def write(tmp_path, text, name="holdings.csv"):
    p = tmp_path / name
    p.write_text(text)
    return p


def test_load_holdings_normalises_and_validates(tmp_path):
    p = write(tmp_path, "Symbol,Qty,Buy_Date,Buy_Price\nreliance,2,2024-01-02,2500\nNIFTYBEES.NS,10,2024-01-02,250\n")
    lots = load_holdings(p)
    assert list(lots["ticker"]) == ["RELIANCE.NS", "NIFTYBEES.NS"]
    bad = write(tmp_path, "symbol,qty,buy_date,buy_price\nINFY,-1,2024-01-02,1500\n", "bad.csv")
    with pytest.raises(ValueError, match="line"):
        load_holdings(bad)
    assert load_holdings(tmp_path / "missing.csv").empty


def test_positions_average_cost():
    lots = pd.DataFrame({"ticker": ["A", "A"], "symbol": ["A", "A"], "qty": [10, 30],
                         "buy_date": pd.to_datetime(["2024-01-01", "2024-02-01"]), "buy_price": [100.0, 200.0]})
    pos = positions(lots)
    assert pos.at["A", "qty"] == 40 and pos.at["A", "avg_cost"] == pytest.approx(175.0)


def test_last_complete_day_skips_partial_bar():
    cal = pd.bdate_range("2026-09-21", "2026-09-25")
    cfg = load_config()
    morning = datetime(2026, 9, 25, 9, 30, tzinfo=IST)
    evening = datetime(2026, 9, 25, 16, 0, tzinfo=IST)
    assert last_complete_day(cal, cfg, morning) == pd.Timestamp("2026-09-24")
    assert last_complete_day(cal, cfg, evening) == pd.Timestamp("2026-09-25")


@pytest.fixture(scope="module")
def ctx_factory(tmp_path_factory):
    base = tmp_path_factory.mktemp("live")

    def make(holdings_text=None, **overrides):
        path = base / f"h{len(list(base.iterdir()))}.csv"
        if holdings_text:
            path.write_text(holdings_text)
        cfg = with_overrides(load_config(), {"live.holdings_csv": str(path), **overrides})
        return build_context(cfg, synthetic=True, now=datetime(2026, 9, 24, 18, 0, tzinfo=IST))
    return make


def test_monthly_plan_spends_the_sip_and_nothing_more(ctx_factory):
    ctx = ctx_factory()
    plan = monthly_plan(ctx)
    stock = plan.stock_buys["cost"].sum()
    etf = plan.etf_units["cost"].sum()
    assert stock + etf + plan.leftover == pytest.approx(25_000, abs=1)
    assert len(plan.stock_buys) == 15                       # all picks listed, bought or not
    assert (plan.stock_buys["qty"] >= 0).all()
    assert all(float(q).is_integer() for q in plan.stock_buys["qty"])


def test_regime_rule_moves_stock_money_to_nifty(ctx_factory):
    ctx = ctx_factory(**{"strategy.regime.enabled": True})
    ctx.signals.risk_on.loc[ctx.as_of] = False
    plan = monthly_plan(ctx)
    assert plan.stock_buys["qty"].sum() == 0
    assert plan.bucket_amounts["nifty50"] == pytest.approx(25_000 * 0.65)


def test_rebalance_sells_below_buffer_with_tax_estimate(ctx_factory):
    ctx0 = ctx_factory()
    ranked = ctx0.ranked()
    worst_ok = ranked.index[30]                       # rank 31: below the 25 buffer -> sell
    good = ranked.index[0]                            # rank 1: keep
    text = (f"symbol,qty,buy_date,buy_price\n{worst_ok.removesuffix('.NS')},10,2026-06-01,1\n"
            f"{good.removesuffix('.NS')},1,2026-06-01,1\n")
    ctx = ctx_factory(text)
    plan = rebalance_plan(ctx)
    assert list(plan.sells["ticker"]) == [worst_ok]
    row = plan.sells.iloc[0]
    assert row["term"] == "ST"
    assert row["est_tax"] == pytest.approx(row["gain"] * 0.20, rel=1e-6)
    assert good in plan.keep
    assert plan.buys["cost"].sum() <= plan.cash_after_tax + 1e-6


def test_tracker_value_xirr_and_drawdown(ctx_factory):
    ctx = ctx_factory("symbol,qty,buy_date,buy_price\nNIFTYBEES,10,2025-09-24,100\n")
    st = portfolio_status(ctx)
    price = ctx.price("NIFTYBEES.NS")
    assert st.value == pytest.approx(10 * price)
    assert st.invested == 1000
    assert st.xirr == pytest.approx((price / 100) ** (365 / (ctx.as_of - pd.Timestamp("2025-09-24")).days) - 1,
                                    rel=1e-3)
    assert -1 < st.drawdown <= 0 and st.max_drawdown <= st.drawdown
