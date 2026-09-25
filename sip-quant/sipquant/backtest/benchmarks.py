"""Comparison strategies, all expressed as config overrides of the same simulator.

Re-using the one engine means every comparison gets identical costs, taxes,
timing and cash-flow handling - an apples-to-apples table.
"""
from __future__ import annotations

import pandas as pd

from ..config import with_overrides


def _only(cfg: dict, bucket: str) -> dict:
    """Allocation with 100% in ``bucket`` and 0% in every other configured bucket."""
    return {**{k: 0.0 for k in cfg["allocation"]}, bucket: 1.0}  # {**d, k: v} = copy d, then set k


def nifty50_only(cfg: dict) -> dict:
    return with_overrides(cfg, {"allocation": _only(cfg, "nifty50"), "strategy.regime.enabled": False})


def momentum_alone(cfg: dict) -> dict:
    """The momentum-quality sleeve on its own (100% of the SIP; regime/leftover money still goes to Nifty 50)."""
    return with_overrides(cfg, {"allocation": _only(cfg, "momentum")})


def without_bucket(cfg: dict, bucket: str) -> dict:
    """Same portfolio with ``bucket`` removed and its weight spread pro rata over the others."""
    alloc = {k: v for k, v in cfg["allocation"].items() if k != bucket}
    total = sum(alloc.values())
    return with_overrides(cfg, {"allocation": {k: v / total for k, v in alloc.items()}})


def momentum30(cfg: dict, market) -> tuple[dict, str]:
    """Nifty 200 Momentum 30: the real ETF/index if its history covers the SIP period, else a proxy.

    Returns (config, label). The proxy ranks the 200 most-traded names of our
    universe by the same 12-1 / volatility score and holds the top 30, equal
    weight, rebalanced semi-annually, no quality or regime filter. It is only an
    approximation (the real index uses 6- and 12-month momentum and free-float caps).
    """
    series = market.bench.get("momentum30_benchmark")
    if series is not None and series.first_valid_index() <= pd.Timestamp(cfg["sip"]["start"]) + pd.Timedelta(days=7):
        c = with_overrides(cfg, {"allocation": _only(cfg, "momentum30_benchmark"),
                                 "strategy.regime.enabled": False})
        return c, f"Nifty200 Mom30 ({market.bench_ticker['momentum30_benchmark']})"
    p = cfg["momentum30_proxy"]
    c = with_overrides(cfg, {
        "allocation": _only(cfg, "momentum"),
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
