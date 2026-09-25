"""Fundamentals (ROE, debt/equity, trailing EPS) from yfinance ``Ticker.info``, cached.

IMPORTANT: Yahoo only gives *today's* fundamentals. Using them in a backtest
that starts in 2011 is look-ahead bias (we "know" in 2011 which companies are
profitable in 2026). That is why the quality filter can be switched off.

Units: Yahoo's ``returnOnEquity`` is a fraction (0.18 = 18%) but its
``debtToEquity`` is a percentage (45.0 = 0.45x). We store D/E as a ratio.
"""
from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

COLUMNS = ["roe", "debt_to_equity", "eps", "fetched_at"]


class FundamentalsCache:
    def __init__(self, cache_dir: str | Path):
        self.path = Path(cache_dir) / "fundamentals.parquet"
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> pd.DataFrame:
        if self.path.exists():
            return pd.read_parquet(self.path)
        return pd.DataFrame(columns=COLUMNS).rename_axis("ticker")

    def update(self, tickers: list[str], max_age_days: int) -> pd.DataFrame:
        df = self.load()
        cutoff = pd.Timestamp.now() - pd.Timedelta(days=max_age_days)
        todo = [t for t in tickers if t not in df.index or pd.Timestamp(df.at[t, "fetched_at"]) < cutoff]
        if todo:
            log.info("Fundamentals: fetching %d tickers (this is slow: one request each)", len(todo))
        rows = {}
        for i, t in enumerate(todo, 1):  # enumerate(...) yields (index, item) pairs
            rows[t] = fetch_one(t)
            if i % 50 == 0:
                log.info("  fundamentals %d/%d", i, len(todo))
        if rows:
            new = pd.DataFrame.from_dict(rows, orient="index")
            df = pd.concat([df.drop(index=[t for t in rows if t in df.index]), new])
            df.index.name = "ticker"
            df.to_parquet(self.path)
        return df.reindex(tickers)


def fetch_one(ticker: str) -> dict:
    """Fetch one ticker's fundamentals. Anything missing becomes NaN (never raises)."""
    import yfinance as yf

    try:
        info = yf.Ticker(ticker).info or {}
    except Exception as exc:  # network hiccups, delisted tickers, Yahoo schema changes...
        log.debug("info() failed for %s: %s", ticker, exc)
        info = {}
    de = info.get("debtToEquity")
    return {
        "roe": _num(info.get("returnOnEquity")),
        "debt_to_equity": _num(de) / 100.0 if de is not None else np.nan,  # % -> ratio
        "eps": _num(info.get("trailingEps")),
        "fetched_at": pd.Timestamp.now(),
    }


def _num(x) -> float:
    try:
        return float(x)
    except (TypeError, ValueError):
        return np.nan


def report_missing(fund: pd.DataFrame) -> int:
    """Log how many tickers lack any of the three fields (they fail the quality filter)."""
    missing = fund[["roe", "debt_to_equity", "eps"]].isna().any(axis=1)
    n = int(missing.sum())
    log.warning("Fundamentals: %d of %d tickers have missing ROE/D-E/EPS -> treated as failing "
                "the quality filter", n, len(fund))
    return n
