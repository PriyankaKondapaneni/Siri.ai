"""One object holding everything the strategy/backtest needs: `Market`.

``load_market(cfg)`` builds it from Yahoo (with the local cache), or
``load_market(cfg, synthetic=True)`` from the fake market in synthetic.py.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

import pandas as pd

from ..config import resolve_path
from . import fundamentals as fmod
from .clean import clean_frame
from .prices import PriceCache
from .synthetic import SYNTHETIC_BANNER, make_market
from .universe import load_universe

log = logging.getLogger(__name__)

SURVIVORSHIP_WARNING = ("WARNING: Universe = current constituents -> survivorship bias; "
                        "real returns likely lower.")


# @dataclass generates __init__, __repr__, __eq__ from the annotated fields (like a Java record).
@dataclass
class Market:
    close: pd.DataFrame          # split-adjusted close, date x ticker
    adj_close: pd.DataFrame      # total-return adjusted close, date x ticker
    volume: pd.DataFrame
    fundamentals: pd.DataFrame   # index ticker; roe, debt_to_equity, eps
    universe: pd.DataFrame       # index ticker; symbol, industry
    bench: dict[str, pd.Series]  # role ("nifty50", "midcap", ...) -> adjusted close
    bench_ticker: dict[str, str] # role -> which Yahoo ticker was actually used
    notes: list[str] = field(default_factory=list)  # caveats printed with every report
    synthetic: bool = False
    # Split-adjusted (not dividend-adjusted) close for non-universe tickers: ETFs you buy,
    # benchmark candidates, and any holding outside the Nifty 500. Used for live prices.
    other_close: pd.DataFrame = field(default_factory=pd.DataFrame)

    @property
    def calendar(self) -> pd.DatetimeIndex:
        """Trading days = days the Nifty 50 series has a price."""
        return self.bench["nifty50"].dropna().index

    def close_series(self, ticker: str) -> pd.Series:
        """Actual traded (split-adjusted) closes for any ticker we have; empty if unknown."""
        for frame in (self.close, self.other_close):
            if ticker in frame.columns:
                return frame[ticker].dropna()
        return pd.Series(dtype=float)

    def last_price(self, ticker: str, as_of: pd.Timestamp | None = None) -> float:
        s = self.close_series(ticker)
        if as_of is not None:
            s = s[s.index <= as_of]
        return float(s.iloc[-1]) if not s.empty else float("nan")


def load_market(cfg: dict, synthetic: bool = False, update: bool = True,
                extra_tickers: list[str] = ()) -> Market:
    """Build the Market. ``extra_tickers`` (e.g. your holdings) are downloaded and cached too."""
    notes = [SURVIVORSHIP_WARNING]
    instruments = list(cfg.get("live", {}).get("instruments", {}).values())
    if synthetic:
        prices, raw_bench, fund, universe = make_market(start=cfg["data"]["history_start"])
        notes.insert(0, SYNTHETIC_BANNER)
        other_close = pd.DataFrame(raw_bench)
    else:
        universe = load_universe(resolve_path(cfg["data"]["universe_csv"]))
        cache_dir = resolve_path(cfg["data"]["cache_dir"])
        bench_candidates = sorted({t for lst in cfg["tickers"].values() for t in lst})
        others = sorted((set(bench_candidates) | set(instruments) | set(extra_tickers)) - set(universe.index))
        cache = PriceCache(cache_dir)
        all_tickers = list(universe.index) + others
        prices = (cache.update(all_tickers, cfg["data"]["history_start"], cfg["data"]["download_batch_size"])
                  if update else cache.load())
        if prices["adj_close"].empty:
            raise RuntimeError("Price cache is empty. Run without --no-download first.")
        fcache = fmod.FundamentalsCache(cache_dir, cfg["data"].get("fundamentals_delay_seconds", 0.5))
        fund = (fcache.update(list(universe.index), cfg["data"]["fundamentals_max_age_days"])
                if update else fcache.load().reindex(universe.index))
        raw_bench = {t: prices["adj_close"][t] for t in bench_candidates if t in prices["adj_close"]}
        other_close = prices["close"][[t for t in others if t in prices["close"].columns]]

    fund = fund.reindex(universe.index)
    notes += fmod.report_missing(fund)
    notes.append("WARNING: Fundamentals are today's values applied to all past dates -> look-ahead bias "
                 "whenever the quality filter is on.")

    # Repair bad prints / unadjusted splits before anything uses the prices.
    stocks = [t for t in universe.index if t in prices["adj_close"].columns]
    prices = dict(prices)
    prices["adj_close"], fixed = clean_frame(prices["adj_close"][stocks], "stocks, adjusted close")
    prices["close"], _ = clean_frame(prices["close"][stocks], "stocks, close")
    bench_df, bench_fixed = clean_frame(pd.DataFrame(raw_bench), "benchmarks")
    other_close, _ = clean_frame(other_close, "ETFs / other holdings, close")
    raw_bench = {t: bench_df[t] for t in bench_df.columns}
    if fixed:
        notes.append(f"NOTE: repaired bad prices in {len(fixed)} stocks (bad prints / unadjusted splits); see log.")
    for t, fixes in bench_fixed.items():
        notes.append(f"NOTE: {t} price data repaired: " + "; ".join(fixes))

    bench, used = _pick_benchmarks(cfg, raw_bench, notes)
    return Market(
        close=prices["close"][stocks], adj_close=prices["adj_close"][stocks], volume=prices["volume"][stocks],
        fundamentals=fund, universe=universe, bench=bench, bench_ticker=used, notes=notes, synthetic=synthetic,
        other_close=other_close,
    )


def _pick_benchmarks(cfg: dict, raw: dict[str, pd.Series], notes: list[str]):
    """For each role, use the first candidate ticker whose history covers the SIP start."""
    sip_start = pd.Timestamp(cfg["sip"]["start"])
    bench, used = {}, {}
    for role, candidates in cfg["tickers"].items():
        available = [(t, raw[t].dropna()) for t in candidates if t in raw and raw[t].notna().any()]
        covering = [(t, s) for t, s in available if s.index[0] <= sip_start + pd.Timedelta(days=7)]
        if covering:
            t, s = covering[0]
        elif available:
            t, s = min(available, key=lambda ts: ts[1].index[0])  # lambda = inline function
            if role != "momentum30_benchmark":
                notes.append(f"WARNING: {role} proxy {t} only starts {s.index[0].date()}; "
                             "months before that are skipped for all strategies.")
        else:
            if role == "momentum30_benchmark":
                continue
            raise RuntimeError(f"No price data for any {role} ticker {candidates}")
        bench[role], used[role] = s, t
        if t != candidates[0]:
            notes.append(f"NOTE: {role} uses fallback ticker {t} (preferred {candidates[0]} unavailable/too short).")
        if role == "midcap" and t == "JUNIORBEES.NS":
            notes.append("WARNING: the midcap bucket is using JUNIORBEES (Nifty Next 50 = large caps), "
                         "so it understates midcap risk and return.")
    return bench, used
