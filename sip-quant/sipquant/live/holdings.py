"""Your real holdings, read from holdings.csv.

Format: one row per purchase lot (buy the same stock twice -> two rows)::

    symbol,qty,buy_date,buy_price
    RELIANCE,10,2024-01-02,2450.50
    NIFTYBEES,120,2024-01-02,245.10

Symbols are NSE symbols with or without ".NS". Index ETFs (the tickers in
``live.instruments``) are recognised as bucket holdings; everything else is
treated as part of the momentum stock sleeve.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from ..backtest.tax import TaxLedger, TaxRates
from ..data.universe import to_yahoo

REQUIRED = ["symbol", "qty", "buy_date", "buy_price"]


def load_holdings(path: str | Path) -> pd.DataFrame:
    """Return lots with columns ticker, symbol, qty, buy_date, buy_price (empty frame if no file)."""
    path = Path(path)
    if not path.exists():
        return pd.DataFrame(columns=["ticker", *REQUIRED])
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        raise ValueError(f"{path}: missing column(s) {missing}; expected {REQUIRED}")
    df = df.dropna(how="all")
    df["symbol"] = df["symbol"].astype(str).str.strip().str.upper()
    df["ticker"] = df["symbol"].map(to_yahoo)
    df["qty"] = pd.to_numeric(df["qty"], errors="coerce")
    df["buy_price"] = pd.to_numeric(df["buy_price"], errors="coerce")
    df["buy_date"] = pd.to_datetime(df["buy_date"], errors="coerce")
    bad = df[df[["qty", "buy_price", "buy_date"]].isna().any(axis=1) | (df["qty"] <= 0) | (df["buy_price"] <= 0)]
    if not bad.empty:
        rows = ", ".join(str(i + 2) for i in bad.index)  # +2: header line and 1-based numbering
        raise ValueError(f"{path}: invalid qty/buy_date/buy_price on line(s) {rows}")
    return df[["ticker", *REQUIRED]].sort_values("buy_date").reset_index(drop=True)


def positions(lots: pd.DataFrame) -> pd.DataFrame:
    """One row per ticker: total qty, average cost, first buy date."""
    if lots.empty:
        return pd.DataFrame(columns=["qty", "avg_cost", "invested", "first_buy"])
    g = lots.assign(cost=lots["qty"] * lots["buy_price"]).groupby("ticker")
    out = pd.DataFrame({"qty": g["qty"].sum(), "invested": g["cost"].sum(), "first_buy": g["buy_date"].min()})
    out["avg_cost"] = out["invested"] / out["qty"]
    return out


def split_buckets(tickers, cfg: dict) -> tuple[list[str], dict[str, str]]:
    """Separate stock-sleeve tickers from index-bucket ETFs. Returns (stocks, {ticker: bucket})."""
    etf_to_bucket = {t: b for b, t in cfg["live"]["instruments"].items()}
    stocks = [t for t in tickers if t not in etf_to_bucket]
    return stocks, {t: etf_to_bucket[t] for t in tickers if t in etf_to_bucket}


def ledger_from_lots(lots: pd.DataFrame, cfg: dict) -> TaxLedger:
    """A tax ledger holding your lots (cost = qty x buy_price; your actual charges aren't known)."""
    t = cfg["tax"]
    ledger = TaxLedger(TaxRates(t["stcg_rate"], t["ltcg_rate"], t["ltcg_exemption_per_fy"],
                                t["carry_forward_losses"]))
    for row in lots.itertuples():  # itertuples() gives one lightweight object per row
        ledger.buy(row.ticker, row.buy_date, float(row.qty), float(row.qty * row.buy_price))
    return ledger
