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

COLUMNS = ["roe", "debt_to_equity", "eps", "fetched_at", "ok", "source", "schema"]
SCHEMA = 2  # bump when the fetch logic changes, so old cached rows are re-fetched
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
            if "ok" not in df.columns:  # cache written by the first version
                df["ok"] = df[FIELDS].notna().any(axis=1)
            if "schema" not in df.columns:
                df["schema"] = 1
            return df
        return pd.DataFrame(columns=COLUMNS).rename_axis("ticker")

    def update(self, tickers: list[str], max_age_days: int) -> pd.DataFrame:
        """Fetch tickers that are new, stale, or whose last fetch FAILED (failures are always retried)."""
        df = self.load()
        cutoff = pd.Timestamp.now() - pd.Timedelta(days=max_age_days)

        def needs_fetch(t):
            return (t not in df.index or not bool(df.at[t, "ok"])
                    or df.at[t, "schema"] != SCHEMA
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

    First tries ``Ticker.info``. Yahoo's info lacks ROE (and sometimes D/E) for
    most NSE stocks, so missing values are then computed from the annual income
    statement and balance sheet (see ``from_statements``).

    ``ok`` is False when Yahoo returned nothing usable (error, rate limit, empty
    reply); such rows are retried on the next run instead of being cached as
    "missing". ``ok`` True with a NaN field means Yahoo genuinely lacks that field.
    """
    import yfinance as yf

    tk = yf.Ticker(ticker)
    info = _with_retries(ticker, lambda: tk.info or {}, lambda x: len(x) > 5, default={})
    ok = len(info) > 5
    de = info.get("debtToEquity")
    row = {
        "roe": _num(info.get("returnOnEquity")),
        "debt_to_equity": _num(de) / 100.0 if de is not None else np.nan,  # % -> ratio
        "eps": _num(info.get("trailingEps")),
        "source": "info",
    }
    if ok and (np.isnan(row["roe"]) or np.isnan(row["debt_to_equity"])):
        income = _with_retries(ticker, lambda: tk.income_stmt, lambda x: x is not None, default=None)
        balance = _with_retries(ticker, lambda: tk.balance_sheet, lambda x: x is not None, default=None)
        roe, d_e = from_statements(income, balance)
        if np.isnan(row["roe"]) and not np.isnan(roe):
            row["roe"], row["source"] = roe, "statements"
        if np.isnan(row["debt_to_equity"]) and not np.isnan(d_e):
            row["debt_to_equity"] = d_e
            row["source"] = "statements" if row["source"] == "statements" else "info+statements"
    return {**row, "fetched_at": pd.Timestamp.now(), "ok": ok, "schema": SCHEMA}


def _with_retries(ticker, call, good, default):
    """Call ``call()`` up to RETRIES times with backoff until ``good(result)``."""
    for attempt in range(RETRIES):
        try:
            result = call()
            if good(result):
                return result
        except Exception as exc:  # rate limit, network hiccup, delisted ticker...
            log.debug("Yahoo call failed for %s (attempt %d): %s", ticker, attempt + 1, exc)
        if attempt < RETRIES - 1:
            wait = BACKOFF_SECONDS * 2 ** attempt
            log.info("  %s: no data from Yahoo, retrying in %ds", ticker, wait)
            time.sleep(wait)
    return default


NET_INCOME_ROWS = ["Net Income Common Stockholders", "Net Income",
                   "Net Income From Continuing Operation Net Minority Interest"]
EQUITY_ROWS = ["Stockholders Equity", "Common Stock Equity", "Total Equity Gross Minority Interest"]
DEBT_ROWS = ["Total Debt"]


def from_statements(income: pd.DataFrame | None, balance: pd.DataFrame | None) -> tuple[float, float]:
    """(ROE, debt/equity) from yfinance annual statements (rows = line items, columns = year-ends, newest first).

    ROE = latest net income / average of the latest two year-end equities (or the
    latest alone if only one year). Zero or negative equity -> NaN (fails the filter).
    D/E = latest total debt / latest equity.
    """
    ni = _latest(income, NET_INCOME_ROWS)
    eq_hist = _row(balance, EQUITY_ROWS)
    if eq_hist is None or eq_hist.dropna().empty:
        return np.nan, np.nan
    eq_hist = eq_hist.dropna()
    eq_now = float(eq_hist.iloc[0])
    if eq_now <= 0:
        return np.nan, np.nan
    eq_avg = float(eq_hist.iloc[:2].mean())
    roe = ni / eq_avg if not np.isnan(ni) and eq_avg > 0 else np.nan
    debt = _latest(balance, DEBT_ROWS)
    return roe, (debt / eq_now if not np.isnan(debt) else np.nan)


def _row(df: pd.DataFrame | None, names: list[str]) -> pd.Series | None:
    if df is None or df.empty:
        return None
    for name in names:
        if name in df.index:
            return df.loc[name].sort_index(ascending=False)  # newest year first
    return None


def _latest(df, names) -> float:
    r = _row(df, names)
    if r is None or r.dropna().empty:
        return np.nan
    return float(r.dropna().iloc[0])


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
    if "source" in fund:
        from_stmts = int(fund["source"].isin(["statements", "info+statements"]).sum())
        if from_stmts:
            notes.append(f"Fundamentals: {from_stmts} stocks had ROE and/or D/E computed from annual statements "
                         "(Yahoo's summary lacked them).")
    if failed:
        notes.append(f"WARNING: Yahoo returned NO data for {failed} of {n} stocks (errors/rate limit). "
                     "Re-run later; failed ones are retried automatically.")
    for msg in notes:
        log.warning(msg)
    return notes
