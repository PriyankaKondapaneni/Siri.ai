import numpy as np
import pandas as pd
import pytest

from sipquant.strategy.selection import rank_stocks
from sipquant.strategy.signals import liquidity_mask, momentum_score, quality_mask


def _prices(log_returns, start=100.0):
    idx = pd.bdate_range("2020-01-01", periods=len(log_returns) + 1)
    return pd.Series(start * np.exp(np.concatenate([[0.0], np.cumsum(log_returns)])), index=idx)


def test_score_matches_hand_calculation():
    rng = np.random.default_rng(0)
    r = rng.normal(0.001, 0.02, 300)
    p = _prices(r)
    got = momentum_score(p.to_frame("X"), lookback=252, skip=21, min_history=240)["X"].iloc[-1]

    ret_12_1 = p.iloc[-1 - 21] / p.iloc[-1 - 252] - 1
    vol = np.std(np.diff(np.log(p.values))[-252:], ddof=1) * np.sqrt(252)
    assert got == pytest.approx(ret_12_1 / vol, rel=1e-9)


def test_most_recent_month_is_ignored():
    rng = np.random.default_rng(1)
    base = rng.normal(0.001, 0.01, 300)
    a, b = base.copy(), base.copy()
    b[-5:] += 0.05  # huge jump in the last week: changes vol a bit but not the 12-1 return
    sa = momentum_score(_prices(a).to_frame("A"))["A"].iloc[-1]
    sb = momentum_score(_prices(b).to_frame("B"))["B"].iloc[-1]
    ra = _prices(a).iloc[-22] / _prices(a).iloc[-253] - 1
    rb = _prices(b).iloc[-22] / _prices(b).iloc[-253] - 1
    assert ra == pytest.approx(rb)
    assert abs(sb) < abs(sa)  # same return, higher volatility -> smaller risk-adjusted score


def test_short_history_is_nan():
    p = _prices(np.full(200, 0.001) + np.tile([0.01, -0.01], 100))
    assert momentum_score(p.to_frame("X"))["X"].isna().all()


def test_rank_is_descending_and_respects_eligibility():
    score = pd.Series({"A": 1.0, "B": 3.0, "C": 2.0, "D": np.nan, "E": 5.0})
    eligible = pd.Series({"A": True, "B": True, "C": True, "D": True, "E": False})
    ranked = rank_stocks(score, eligible)
    assert list(ranked.index) == ["B", "C", "A"]
    assert list(ranked["rank"]) == [1, 2, 3]
    assert ranked.loc["B", "percentile"] == 1.0


def test_liquidity_and_quality_filters():
    idx = pd.bdate_range("2024-01-01", periods=70)
    close = pd.DataFrame({"LIQ": 100.0, "THIN": 100.0, "CHEAP": 40.0}, index=idx)
    vol = pd.DataFrame({"LIQ": 1e6, "THIN": 1e4, "CHEAP": 1e7}, index=idx)
    mask = liquidity_mask(close, vol, lookback=63, min_value=5e7, min_price=50).iloc[-1]
    assert mask.to_dict() == {"LIQ": True, "THIN": False, "CHEAP": False}

    fund = pd.DataFrame({"roe": [0.2, 0.2, 0.1, np.nan], "debt_to_equity": [0.5, 1.5, 0.5, 0.5],
                         "eps": [10, 10, 10, 10]}, index=list("WXYZ"))
    assert quality_mask(fund, 0.15, 1.0, 0.0).to_dict() == {"W": True, "X": False, "Y": False, "Z": False}
