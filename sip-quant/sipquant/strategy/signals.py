"""Filters and scores, computed for every date at once (vectorised).

pandas idiom: operations on a DataFrame apply to every cell/column at once, so
``adj.shift(21) / adj.shift(252) - 1`` computes the 12-1 return for every stock
on every date in one line, with no explicit loops. ``shift(n)`` moves data n
rows down, so row t sees the value from row t-n (n trading days earlier).

Every value on date t uses data up to and including t's close. The backtest
reads signals from the day *before* it trades, so there's no look-ahead.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

TRADING_DAYS = 252


def momentum_score(adj: pd.DataFrame, lookback: int = 252, skip: int = 21,
                   min_history: int = 240) -> pd.DataFrame:
    """Risk-adjusted 12-1 momentum: (P[t-skip] / P[t-lookback] - 1) / annualised volatility.

    Volatility = std of daily log returns over the last ``lookback`` days x sqrt(252).
    NaN where a stock has fewer than ``min_history`` prices in the window.
    """
    px = adj.ffill(limit=5)  # bridge short gaps (missing rows) but don't invent long histories
    ret_12_1 = px.shift(skip) / px.shift(lookback) - 1
    log_ret = np.log(px / px.shift(1))
    vol = log_ret.rolling(lookback, min_periods=min_history).std() * np.sqrt(TRADING_DAYS)
    enough = adj.notna().rolling(lookback + 1, min_periods=1).sum() >= min_history
    score = ret_12_1 / vol
    return score.where(enough & (vol > 0))  # .where(cond) keeps values where cond, else NaN


def median_traded_value(close: pd.DataFrame, volume: pd.DataFrame, lookback: int = 63) -> pd.DataFrame:
    return (close * volume).rolling(lookback, min_periods=int(lookback * 0.6)).median()


def liquidity_mask(close: pd.DataFrame, volume: pd.DataFrame, lookback: int,
                   min_value: float, min_price: float) -> pd.DataFrame:
    """True where 3-month median daily traded value > min_value AND price > min_price."""
    return (median_traded_value(close, volume, lookback) > min_value) & (close.ffill(limit=5) > min_price)


def quality_mask(fund: pd.DataFrame, min_roe: float, max_de: float, min_eps: float) -> pd.Series:
    """True where ROE > min, D/E < max and EPS > min. Missing data -> False (comparisons with NaN are False)."""
    return (fund["roe"] > min_roe) & (fund["debt_to_equity"] < max_de) & (fund["eps"] > min_eps)


def risk_on(signal: pd.Series, sma_days: int = 200) -> pd.Series:
    """True when the index closes at/above its SMA. Before the SMA exists we say risk-on (rule inactive)."""
    sma = signal.rolling(sma_days, min_periods=sma_days).mean()
    return (signal >= sma) | sma.isna()


@dataclass
class Signals:
    score: pd.DataFrame        # momentum score, date x ticker
    liquid: pd.DataFrame       # bool, date x ticker
    traded_value: pd.DataFrame # median traded value, date x ticker (for "top N by liquidity")
    quality: pd.Series         # bool per ticker (static: fundamentals are current-only)
    risk_on: pd.Series         # bool per date


def compute_signals(market, cfg: dict) -> Signals:
    s = cfg["strategy"]
    cal = market.calendar
    # Align every stock to the trading calendar so shift(n) means "n trading days".
    adj = market.adj_close.reindex(cal)
    close = market.close.reindex(cal)
    vol = market.volume.reindex(cal)
    liq = s["liquidity"]
    mom = s["momentum"]
    q = s["quality"]
    regime_series = market.bench["regime_signal"].reindex(cal).ffill()
    return Signals(
        score=momentum_score(adj, mom["lookback_days"], mom["skip_days"], mom["min_history_days"]),
        liquid=liquidity_mask(close, vol, liq["lookback_days"], liq["min_median_traded_value"], liq["min_price"]),
        traded_value=median_traded_value(close, vol, liq["lookback_days"]),
        quality=quality_mask(market.fundamentals, q["min_roe"], q["max_debt_to_equity"], q["min_eps"]),
        risk_on=risk_on(regime_series, s["regime"]["sma_days"]),
    )
