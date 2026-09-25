"""Fundamentals (ROE, debt/equity, trailing EPS) from yfinance ``Ticker.info``, cached.

IMPORTANT: Yahoo only gives *today's* fundamentals. Using them in a backtest
that starts in 2011 is look-ahead bias (we "know" in 2011 which companies are
profitable in 2026). That is why the quality filter can be switched off.

Units: Yahoo's ``returnOnEquity`` is a fraction (0.18 = 18%) but its
``debtToEquity`` is a percentage (45.0 = 0.45x). We store D/E as a ratio.
"""
from __future__ import annotations

import logging
import time
from pathlib import Path

import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

COLUMNS = ["roe", "debt_to_equity", "eps", "fetched_at", "ok"]
FIELDS = ["roe", "debt_to_equity", "eps"]

RETRIES = 3            # attempts per ticker when Yahoo errors / rate-limits
BACKOFF_SECONDS = 15   # wait 15s, then 30s, between attempts
GIVE_UP_AFTER = 5      # this many tickers failing in a row = we're blocked; stop and retry next run
SAVE_EVERY = 25        # write the cache every N tickers so a crash loses little


class FundamentalsCache:
    def __init__(self, cache_dir: str | Path, delay_seconds: float = 0.5):
        self.path = Path(cache_dir) / "fundamentals.parquet"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.delay = delay_seconds

    def load(self) -> pd.DataFrame:
        if self.path.exists():
            df = pd.read_parquet(self.path)
            if "ok" not in df.columns:  # cache written by the first version: trust nothing that is all-NaN
                df["ok"] = df[FIELDS].notna().any(axis=1)
            return df
        return pd.DataFrame(columns=COLUMNS).rename_axis("ticker")

    def update(self, tickers: list[str], max_age_days: int) -> pd.DataFrame:
        """Fetch tickers that are new, stale, or whose last fetch FAILED (failures are always retried)."""
        df = self.load()
        cutoff = pd.Timestamp.now() - pd.Timedelta(days=max_age_days)

        def needs_fetch(t):
            return (t not in df.index or not bool(df.at[t, "ok"])
                    or pd.Timestamp(df.at[t, "fetched_at"]) < cutoff)

        todo = [t for t in tickers if needs_fetch(t)]
        if todo:
            log.info("Fundamentals: fetching %d tickers, ~%.1fs apart (slow on purpose: Yahoo rate-limits)",
                     len(todo), self.delay)
        rows, fails_in_a_row = {}, 0
        for i, t in enumerate(todo, 1):  # enumerate(...) yields (index, item) pairs
            rows[t] = fetch_one(t)
            fails_in_a_row = 0 if rows[t]["ok"] else fails_in_a_row + 1
            if fails_in_a_row >= GIVE_UP_AFTER:
                log.warning("Fundamentals: %d failures in a row - Yahoo is probably rate-limiting. Stopping; "
                            "run again in an hour and the remaining %d tickers will be fetched.",
                            fails_in_a_row, len(todo) - i)
                break
            time.sleep(self.delay)
            if i % SAVE_EVERY == 0:
                df = self._save(df, rows)
                rows = {}
                log.info("  fundamentals %d/%d", i, len(todo))
        df = self._save(df, rows)
        return df.reindex(tickers)

    def _save(self, df: pd.DataFrame, rows: dict) -> pd.DataFrame:
        if not rows:
            return df
        new = pd.DataFrame.from_dict(rows, orient="index")
        df = pd.concat([df.drop(index=[t for t in rows if t in df.index]), new])
        df.index.name = "ticker"
        df.to_parquet(self.path)
        return df


def fetch_one(ticker: str) -> dict:
    """Fetch one ticker's fundamentals. Never raises.

    ``ok`` is False when Yahoo returned nothing usable (error, rate limit, empty
    reply); such rows are retried on the next run instead of being cached as
    "missing". ``ok`` True with a NaN field means Yahoo genuinely lacks that field.
    """
    import yfinance as yf

    info: dict = {}
    for attempt in range(RETRIES):
        try:
            info = yf.Ticker(ticker).info or {}
            if len(info) > 5:  # a real reply has dozens of keys; a throttled one has ~0-3
                break
        except Exception as exc:  # rate limit, network hiccup, delisted ticker...
            log.debug("info() failed for %s (attempt %d): %s", ticker, attempt + 1, exc)
        if attempt < RETRIES - 1:
            wait = BACKOFF_SECONDS * 2 ** attempt
            log.info("  %s: no data from Yahoo, retrying in %ds", ticker, wait)
            time.sleep(wait)
    ok = len(info) > 5
    de = info.get("debtToEquity")
    return {
        "roe": _num(info.get("returnOnEquity")),
        "debt_to_equity": _num(de) / 100.0 if de is not None else np.nan,  # % -> ratio
        "eps": _num(info.get("trailingEps")),
        "fetched_at": pd.Timestamp.now(),
        "ok": ok,
    }


def _num(x) -> float:
    try:
        return float(x)
    except (TypeError, ValueError):
        return np.nan


def report_missing(fund: pd.DataFrame) -> list[str]:
    """Log and return notes on missing fundamentals (those tickers fail the quality filter)."""
    n = len(fund)
    failed = int((~fund["ok"].fillna(False).astype(bool)).sum()) if "ok" in fund else 0
    per_field = {f: int(fund[f].isna().sum()) for f in FIELDS}
    any_missing = int(fund[FIELDS].isna().any(axis=1).sum())
    notes = [f"Fundamentals: {any_missing} of {n} stocks lack ROE, D/E or EPS -> fail the quality filter "
             f"(missing ROE {per_field['roe']}, D/E {per_field['debt_to_equity']}, EPS {per_field['eps']})."]
    if failed:
        notes.append(f"WARNING: Yahoo returned NO data for {failed} of {n} stocks (errors/rate limit). "
                     "Re-run later; failed ones are retried automatically.")
    for msg in notes:
        log.warning(msg)
    return notes
