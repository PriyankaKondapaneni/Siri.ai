"""Indian capital gains tax on listed equity / equity ETFs, with FIFO lots.

Rules modelled (rates come from config.yaml):
  * Holding period: long-term if sold MORE than 12 months after purchase
    (buy 2023-01-10 -> long-term from 2024-01-11). Otherwise short-term.
  * STCG taxed at ``stcg_rate``; LTCG taxed at ``ltcg_rate`` on the part of the
    financial year's net LTCG above ``ltcg_exemption_per_fy``.
  * FY runs April-March. We label it by its starting year: FY 2024 = Apr 2024-Mar 2025.
  * Set-off within a year: short-term losses offset ST gains and then LT gains;
    long-term losses offset only LT gains.
  * Optional carry-forward of unused losses to later years (ST b/f loss can
    offset ST or LT gains, LT b/f loss only LT gains). The 8-year expiry is ignored.

Because tax is really computed per financial year, each sale is charged the
*change* in that year's total liability. A later loss in the same year
therefore produces a (negative) tax delta, i.e. a refund of tax already charged.
Not modelled: cess/surcharge, grandfathering, past rate changes (current rates
are applied to all years, which is conservative before July 2024).
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field

import pandas as pd


def financial_year(d: pd.Timestamp) -> int:
    """FY start year: 2025-03-31 -> 2024, 2025-04-01 -> 2025."""
    return d.year if d.month >= 4 else d.year - 1


def is_long_term(buy_date: pd.Timestamp, sell_date: pd.Timestamp) -> bool:
    return sell_date > buy_date + pd.DateOffset(years=1)


@dataclass
class Lot:
    date: pd.Timestamp
    qty: float
    unit_cost: float  # per share, including buy-side costs


@dataclass
class TaxRates:
    stcg: float
    ltcg: float
    exemption: float
    carry_forward: bool = True


def fy_liability(st_net: float, lt_net: float, cf_st: float, cf_lt: float, r: TaxRates):
    """Tax for one FY. Returns (tax, unused_st_loss, unused_lt_loss) to carry forward.

    ``st_net``/``lt_net`` are the year's netted short/long-term gains (negative = loss);
    ``cf_st``/``cf_lt`` are losses brought forward from earlier years (positive numbers).
    """
    st_gain, st_loss = max(st_net, 0.0), max(-st_net, 0.0)
    lt_gain, lt_loss = max(lt_net, 0.0), max(-lt_net, 0.0)

    # 1. This year's ST loss may offset this year's LT gains.
    used = min(st_loss, lt_gain)
    lt_gain, st_loss = lt_gain - used, st_loss - used

    # 2. Brought-forward losses (the order below is the taxpayer-friendly one).
    used = min(cf_st, st_gain); st_gain -= used; cf_st -= used   # b/f ST loss vs ST gains
    used = min(cf_lt, lt_gain); lt_gain -= used; cf_lt -= used   # b/f LT loss vs LT gains
    used = min(cf_st, lt_gain); lt_gain -= used; cf_st -= used   # b/f ST loss vs remaining LT gains

    tax = st_gain * r.stcg + max(lt_gain - r.exemption, 0.0) * r.ltcg
    return tax, cf_st + st_loss, cf_lt + lt_loss


@dataclass
class SaleResult:
    proceeds: float
    cost_basis: float
    st_gain: float
    lt_gain: float
    tax: float  # tax charged for this sale (negative = refund)


@dataclass
class TaxLedger:
    rates: TaxRates
    lots: dict[str, deque] = field(default_factory=dict)
    gains: dict[int, list[float]] = field(default_factory=dict)  # FY -> [st_net, lt_net]
    charged: dict[int, float] = field(default_factory=dict)      # FY -> tax charged so far
    cf_into: dict[int, tuple[float, float]] = field(default_factory=dict)  # FY -> (cf_st, cf_lt)
    total_tax: float = 0.0

    # ------------------------------------------------------------------ buys
    def buy(self, ticker: str, date: pd.Timestamp, qty: float, total_cost: float) -> None:
        if qty <= 0:
            return
        # setdefault = get the deque, creating an empty one if missing (computeIfAbsent)
        self.lots.setdefault(ticker, deque()).append(Lot(date, qty, total_cost / qty))

    def quantity(self, ticker: str) -> float:
        return sum(l.qty for l in self.lots.get(ticker, ()))

    # ----------------------------------------------------------------- sells
    def sell(self, ticker: str, date: pd.Timestamp, qty: float, net_proceeds: float) -> SaleResult:
        """Sell ``qty`` FIFO for ``net_proceeds`` (after costs). Returns gains and tax delta."""
        lots = self.lots.get(ticker)
        if not lots or qty > self.quantity(ticker) + 1e-9:
            raise ValueError(f"Selling {qty} {ticker} but only hold {self.quantity(ticker)}")
        price = net_proceeds / qty
        remaining, st, lt, basis = qty, 0.0, 0.0, 0.0
        while remaining > 1e-9 and lots:  # tolerance: fractional units carry float rounding
            lot = lots[0]
            take = min(lot.qty, remaining)
            gain = (price - lot.unit_cost) * take
            basis += lot.unit_cost * take
            if is_long_term(lot.date, date):
                lt += gain
            else:
                st += gain
            lot.qty -= take
            remaining -= take
            if lot.qty <= 1e-9:
                lots.popleft()
        if not lots:
            del self.lots[ticker]

        fy = financial_year(date)
        before = self.charged.get(fy, 0.0)
        g = self.gains.setdefault(fy, [0.0, 0.0])
        g[0] += st
        g[1] += lt
        after = self.fy_tax(fy)
        self.charged[fy] = after
        self.total_tax += after - before
        return SaleResult(net_proceeds, basis, st, lt, after - before)

    # ---------------------------------------------------------- FY handling
    def fy_tax(self, fy: int) -> float:
        cf_st, cf_lt = self._carry_in(fy)
        st, lt = self.gains.get(fy, (0.0, 0.0))
        return fy_liability(st, lt, cf_st, cf_lt, self.rates)[0]

    def _carry_in(self, fy: int) -> tuple[float, float]:
        """Losses carried into ``fy`` from all earlier years (computed in order)."""
        if not self.rates.carry_forward:
            return 0.0, 0.0
        cf_st = cf_lt = 0.0
        for year in sorted(y for y in self.gains if y < fy):
            st, lt = self.gains[year]
            _, cf_st, cf_lt = fy_liability(st, lt, cf_st, cf_lt, self.rates)
        return cf_st, cf_lt

    def tax_by_fy(self) -> pd.Series:
        return pd.Series({f"FY{y}-{str(y + 1)[-2:]}": self.charged[y] for y in sorted(self.charged)})
