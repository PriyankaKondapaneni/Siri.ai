"""Comparison strategies, all expressed as config overrides of the same simulator.

Re-using the one engine means every comparison gets identical costs, taxes,
timing and cash-flow handling - an apples-to-apples table.
"""
from __future__ import annotations

import pandas as pd

from ..config import with_overrides

INDEX_ONLY = {"momentum": 0.0, "midcap": 0.0, "nifty50": 0.0, "gold": 0.0}


def nifty50_only(cfg: dict) -> dict:
    return with_overrides(cfg, {"allocation": {**INDEX_ONLY, "nifty50": 1.0},  # {**d, k: v} = copy d, set k
                                "strategy.regime.enabled": False})


def momentum_alone(cfg: dict) -> dict:
    """The momentum-quality sleeve on its own (100% of the SIP; regime/leftover money still goes to Nifty 50)."""
    return with_overrides(cfg, {"allocation": {**INDEX_ONLY, "momentum": 1.0}})


def momentum30(cfg: dict, market) -> tuple[dict, str]:
    """Nifty 200 Momentum 30: the real ETF/index if its history covers the SIP period, else a proxy.

    Returns (config, label). The proxy ranks the 200 most-traded names of our
    universe by the same 12-1 / volatility score and holds the top 30, equal
    weight, rebalanced semi-annually, no quality or regime filter. It is only an
    approximation (the real index uses 6- and 12-month momentum and free-float caps).
    """
    series = market.bench.get("momentum30_benchmark")
    if series is not None and series.first_valid_index() <= pd.Timestamp(cfg["sip"]["start"]) + pd.Timedelta(days=7):
        c = with_overrides(cfg, {"allocation": {**INDEX_ONLY, "momentum30_benchmark": 1.0},
                                 "strategy.regime.enabled": False})
        return c, f"Nifty200 Mom30 ({market.bench_ticker['momentum30_benchmark']})"
    p = cfg["momentum30_proxy"]
    c = with_overrides(cfg, {
        "allocation": {**INDEX_ONLY, "momentum": 1.0},
        "strategy.top_n": p["top_n"],
        "strategy.sell_rank_buffer": p["top_n"],
        "strategy.rebalance": p["rebalance"],
        "strategy.quality.enabled": p["quality"],
        "strategy.regime.enabled": p["regime"],
        "strategy.whole_shares": False,
        "strategy.universe_top_by_liquidity": p["universe_top_by_liquidity"],
    })
    return c, "Nifty200 Mom30 (PROXY)"


def variant_grid(cfg: dict) -> list[tuple[str, dict]]:
    """Quality on/off x regime on/off x monthly/quarterly, on the full 4-bucket portfolio."""
    out = []
    for quality in (True, False):
        for regime in (True, False):
            for reb in ("quarterly", "monthly"):
                label = f"Q:{'on' if quality else 'off'} R:{'on' if regime else 'off'} {reb}"
                out.append((label, with_overrides(cfg, {
                    "strategy.quality.enabled": quality,
                    "strategy.regime.enabled": regime,
                    "strategy.rebalance": reb,
                })))
    return out
