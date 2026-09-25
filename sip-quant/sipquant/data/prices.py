"""Daily prices from Yahoo Finance, cached locally as Parquet with incremental updates.

Cache layout (one wide table per field; rows = dates, columns = tickers)::

    data/cache/prices_close.parquet      split-adjusted close (Yahoo "Close")
    data/cache/prices_adj_close.parquet  split + dividend adjusted close (total return)
    data/cache/prices_volume.parquet     split-adjusted volume

Why keep both closes? Returns and portfolio values use ``adj_close`` (dividends
reinvested). The Rs 50 price filter and traded value use ``close``; note that
``close x volume`` is unaffected by split adjustment, so traded value is exact.

Incremental update: only dates after each ticker's last cached date are fetched
(with a few days of overlap). When a stock pays a dividend or splits, Yahoo
rescales its whole adjusted history; we detect that on the overlap and refetch
that ticker's full history so the series never has a jump in it.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

log = logging.getLogger(__name__)

FIELDS = {"close": "Close", "adj_close": "Adj Close", "volume": "Volume"}  # our name -> Yahoo column
OVERLAP_DAYS = 10
ADJ_MISMATCH_TOL = 0.005  # 0.5% difference on overlap => history was re-adjusted


class PriceCache:
    def __init__(self, cache_dir: str | Path):
        self.dir = Path(cache_dir)
        self.dir.mkdir(parents=True, exist_ok=True)

    def _path(self, field: str) -> Path:
        return self.dir / f"prices_{field}.parquet"

    def load(self) -> dict[str, pd.DataFrame]:
        """Return {field: DataFrame}; empty frames if nothing is cached yet."""
        frames = {}
        for field in FIELDS:
            p = self._path(field)
            frames[field] = pd.read_parquet(p) if p.exists() else pd.DataFrame()
        return frames

    def save(self, frames: dict[str, pd.DataFrame]) -> None:
        for field, df in frames.items():
            df.sort_index().to_parquet(self._path(field))

    # ------------------------------------------------------------------ update
    def update(self, tickers: list[str], history_start: str, batch_size: int = 50) -> dict[str, pd.DataFrame]:
        """Bring the cache up to date for ``tickers`` and return all cached frames."""
        frames = self.load()
        adj = frames["adj_close"]

        # Split tickers into never-seen (full download) and cached (incremental).
        new, cached = [], {}
        for t in tickers:
            if t in adj.columns and adj[t].notna().any():
                cached[t] = adj[t].last_valid_index()
            else:
                new.append(t)

        today = pd.Timestamp(date.today())
        stale = {t: last for t, last in cached.items() if last < today - pd.offsets.BDay(1)}
        log.info("Prices: %d new tickers, %d to update, %d already current",
                 len(new), len(stale), len(cached) - len(stale))

        # Incremental: one download from the oldest "last date" among stale tickers.
        refetch: list[str] = []
        if stale:
            start = (min(stale.values()) - timedelta(days=OVERLAP_DAYS)).strftime("%Y-%m-%d")
            fresh = _download_batched(list(stale), start, batch_size)
            refetch = _readjusted_tickers(adj, fresh["adj_close"])
            if refetch:
                log.info("Prices: %d tickers had their adjusted history rescaled (dividend/split); "
                         "refetching full history for them", len(refetch))
            frames = _merge(frames, fresh, drop=refetch)

        # Full downloads: brand new tickers plus the re-adjusted ones.
        full = new + refetch
        if full:
            fresh = _download_batched(full, history_start, batch_size)
            frames = _merge(frames, fresh, replace=full)

        self.save(frames)
        missing = [t for t in tickers if t not in frames["adj_close"].columns
                   or frames["adj_close"][t].isna().all()]
        if missing:
            log.warning("Prices: no data from Yahoo for %d tickers (e.g. %s)", len(missing), missing[:5])
        return frames


# ---------------------------------------------------------------------- helpers
def _download_batched(tickers: list[str], start: str, batch_size: int) -> dict[str, pd.DataFrame]:
    parts: dict[str, list[pd.DataFrame]] = {f: [] for f in FIELDS}
    for i in range(0, len(tickers), batch_size):
        batch = tickers[i : i + batch_size]  # slicing: [from, to) like subList()
        log.info("Downloading %d-%d of %d from %s", i + 1, i + len(batch), len(tickers), start)
        got = download(batch, start)
        for f in FIELDS:
            parts[f].append(got[f])
    return {f: pd.concat(dfs, axis=1) if dfs else pd.DataFrame() for f, dfs in parts.items()}


def download(tickers: list[str], start: str, end: str | None = None) -> dict[str, pd.DataFrame]:
    """Download OHLCV for ``tickers`` and return {field: DataFrame(date x ticker)}."""
    import yfinance as yf  # imported lazily so tests/synthetic runs don't need network libs

    raw = yf.download(
        tickers, start=start, end=end, auto_adjust=False, actions=False,
        group_by="column", progress=False, threads=True, multi_level_index=True,
    )
    out = {}
    for ours, theirs in FIELDS.items():
        if raw is None or raw.empty or theirs not in raw.columns.get_level_values(0):
            out[ours] = pd.DataFrame(columns=tickers, dtype=float)
            continue
        df = raw[theirs]
        if isinstance(df, pd.Series):  # a single ticker can come back as a Series
            df = df.to_frame(tickers[0])
        df.index = pd.to_datetime(df.index).tz_localize(None).normalize()
        out[ours] = df.astype(float)
    return out


def _readjusted_tickers(old: pd.DataFrame, new: pd.DataFrame) -> list[str]:
    """Tickers whose adjusted prices on overlapping dates differ by more than the tolerance."""
    bad = []
    common_dates = old.index.intersection(new.index)
    for t in new.columns.intersection(old.columns):
        o, n = old.loc[common_dates, t], new.loc[common_dates, t]
        both = o.notna() & n.notna()
        if both.any() and ((n[both] / o[both] - 1).abs() > ADJ_MISMATCH_TOL).any():
            bad.append(t)
    return bad


def _merge(frames: dict[str, pd.DataFrame], fresh: dict[str, pd.DataFrame],
           drop: list[str] = (), replace: list[str] = ()) -> dict[str, pd.DataFrame]:
    """Combine cached and freshly downloaded data. New values win on overlapping dates."""
    out = {}
    for f in FIELDS:
        old = frames[f].drop(columns=[c for c in [*drop, *replace] if c in frames[f].columns])
        new = fresh[f].drop(columns=[c for c in drop if c in fresh[f].columns])
        # combine_first: take `new` where it has a value, otherwise `old`.
        out[f] = new.combine_first(old) if not old.empty else new
    return out
