"""This month's buy list and the quarterly rebalance list, computed from today's data.

Both use exactly the same rules as the backtest (engine.py): the same ranking,
sell buffer, "fill the most under-weight names first" allocation, whole shares,
and leftover rupees rolling into the Nifty 50 bucket.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import pandas as pd

from ..backtest.engine import REBALANCE_MONTHS, allocate_to_picks
from ..backtest.tax import financial_year, is_long_term
from ..strategy.selection import select_with_buffer
from .context import LiveContext
from .holdings import ledger_from_lots, positions, split_buckets

DISCLAIMER = "Personal use only. Not investment advice. Do not share as recommendations."


# ------------------------------------------------------------------ helpers
def _unit_cost(ctx: LiveContext, price: float) -> float:
    c = ctx.cfg["costs"]
    return price * (1 + c["slippage"]) * (1 + c["brokerage_and_charges"])


def _held_stocks(ctx: LiveContext) -> pd.DataFrame:
    pos = positions(ctx.lots)
    stocks, _ = split_buckets(pos.index, ctx.cfg)
    return pos.loc[stocks]


def is_rebalance_month(cfg: dict, month: int) -> bool:
    return month in REBALANCE_MONTHS[cfg["strategy"]["rebalance"]]


# ------------------------------------------------------------------ monthly
@dataclass
class MonthlyPlan:
    as_of: pd.Timestamp
    amount: float
    risk_on: bool
    regime_rule_enabled: bool
    bucket_amounts: dict[str, float]          # rupees per bucket after the regime rule + leftovers
    stock_buys: pd.DataFrame                  # ticker, industry, rank, score, price, qty, cost
    etf_units: pd.DataFrame                   # bucket, ticker, price, units, cost (etf mode)
    leftover: float                           # rupees that couldn't be spent (ETF rounding)
    not_buying: list[str] = field(default_factory=list)  # holdings that fell below the sell buffer
    notes: list[str] = field(default_factory=list)


def monthly_plan(ctx: LiveContext) -> MonthlyPlan:
    cfg, s = ctx.cfg, ctx.cfg["strategy"]
    amount = float(cfg["sip"]["monthly_amount"])
    flows = {k: amount * v for k, v in cfg["allocation"].items() if v > 0}
    risk_on, rule = ctx.risk_on(), s["regime"]["enabled"]
    notes = []
    if rule and not risk_on and "momentum" in flows:
        flows["nifty50"] = flows.get("nifty50", 0.0) + flows.pop("momentum")
        notes.append("Regime rule is ON and the market is below its 200-day average: "
                     "this month's stock money goes to the Nifty 50 bucket.")

    held = _held_stocks(ctx)
    ranked = ctx.ranked()
    sel = select_with_buffer(ranked, list(held.index), s["top_n"], s["sell_rank_buffer"])
    picks = [p for p in sel.final if not math.isnan(ctx.price(p))]

    stock_money = flows.pop("momentum", 0.0)
    ucost = {p: _unit_cost(ctx, ctx.price(p)) for p in picks}
    held_val = {p: float(held.at[p, "qty"]) * ctx.price(p) if p in held.index else 0.0 for p in picks}
    qty = allocate_to_picks(stock_money, picks, held_val, ucost, whole_shares=True) if stock_money else {}
    # One row per pick, including picks that get no share this month (qty 0).
    rows = [{"ticker": t, "symbol": t.removesuffix(".NS"), "industry": ctx.industry(t),
             "rank": int(ranked.at[t, "rank"]), "score": float(ranked.at[t, "score"]),
             "price": ctx.price(t), "qty": int(qty.get(t, 0)), "cost": qty.get(t, 0) * ucost[t]} for t in picks]
    buys = pd.DataFrame(rows, columns=["ticker", "symbol", "industry", "rank", "score", "price", "qty", "cost"])
    buys = buys.sort_values("rank").reset_index(drop=True)
    spent = float(buys["cost"].sum())
    if stock_money - spent > 0.5:
        flows["nifty50"] = flows.get("nifty50", 0.0) + (stock_money - spent)
        notes.append(f"Rs {stock_money - spent:,.0f} left over from whole-share rounding goes to the Nifty 50 bucket.")

    etf_rows, leftover = [], 0.0
    if cfg["live"]["index_buckets_as"] == "etf":
        for bucket, money in flows.items():
            ticker = cfg["live"]["instruments"][bucket]
            price = ctx.price(ticker)
            if math.isnan(price):
                notes.append(f"No price for {ticker}: buy Rs {money:,.0f} of the {bucket} bucket manually.")
                continue
            units = math.floor(money / _unit_cost(ctx, price))
            etf_rows.append({"bucket": bucket, "ticker": ticker, "price": price, "units": units,
                             "cost": units * _unit_cost(ctx, price)})
            leftover += money - units * _unit_cost(ctx, price)
        if leftover > 0.5:
            notes.append(f"Rs {leftover:,.0f} can't buy a whole ETF unit; keep it for next month.")
        if "international" in flows:
            notes.append(f"{cfg['live']['instruments']['international'].removesuffix('.NS')} can trade above its "
                         "real value (iNAV, shown on nseindia.com). Check the premium and use a limit order.")
    etfs = pd.DataFrame(etf_rows, columns=["bucket", "ticker", "price", "units", "cost"])

    not_buying = [t for t in held.index if t not in sel.final]
    if not_buying:
        notes.append("Not buying more of (below the sell buffer; sold at the next rebalance): "
                     + ", ".join(t.removesuffix(".NS") for t in not_buying))
    return MonthlyPlan(ctx.as_of, amount, risk_on, rule, flows, buys, etfs, leftover, not_buying, notes)


def format_monthly(p: MonthlyPlan) -> str:
    lines = [f"SIP plan for {p.as_of + pd.offsets.BDay(1):%b %Y}  (prices as of {p.as_of:%d %b %Y})",
             f"Monthly amount: Rs {p.amount:,.0f}",
             f"Market regime: {'ABOVE' if p.risk_on else 'BELOW'} 200-day average; regime rule "
             f"{'ON' if p.regime_rule_enabled else 'OFF (info only)'}", ""]
    stock_total = float(p.stock_buys["cost"].sum())
    lines.append("Allocation:")
    lines.append(f"  Momentum stocks   Rs {stock_total:>10,.0f}")
    for bucket, money in p.bucket_amounts.items():
        lines.append(f"  {bucket:<17} Rs {money:>10,.0f}")
    if not p.stock_buys.empty:
        n_buy = int((p.stock_buys["qty"] > 0).sum())
        lines += ["", f"Momentum picks ({len(p.stock_buys)}; buying {n_buy} this month):",
                  f"  {'#':>3} {'Symbol':<12} {'Qty':>5} {'Price':>9} {'Cost':>9}  Industry"]
        for r in p.stock_buys.itertuples():
            qty = f"{r.qty:>5}" if r.qty else "    -"
            lines.append(f"  {r.rank:>3} {r.symbol:<12} {qty} {r.price:>9,.1f} {r.cost:>9,.0f}  {r.industry[:28]}")
        if n_buy < len(p.stock_buys):
            lines.append("  ('-' = one share would overshoot this name's target weight; it builds up over the months)")
    if not p.etf_units.empty:
        lines += ["", "Index ETFs:"]
        for r in p.etf_units.itertuples():
            lines.append(f"  {r.ticker.removesuffix('.NS'):<12} {r.units:>5} units x {r.price:,.2f} = Rs {r.cost:,.0f}")
    if p.notes:
        lines += ["", *[f"- {n}" for n in p.notes]]
    lines += ["", DISCLAIMER]
    return "\n".join(lines)


# ---------------------------------------------------------------- rebalance
@dataclass
class RebalancePlan:
    as_of: pd.Timestamp
    sells: pd.DataFrame     # ticker, qty, price, proceeds, gain, term, est_tax, rank
    buys: pd.DataFrame      # ticker, rank, price, qty, cost
    keep: list[str]
    cash_after_tax: float
    unspent: float
    notes: list[str] = field(default_factory=list)


def rebalance_plan(ctx: LiveContext, realised_stcg: float = 0.0, realised_ltcg: float = 0.0) -> RebalancePlan:
    """Sell names below the buffer, buy the best new names with the after-tax proceeds.

    ``realised_*`` = capital gains you've already booked this financial year elsewhere,
    so the LTCG exemption and tax estimate account for them.
    """
    cfg, s = ctx.cfg, ctx.cfg["strategy"]
    c = cfg["costs"]
    held = _held_stocks(ctx)
    ranked = ctx.ranked()
    sel = select_with_buffer(ranked, list(held.index), s["top_n"], s["sell_rank_buffer"])

    ledger = ledger_from_lots(ctx.lots, cfg)
    fy = financial_year(ctx.as_of)
    ledger.gains[fy] = [float(realised_stcg), float(realised_ltcg)]
    ledger.charged[fy] = ledger.fy_tax(fy)  # tax on gains already booked isn't part of this plan

    sell_rows, notes = [], []
    for t in sel.sell:
        price = ctx.price(t)
        if math.isnan(price):
            notes.append(f"No recent price for {t}; sell it manually.")
            continue
        q = float(held.at[t, "qty"])
        lots = ctx.lots[ctx.lots["ticker"] == t]
        lt_qty = lots.loc[[is_long_term(d, ctx.as_of) for d in lots["buy_date"]], "qty"].sum()
        proceeds = q * price * (1 - c["slippage"]) * (1 - c["brokerage_and_charges"])
        res = ledger.sell(t, ctx.as_of, q, proceeds)
        rank = int(ranked.at[t, "rank"]) if t in ranked.index else None
        sell_rows.append({"ticker": t, "symbol": t.removesuffix(".NS"), "qty": q, "price": price,
                          "proceeds": proceeds, "gain": res.st_gain + res.lt_gain,
                          "term": "LT" if lt_qty == q else ("ST" if lt_qty == 0 else "mixed"),
                          "est_tax": res.tax, "rank": rank})
    sells = pd.DataFrame(sell_rows, columns=["ticker", "symbol", "qty", "price", "proceeds", "gain", "term",
                                             "est_tax", "rank"])
    cash = float((sells["proceeds"] - sells["est_tax"]).sum()) if not sells.empty else 0.0

    picks = [p for p in sel.final if not math.isnan(ctx.price(p))]
    ucost = {p: _unit_cost(ctx, ctx.price(p)) for p in picks}
    held_val = {p: float(held.at[p, "qty"]) * ctx.price(p) if p in held.index else 0.0 for p in picks}
    qty = allocate_to_picks(cash, picks, held_val, ucost, whole_shares=True)
    buys = pd.DataFrame([{"ticker": t, "symbol": t.removesuffix(".NS"), "rank": int(ranked.at[t, "rank"]),
                          "price": ctx.price(t), "qty": int(q), "cost": q * ucost[t]} for t, q in qty.items()],
                        columns=["ticker", "symbol", "rank", "price", "qty", "cost"]).sort_values("rank")
    unspent = cash - float(buys["cost"].sum())
    if not is_rebalance_month(cfg, (ctx.as_of + pd.offsets.BDay(1)).month):
        notes.append(f"Note: rebalancing is {s['rebalance']}; this is not a scheduled rebalance month.")
    if unspent > 0.5:
        notes.append(f"Rs {unspent:,.0f} left after whole-share rounding: add it to the Nifty 50 bucket.")
    notes.append("Tax is an estimate (lots from holdings.csv, today's prices, current FY rates). "
                 "Sell first; buy once the sale proceeds settle (T+1).")
    return RebalancePlan(ctx.as_of, sells, buys.reset_index(drop=True), sel.keep, cash, unspent, notes)


def format_rebalance(p: RebalancePlan) -> str:
    lines = [f"Quarterly rebalance  (prices as of {p.as_of:%d %b %Y})", ""]
    if p.sells.empty and not p.keep:
        return "\n".join(lines + ["No stock holdings in holdings.csv yet, so there's nothing to rebalance.",
                                   "Use `python -m sipquant.monthly` for this month's buys.", "", DISCLAIMER])
    if p.sells.empty:
        lines.append("No sells: every holding is still inside the top-25 buffer.")
    else:
        lines += ["SELL:", f"  {'Symbol':<12} {'Qty':>6} {'Price':>9} {'Gain':>10} {'Term':>5} {'Est.tax':>9}  Rank"]
        for r in p.sells.itertuples():
            rank = f"{r.rank}" if r.rank is not None and not pd.isna(r.rank) else "filtered out"
            lines.append(f"  {r.symbol:<12} {r.qty:>6.0f} {r.price:>9,.1f} {r.gain:>10,.0f} {r.term:>5} "
                         f"{r.est_tax:>9,.0f}  {rank}")
        lines.append(f"  Total est. tax: Rs {p.sells['est_tax'].sum():,.0f};  cash after tax: Rs {p.cash_after_tax:,.0f}")
    if not p.buys.empty:
        lines += ["", "BUY:", f"  {'#':>3} {'Symbol':<12} {'Qty':>5} {'Price':>9} {'Cost':>9}"]
        for r in p.buys.itertuples():
            lines.append(f"  {r.rank:>3} {r.symbol:<12} {r.qty:>5} {r.price:>9,.1f} {r.cost:>9,.0f}")
    lines += ["", f"Keeping {len(p.keep)}: " + ", ".join(t.removesuffix(".NS") for t in p.keep)]
    lines += ["", *[f"- {n}" for n in p.notes], "", DISCLAIMER]
    return "\n".join(lines)
