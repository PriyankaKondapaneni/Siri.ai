"""The SIP backtest simulator.

Each month, on the first trading day:
  1. Rs 25,000 (config) comes in and is split across buckets by ``allocation``.
  2. If the regime rule is on and the Nifty 500 closed below its 200-day SMA
     yesterday, the momentum bucket's share goes to the Nifty 50 bucket instead.
  3. On rebalance months, momentum holdings whose rank fell below the sell
     buffer (25) are sold (FIFO lots, tax deducted from cash) and replaced by
     the best-ranked new names, so the sleeve holds up to ``top_n`` (15) names.
  4. The momentum money (+ any sale proceeds) buys the current picks. Cash is
     directed to the names furthest below equal weight, so we never trim
     winners (no extra tax) yet drift back towards equal weight over time.
     Whole shares only; leftover rupees go to the Nifty 50 bucket.
  5. Index buckets (Nifty 50, midcap, gold) are bought in fractional units
     (like a mutual fund) and never sold during the simulation.

Signals are read from the previous trading day's close and trades execute at
the trade day's close +/- slippage, so no future information is used (apart
from the survivorship and fundamentals caveats printed in every report).

Prices are Yahoo *adjusted* closes, i.e. dividends are implicitly reinvested.
"""
from __future__ import annotations

import copy
import logging
import math
from dataclasses import dataclass, field

import pandas as pd

from ..strategy.selection import eligible_mask, rank_stocks, select_with_buffer
from ..strategy.signals import Signals, compute_signals
from . import metrics as M
from .tax import TaxLedger, TaxRates

log = logging.getLogger(__name__)

REBALANCE_MONTHS = {"monthly": set(range(1, 13)), "quarterly": {1, 4, 7, 10}, "semiannual": {1, 7}}
MOMENTUM = "momentum"
NIFTY50 = "nifty50"


@dataclass
class BacktestResult:
    name: str
    value: pd.Series          # daily portfolio value (Rs)
    nav: pd.Series            # daily unitised NAV (starts at 100)
    invested: pd.Series       # cumulative money put in
    sleeve_value: pd.Series   # value of the momentum stock sleeve
    cashflows: list           # [(date, amount)] for XIRR; SIPs negative
    trades: pd.DataFrame
    tax_by_fy: pd.Series
    tax_paid: float
    exit_tax: float           # tax if everything were sold on the last day
    exit_value: float         # value after exit costs and exit tax
    risk_on: pd.Series        # regime state per SIP month (True = normal)
    picks: dict = field(default_factory=dict)  # rebalance date -> list of picks
    metrics: dict = field(default_factory=dict)


def allocate_to_picks(cash: float, picks: list[str], held_value: dict[str, float],
                      unit_cost: dict[str, float], whole_shares: bool) -> dict[str, float]:
    """Split ``cash`` across ``picks`` so each moves towards an equal share of the sleeve.

    Returns {ticker: quantity}. With whole shares, a second greedy pass spends the
    remainder one share at a time on the most under-weight name that is affordable.
    """
    if not picks or cash <= 0:
        return {}
    n = len(picks)
    target = (sum(held_value.get(p, 0.0) for p in picks) + cash) / n
    short = {p: max(target - held_value.get(p, 0.0), 0.0) for p in picks}
    total_short = sum(short.values())
    if total_short >= cash:
        amount = {p: cash * short[p] / total_short for p in picks}
    else:
        amount = {p: short[p] + (cash - total_short) / n for p in picks}

    if not whole_shares:
        return {p: amount[p] / unit_cost[p] for p in picks}

    qty = {p: math.floor(amount[p] / unit_cost[p]) for p in picks}
    left = cash - sum(qty[p] * unit_cost[p] for p in picks)
    while True:
        def deficit(p):
            return target - held_value.get(p, 0.0) - qty[p] * unit_cost[p]
        affordable = [p for p in picks if unit_cost[p] <= left + 1e-9 and deficit(p) > 0]
        if not affordable:
            break
        best = max(affordable, key=deficit)
        qty[best] += 1
        left -= unit_cost[best]
    return {p: q for p, q in qty.items() if q > 0}


class Simulator:
    def __init__(self, market, cfg: dict, signals: Signals | None = None, name: str = "Portfolio"):
        self.m, self.cfg, self.name = market, cfg, name
        self.sig = signals if signals is not None else compute_signals(market, cfg)
        self.s = cfg["strategy"]
        cal = market.calendar
        self.cal = cal

        c = cfg["costs"]
        self.fee, self.slip = c["brokerage_and_charges"], c["slippage"]
        self.index_costs = c["apply_to_index_buckets"]
        t = cfg["tax"]
        self.ledger = TaxLedger(TaxRates(t["stcg_rate"], t["ltcg_rate"], t["ltcg_exemption_per_fy"],
                                         t["carry_forward_losses"]))

        self.alloc = {k: v for k, v in cfg["allocation"].items() if v > 0}
        self.buckets = [k for k in self.alloc if k != MOMENTUM]
        for role in self.buckets + [NIFTY50]:
            if role not in market.bench:
                raise KeyError(f"No price series for bucket '{role}'")

        # Price used to trade (short gaps bridged) and to value (any gap bridged).
        stock_adj = market.adj_close.reindex(cal)
        bench = pd.DataFrame({r: market.bench[r].reindex(cal) for r in set(self.buckets + [NIFTY50])})
        self.trade_px = pd.concat([stock_adj.ffill(limit=5), bench.ffill(limit=5)], axis=1)
        self.value_px = pd.concat([stock_adj.ffill(), bench.ffill()], axis=1)

    # ------------------------------------------------------------- schedule
    def sip_dates(self) -> pd.DatetimeIndex:
        start = pd.Timestamp(self.cfg["sip"]["start"])
        for role in self.buckets + [NIFTY50]:  # every bucket needs a price from day one
            start = max(start, self.m.bench[role].first_valid_index())
        end = pd.Timestamp(self.cfg["sip"]["end"]) if self.cfg["sip"]["end"] else self.cal[-1]
        days = self.cal[(self.cal >= start) & (self.cal <= end)]
        firsts = days.to_series().groupby([days.year, days.month]).first()
        return pd.DatetimeIndex(firsts.values)

    # --------------------------------------------------------------- trading
    def _costs(self, ticker: str) -> tuple[float, float]:
        if ticker in self.buckets or ticker == NIFTY50:
            if not self.index_costs:
                return 0.0, 0.0
        return self.fee, self.slip

    def _buy(self, d, ticker, qty, price):
        fee, slip = self._costs(ticker)
        cost = qty * price * (1 + slip) * (1 + fee)
        self.pos[ticker] = self.pos.get(ticker, 0.0) + qty
        self.ledger.buy(ticker, d, qty, cost)
        self.trades.append({"date": d, "ticker": ticker, "side": "BUY", "qty": qty, "price": price,
                            "value": cost, "tax": 0.0})
        return cost

    def _sell(self, d, ticker, qty, price, ledger=None, record=True):
        fee, slip = self._costs(ticker)
        proceeds = qty * price * (1 - slip) * (1 - fee)
        res = (ledger or self.ledger).sell(ticker, d, qty, proceeds)
        if record:
            self.pos[ticker] -= qty
            if self.pos[ticker] <= 1e-9:
                del self.pos[ticker]
            self.trades.append({"date": d, "ticker": ticker, "side": "SELL", "qty": qty, "price": price,
                                "value": proceeds, "tax": res.tax})
        return proceeds, res.tax

    def _unit_cost(self, ticker, price):
        fee, slip = self._costs(ticker)
        return price * (1 + slip) * (1 + fee)

    # ------------------------------------------------------------------ run
    def run(self) -> BacktestResult:
        amount = self.cfg["sip"]["monthly_amount"]
        rebal_months = REBALANCE_MONTHS[self.s["rebalance"]]
        whole = self.s["whole_shares"]
        regime_on = self.s["regime"]["enabled"]

        self.pos: dict[str, float] = {}
        self.trades: list[dict] = []
        cash = 0.0
        picks: list[str] = []
        units = 0.0
        snapshots, cashflows, unit_log, risk_log, picks_log = {}, [], {}, {}, {}
        sell_value = 0.0

        dates = self.sip_dates()
        for i, d in enumerate(dates):
            prev = self.cal[self.cal.get_loc(d) - 1]  # signal date = previous trading day
            px = self.trade_px.loc[d]

            # Unitise: new money buys units at today's pre-trade NAV.
            value_pre = sum(q * self.value_px.at[d, t] for t, q in self.pos.items()) + cash
            nav = 100.0 if units == 0 else value_pre / units
            units += amount / nav
            unit_log[d] = units
            cashflows.append((d, -amount))

            # 1-2. split the SIP across buckets, applying the regime rule.
            flows = {k: amount * v for k, v in self.alloc.items()}
            on = bool(self.sig.risk_on.loc[prev])
            risk_log[d] = on
            if regime_on and not on and MOMENTUM in flows:
                flows[NIFTY50] = flows.get(NIFTY50, 0.0) + flows.pop(MOMENTUM)

            # 3. rebalance the momentum sleeve.
            if MOMENTUM in self.alloc and (i == 0 or d.month in rebal_months or (not picks and MOMENTUM in flows)):
                held = [t for t in self.pos if t not in self.buckets and t != NIFTY50]
                ranked = rank_stocks(self.sig.score.loc[prev], eligible_mask(self.sig, prev, self.cfg))
                sel = select_with_buffer(ranked, held, self.s["top_n"], self.s["sell_rank_buffer"])
                for t in sel.sell:
                    if pd.isna(px.get(t)):  # can't trade without a price: keep holding it
                        continue
                    proceeds, tax = self._sell(d, t, self.pos[t], px[t])
                    sell_value += proceeds
                    cash += proceeds - tax
                picks = sel.final
                picks_log[d] = list(picks)

            # 4. buy momentum picks with SIP money + any cash (proceeds, refunds).
            cash += flows.pop(MOMENTUM, 0.0)
            tradable = [p for p in picks if pd.notna(px.get(p))]
            ucost = {p: self._unit_cost(p, px[p]) for p in tradable}
            held_val = {p: self.pos.get(p, 0.0) * px[p] for p in tradable}
            for t, q in allocate_to_picks(cash, tradable, held_val, ucost, whole).items():
                cash -= self._buy(d, t, q, px[t])
            if cash < 0:  # tax exceeded proceeds (rare): take it from this month's Nifty 50 money
                flows[NIFTY50] = flows.get(NIFTY50, 0.0) + cash
                cash = 0.0
            flows[NIFTY50] = flows.get(NIFTY50, 0.0) + cash  # leftover rupees roll into Nifty 50
            cash = 0.0

            # 5. index buckets: fractional units.
            for role, money in flows.items():
                if money > 0:
                    self._buy(d, role, money / self._unit_cost(role, px[role]), px[role])
            snapshots[d] = dict(self.pos)

        return self._finish(dates, snapshots, cashflows, unit_log, risk_log, picks_log, sell_value, amount)

    # ------------------------------------------------------------- results
    def _finish(self, dates, snapshots, cashflows, unit_log, risk_log, picks_log, sell_value, amount):
        days = self.cal[(self.cal >= dates[0])]
        if self.cfg["sip"]["end"]:
            days = days[days <= pd.Timestamp(self.cfg["sip"]["end"])]
        # fillna(0) BEFORE ffill: a stock missing from a snapshot was sold (qty 0), not "unchanged".
        qty = pd.DataFrame.from_dict(snapshots, orient="index").fillna(0.0).reindex(days).ffill().fillna(0.0)
        px = self.value_px.loc[days, qty.columns]
        holdings_value = qty * px
        value = holdings_value.sum(axis=1)
        stock_cols = [c for c in qty.columns if c not in self.buckets and c != NIFTY50]
        sleeve = holdings_value[stock_cols].sum(axis=1)
        units = pd.Series(unit_log).reindex(days).ffill()
        nav = value / units
        invested = pd.Series(amount, index=dates).cumsum().reindex(days).ffill()

        # Hypothetical exit on the last day: sell everything, pay costs and tax.
        last = days[-1]
        ledger = copy.deepcopy(self.ledger)
        exit_value, exit_tax = 0.0, 0.0
        for t, q in snapshots[dates[-1]].items():
            proceeds, tax = self._sell(last, t, q, self.value_px.at[last, t], ledger=ledger, record=False)
            exit_value += proceeds - tax
            exit_tax += tax

        trades = pd.DataFrame(self.trades)
        res = BacktestResult(
            name=self.name, value=value, nav=nav, invested=invested, sleeve_value=sleeve,
            cashflows=cashflows, trades=trades, tax_by_fy=self.ledger.tax_by_fy(),
            tax_paid=self.ledger.total_tax, exit_tax=exit_tax, exit_value=exit_value,
            risk_on=pd.Series(risk_log), picks=picks_log,
        )
        res.metrics = summarise(res, sell_value, self.s["regime"]["enabled"] and MOMENTUM in self.alloc)
        return res


def summarise(r: BacktestResult, sell_value: float, regime_applies: bool) -> dict:
    last = r.value.index[-1]
    years = (last - r.value.index[0]).days / 365.25
    yearly = M.calendar_year_returns(r.nav)
    avg_sleeve = r.sleeve_value.mean()
    return {
        "Invested": r.invested.iloc[-1],
        "Final value": r.value.iloc[-1],
        "XIRR": M.xirr(r.cashflows + [(last, r.value.iloc[-1])]),
        "XIRR after exit tax": M.xirr(r.cashflows + [(last, r.exit_value)]),
        "CAGR (NAV)": M.cagr(r.nav),
        "Max drawdown": M.max_drawdown(r.nav),
        "Longest underwater (months)": M.longest_underwater_days(r.nav) / 30.44,
        "Worst year": f"{yearly.idxmin()} ({yearly.min():+.1%})",
        "Annual turnover (momentum sleeve)": (sell_value / avg_sleeve / years) if avg_sleeve > 0 else 0.0,
        "Tax paid during SIP": r.tax_paid,
        "Tax if exited today": r.exit_tax,
        # Months where the rule actually redirected money (n/a if the rule is off or there's no momentum sleeve).
        "Regime-off months": int((~r.risk_on).sum()) if regime_applies else "n/a",
    }


def run_backtest(market, cfg: dict, name: str = "Portfolio", signals: Signals | None = None) -> BacktestResult:
    return Simulator(market, cfg, signals, name).run()
