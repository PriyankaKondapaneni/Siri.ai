"""Portfolio tracker: current value, amount invested, XIRR and drawdown, from holdings.csv.

Limitations (holdings.csv only lists what you still own):
  * Sold lots and their proceeds aren't known, so XIRR covers current holdings only.
  * Value history uses split-adjusted closes (dividends received aren't added back).
"""
from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from ..backtest import metrics as M
from .context import LiveContext
from .holdings import positions, split_buckets
from .plan import DISCLAIMER


@dataclass
class PortfolioStatus:
    as_of: pd.Timestamp
    value: float
    invested: float
    xirr: float
    drawdown: float          # current drawdown from peak of the unitised NAV (0 = at a high)
    max_drawdown: float
    holdings: pd.DataFrame   # per ticker: qty, avg_cost, price, value, return, weight, bucket
    missing_prices: list[str]


def portfolio_status(ctx: LiveContext) -> PortfolioStatus | None:
    lots = ctx.lots
    if lots.empty:
        return None
    pos = positions(lots)
    _, etf_bucket = split_buckets(pos.index, ctx.cfg)
    pos["price"] = [ctx.price(t) for t in pos.index]
    missing = [t for t in pos.index if pd.isna(pos.at[t, "price"])]
    pos["value"] = pos["qty"] * pos["price"]
    pos["return"] = pos["price"] / pos["avg_cost"] - 1
    pos["weight"] = pos["value"] / pos["value"].sum()
    pos["bucket"] = [etf_bucket.get(t, "momentum") for t in pos.index]

    value_hist, nav = _history(ctx)
    value = float(pos["value"].sum())
    flows = [(d, -float(q * p)) for d, q, p in zip(lots["buy_date"], lots["qty"], lots["buy_price"])]
    xirr = M.xirr(flows + [(ctx.as_of, value)])
    dd = M.drawdown(nav) if not nav.empty else pd.Series([0.0])
    return PortfolioStatus(ctx.as_of, value, float(pos["invested"].sum()), xirr, float(dd.iloc[-1]),
                           float(dd.min()), pos.sort_values("value", ascending=False), missing)


def _history(ctx: LiveContext) -> tuple[pd.Series, pd.Series]:
    """Daily portfolio value and unitised NAV since the first purchase."""
    lots = ctx.lots
    days = ctx.market.calendar
    days = days[(days >= lots["buy_date"].min()) & (days <= ctx.as_of)]
    if days.empty:
        return pd.Series(dtype=float), pd.Series(dtype=float)
    value = pd.Series(0.0, index=days)
    for t, grp in lots.groupby("ticker"):
        px = ctx.market.close_series(t).reindex(days).ffill()
        # Cumulative quantity held on each trading day (a lot bought on a holiday counts from the next day).
        qty = grp.set_index("buy_date")["qty"].groupby(level=0).sum()
        held = qty.reindex(days.union(qty.index)).fillna(0).cumsum().reindex(days)
        value = value.add((held * px).fillna(0.0), fill_value=0.0)
    # Unitise: each purchase buys units at that day's NAV (value before the purchase).
    buys = (lots.assign(cost=lots["qty"] * lots["buy_price"])
            .groupby("buy_date")["cost"].sum())
    buys.index = [days[days >= d][0] if (days >= d).any() else days[-1] for d in buys.index]
    buys = buys.groupby(level=0).sum()
    units, nav_vals, prev_nav = 0.0, [], 100.0
    for d in days:
        cash_in = float(buys.get(d, 0.0))
        pre_value = value[d] - cash_in  # approx: value just before today's purchase
        nav_today = prev_nav if units == 0 else max(pre_value, 0.0) / units
        units += cash_in / (nav_today or prev_nav)
        prev_nav = value[d] / units if units else prev_nav
        nav_vals.append(prev_nav)
    return value, pd.Series(nav_vals, index=days)


def format_status(st: PortfolioStatus | None) -> str:
    if st is None:
        return "Portfolio: no holdings.csv yet (add your purchases to track value, XIRR and drawdown)."
    gain = st.value - st.invested
    lines = [f"Portfolio as of {st.as_of:%d %b %Y}",
             f"  Value     Rs {st.value:>12,.0f}",
             f"  Invested  Rs {st.invested:>12,.0f}   ({gain:+,.0f}, {gain / st.invested:+.1%})",
             f"  XIRR      {st.xirr:>+15.1%}" if pd.notna(st.xirr) else "  XIRR      n/a",
             f"  Drawdown  {st.drawdown:>+15.1%} from peak (worst so far {st.max_drawdown:+.1%})", "",
             f"  {'Symbol':<12} {'Qty':>7} {'Avg cost':>9} {'Price':>9} {'Return':>8} {'Weight':>7}"]
    for t, r in st.holdings.iterrows():
        lines.append(f"  {t.removesuffix('.NS'):<12} {r['qty']:>7,.0f} {r['avg_cost']:>9,.1f} {r['price']:>9,.1f} "
                     f"{r['return']:>+8.1%} {r['weight']:>7.1%}")
    by_bucket = st.holdings.groupby("bucket")["value"].sum() / st.value
    lines += ["", "  By bucket: " + ", ".join(f"{b} {w:.0%}" for b, w in by_bucket.items())]
    if st.missing_prices:
        lines.append("  No price for: " + ", ".join(st.missing_prices))
    lines += ["  (XIRR covers current holdings only; sold lots aren't in holdings.csv.)", "", DISCLAIMER]
    return "\n".join(lines)
