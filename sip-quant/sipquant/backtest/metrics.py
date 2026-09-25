"""Performance metrics.

Two kinds of return, because a SIP adds money every month:
  * XIRR  - money-weighted: the annual rate that makes all SIP outflows and the
            final value net to zero. This is "what did MY rupees earn".
  * CAGR / drawdown / yearly returns are computed on a unitised NAV (like a
    mutual fund NAV): each contribution buys units at that day's NAV, so the
    NAV only moves with performance, never with new money. Drawdown on raw
    portfolio value would be hidden by the monthly contributions.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def xirr(cashflows: list[tuple[pd.Timestamp, float]], guess: float = 0.1) -> float:
    """Annualised internal rate of return for irregular cash flows (Excel XIRR convention).

    Sign convention: money you pay in is negative, money you get back is positive.
    Uses Newton's method, falling back to bisection if Newton doesn't converge.
    """
    if not cashflows:
        return float("nan")
    dates = np.array([pd.Timestamp(d).value for d, _ in cashflows], dtype=float)
    amounts = np.array([a for _, a in cashflows], dtype=float)
    if not (amounts > 0).any() or not (amounts < 0).any():
        return float("nan")
    years = (dates - dates.min()) / (365.0 * 86400e9)  # Timestamp.value is nanoseconds

    def npv(r: float) -> float:
        return float(np.sum(amounts / (1.0 + r) ** years))

    def d_npv(r: float) -> float:
        return float(np.sum(-years * amounts / (1.0 + r) ** (years + 1)))

    r = guess
    for _ in range(100):
        f, df = npv(r), d_npv(r)
        if df == 0 or not np.isfinite(f):
            break
        step = f / df
        r_new = r - step
        if r_new <= -0.9999:
            break
        if abs(r_new - r) < 1e-10:
            return r_new
        r = r_new

    # Bisection fallback on a wide bracket.
    lo, hi = -0.9999, 10.0
    f_lo, f_hi = npv(lo), npv(hi)
    if np.sign(f_lo) == np.sign(f_hi):
        return float("nan")
    for _ in range(300):
        mid = (lo + hi) / 2
        f_mid = npv(mid)
        if abs(f_mid) < 1e-9 or hi - lo < 1e-12:
            return mid
        if np.sign(f_mid) == np.sign(f_lo):
            lo, f_lo = mid, f_mid
        else:
            hi = mid
    return (lo + hi) / 2


def cagr(nav: pd.Series) -> float:
    nav = nav.dropna()
    days = (nav.index[-1] - nav.index[0]).days
    return (nav.iloc[-1] / nav.iloc[0]) ** (365.25 / days) - 1 if days > 0 else float("nan")


def drawdown(nav: pd.Series) -> pd.Series:
    """Fractional distance below the running peak (0 at a new high, -0.3 = 30% below)."""
    return nav / nav.cummax() - 1


def max_drawdown(nav: pd.Series) -> float:
    return float(drawdown(nav).min())


def longest_underwater_days(nav: pd.Series) -> int:
    """Longest stretch (calendar days) from a peak until NAV first gets back to it.

    An unrecovered drawdown at the end counts up to the last date.
    """
    dd = drawdown(nav)
    longest, peak_date, under = 0, dd.index[0], False
    for d, v in dd.items():  # .items() iterates (index, value) pairs
        if v >= 0:
            if under:
                longest = max(longest, (d - peak_date).days)
                under = False
            peak_date = d
        else:
            under = True
    if under:
        longest = max(longest, (dd.index[-1] - peak_date).days)
    return longest


def calendar_year_returns(nav: pd.Series) -> pd.Series:
    """Return per calendar year from the unitised NAV (first/last years are partial)."""
    nav = nav.dropna()
    year_end = nav.groupby(nav.index.year).last()
    prev = year_end.shift(1)
    prev.iloc[0] = nav.iloc[0]
    return year_end / prev - 1
