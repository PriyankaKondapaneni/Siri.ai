"""Repair obvious Yahoo data errors before anything uses the prices.

NSE stocks and ETFs almost never move more than ~35% in a day (most stocks have
a 20% circuit limit), so a bigger one-day jump is nearly always one of:

  * a bad print - the price jumps and comes back within a few days
    -> the bad days are blanked out (later forward-filled);
  * an unadjusted split/bonus - the price jumps by ~1/2, 1/5, 1/10 ... and stays
    -> all earlier prices are rescaled by that factor.

Anything else is left alone and reported, so you can look at it.
"""
from __future__ import annotations

import logging

import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

JUMP = 0.35          # one-day move treated as suspicious (35%)
REVERT_DAYS = 5      # a bad print must revert within this many trading days
REVERT_TOL = 0.10    # "reverted" = back within 10% of the pre-jump price
SPLIT_FACTORS = np.array([2, 3, 4, 5, 10, 20, 25, 50, 100], dtype=float)
SPLIT_TOL = 0.06     # jump ratio within 6% of 1/f or f counts as a split


def clean_series(s: pd.Series) -> tuple[pd.Series, list[str]]:
    """Return (cleaned series, list of human-readable fixes)."""
    s = s.copy()
    fixes: list[str] = []
    accepted: set = set()  # unexplained jumps we've reported and decided to leave alone
    for _ in range(50):    # repeat: fixing one problem can expose the next
        v = s.dropna()
        if len(v) < 3:
            break
        ratio = v / v.shift(1)
        bad = ratio[((ratio > 1 + JUMP) | (ratio < 1 / (1 + JUMP))) & ~ratio.index.isin(list(accepted))]
        if bad.empty:
            break
        day = bad.index[0]
        i = v.index.get_loc(day)
        before, r = v.iloc[i - 1], bad.iloc[0]

        # 1) Bad print: price returns near the pre-jump level within a few days.
        after = v.iloc[i + 1 : i + 1 + REVERT_DAYS]
        back = after[(after / before - 1).abs() < REVERT_TOL]
        if not back.empty:
            end = v.index.get_loc(back.index[0])
            s.loc[v.index[i:end]] = np.nan
            fixes.append(f"{day.date()}: removed {end - i} bad print(s) ({r - 1:+.0%} then back)")
            continue

        # 2) Unadjusted split/bonus: ratio close to 1/f (or f for a reverse split).
        ratio_big = 1 / r if r < 1 else r
        near = np.abs(SPLIT_FACTORS / ratio_big - 1) < SPLIT_TOL
        if near.any():
            f = SPLIT_FACTORS[near][0]
            scale = 1 / f if r < 1 else f
            s.loc[s.index < day] *= scale
            fixes.append(f"{day.date()}: rescaled earlier prices by {scale:g} (unadjusted split, jump {r - 1:+.0%})")
            continue

        # 3) Unexplained: report it and move on.
        fixes.append(f"{day.date()}: UNEXPLAINED jump {r - 1:+.0%} left as is - please check")
        accepted.add(day)
    return s, fixes


def clean_frame(df: pd.DataFrame, label: str) -> tuple[pd.DataFrame, dict[str, list[str]]]:
    """Clean every column; returns (frame, {ticker: fixes}) and logs a summary."""
    out, report = df.copy(), {}
    for col in df.columns:
        if df[col].notna().sum() < 3:
            continue
        cleaned, fixes = clean_series(df[col])
        if fixes:
            out[col] = cleaned
            report[col] = fixes
    if report:
        log.warning("Data cleaning (%s): fixed/flagged %d tickers", label, len(report))
        for t, fixes in list(report.items())[:15]:
            log.warning("  %s: %s", t, "; ".join(fixes))
    return out, report
