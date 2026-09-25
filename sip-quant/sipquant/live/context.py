"""Everything a live command needs, loaded once: config, market data, signals, holdings, "as of" date."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo  # standard library time-zone support (Python 3.9+)

import pandas as pd

from ..config import resolve_path
from ..data.market import Market, load_market
from ..strategy.selection import eligible_mask, rank_stocks
from ..strategy.signals import Signals, compute_signals
from .holdings import load_holdings

log = logging.getLogger(__name__)
IST = ZoneInfo("Asia/Kolkata")


@dataclass
class LiveContext:
    cfg: dict
    market: Market
    signals: Signals
    lots: pd.DataFrame        # your holdings, one row per lot
    as_of: pd.Timestamp       # last COMPLETE trading day used for prices and signals

    def ranked(self) -> pd.DataFrame:
        """Today's momentum ranking of eligible stocks (best first)."""
        return rank_stocks(self.signals.score.loc[self.as_of], eligible_mask(self.signals, self.as_of, self.cfg))

    def risk_on(self) -> bool:
        return bool(self.signals.risk_on.loc[self.as_of])

    def price(self, ticker: str) -> float:
        return self.market.last_price(ticker, self.as_of)

    def industry(self, ticker: str) -> str:
        u = self.market.universe
        return str(u.at[ticker, "industry"]) if ticker in u.index else "-"


def last_complete_day(calendar: pd.DatetimeIndex, cfg: dict, now: datetime | None = None) -> pd.Timestamp:
    """Latest trading day whose close is final. Before market close, today's partial bar is skipped."""
    now = now or datetime.now(IST)
    close_h, close_m = map(int, cfg["live"]["market_close_ist"].split(":"))
    today = pd.Timestamp(now.date())
    market_closed = (now.hour, now.minute) >= (close_h, close_m)
    days = calendar[calendar <= today] if market_closed else calendar[calendar < today]
    return days[-1]


def build_context(cfg: dict, synthetic: bool = False, update: bool = True,
                  now: datetime | None = None) -> LiveContext:
    lots = load_holdings(resolve_path(cfg["live"]["holdings_csv"]))
    market = load_market(cfg, synthetic=synthetic, update=update, extra_tickers=list(lots["ticker"].unique()))
    signals = compute_signals(market, cfg)
    as_of = last_complete_day(market.calendar, cfg, now)
    missing = [t for t in lots["ticker"].unique() if market.close_series(t).empty]
    if missing:
        log.warning("No price data for holdings %s - check the symbols in holdings.csv", missing)
    return LiveContext(cfg, market, signals, lots, as_of)
