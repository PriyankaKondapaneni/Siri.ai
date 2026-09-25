"""Ranking and picking the top N, with a sell buffer to cut churn."""
from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


def rank_stocks(score: pd.Series, eligible: pd.Series) -> pd.DataFrame:
    """Rank eligible stocks by score (1 = best).

    Returns a DataFrame indexed by ticker, sorted best-first, with columns
    ``score``, ``rank`` and ``percentile`` (1.0 = best in the eligible set).
    """
    s = score[eligible.reindex(score.index, fill_value=False) & score.notna()]
    out = pd.DataFrame({"score": s.sort_values(ascending=False)})
    out["rank"] = range(1, len(out) + 1)
    out["percentile"] = out["score"].rank(pct=True)
    return out


def eligible_mask(sig, date: pd.Timestamp, cfg: dict) -> pd.Series:
    """Which stocks pass the filters on ``date`` (per config toggles)."""
    s = cfg["strategy"]
    ok = sig.liquid.loc[date].fillna(False).astype(bool)
    if s["quality"]["enabled"]:
        ok &= sig.quality.reindex(ok.index, fill_value=False)
    top_k = s.get("universe_top_by_liquidity")
    if top_k:  # used by the Nifty 200 Momentum 30 proxy: approximate "Nifty 200"
        tv = sig.traded_value.loc[date]
        ok &= tv.rank(ascending=False) <= top_k
    return ok


@dataclass
class Selection:
    final: list[str]  # the portfolio after rebalancing (<= top_n names)
    keep: list[str]   # current holdings that stay
    sell: list[str]   # current holdings to sell
    buy: list[str]    # new names to add


def select_with_buffer(ranked: pd.DataFrame, holdings: list[str], top_n: int, sell_rank: int) -> Selection:
    """Keep a holding while its rank <= ``sell_rank``; fill empty slots with the best new names.

    A holding that is no longer ranked at all (failed a filter, no data) is sold.
    If more than ``top_n`` holdings qualify to stay, the best-ranked ``top_n`` are kept.
    """
    rank = ranked["rank"]
    staying = [h for h in holdings if h in rank.index and rank[h] <= sell_rank]
    staying = sorted(staying, key=lambda t: rank[t])[:top_n]
    new = [t for t in ranked.index if t not in holdings][: top_n - len(staying)]
    final = sorted(staying + new, key=lambda t: rank[t])
    return Selection(
        final=final,
        keep=staying,
        sell=[h for h in holdings if h not in staying],
        buy=new,
    )
