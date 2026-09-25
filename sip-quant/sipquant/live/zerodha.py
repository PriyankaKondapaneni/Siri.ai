"""Build holdings.csv from Zerodha Console tradebook exports.

Get the file: console.zerodha.com -> Reports -> Tradebook -> Segment "Equity" ->
pick a date range -> Download CSV. Console limits each download to a date range,
so download one file per year and pass them all; duplicate trades are dropped.

Expected columns (as in Console's export; matching is case-insensitive):
    symbol, trade_date, trade_type (buy/sell), quantity, price
Optional: segment, trade_id, order_execution_time.

How trades become lots:
  * All buy fills of one symbol on one day become ONE lot at the average price.
  * Sells remove shares from the oldest lots first (FIFO, as the tax rules do).
  * Splits/bonuses aren't in the tradebook: after one, fix that stock's qty and
    buy_price in holdings.csv by hand (qty x ratio, price / ratio).
"""
from __future__ import annotations

from collections import deque
from pathlib import Path

import pandas as pd

REQUIRED = ["symbol", "trade_date", "trade_type", "quantity", "price"]


def read_tradebooks(paths: list[str | Path]) -> pd.DataFrame:
    frames = []
    for p in paths:
        df = pd.read_csv(p)
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
        missing = [c for c in REQUIRED if c not in df.columns]
        if missing:
            raise ValueError(f"{p}: missing column(s) {missing}. Is this a Console tradebook CSV? "
                             f"Found: {list(df.columns)}")
        frames.append(df)
    trades = pd.concat(frames, ignore_index=True)
    key = ["trade_id"] if "trade_id" in trades.columns else list(trades.columns)
    return trades.drop_duplicates(subset=key).reset_index(drop=True)


def holdings_from_trades(trades: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Return (lots with columns symbol, qty, buy_date, buy_price, warnings)."""
    t = trades.copy()
    warnings: list[str] = []
    if "segment" in t.columns:  # keep cash equity only (no F&O, currency, commodity)
        t = t[t["segment"].astype(str).str.upper().isin(["EQ", "EQUITY"])]
    t["symbol"] = t["symbol"].astype(str).str.strip().str.upper()
    t["side"] = t["trade_type"].astype(str).str.strip().str.lower()
    t["quantity"] = pd.to_numeric(t["quantity"], errors="coerce")
    t["price"] = pd.to_numeric(t["price"], errors="coerce")
    t["trade_date"] = pd.to_datetime(t["trade_date"], errors="coerce", dayfirst=_looks_dayfirst(t["trade_date"]))
    bad = t[t[["quantity", "price", "trade_date"]].isna().any(axis=1) | ~t["side"].isin(["buy", "sell"])]
    if not bad.empty:
        warnings.append(f"Skipped {len(bad)} unreadable row(s).")
        t = t.drop(bad.index)

    # Merge fills: one row per (symbol, day, side) with the quantity-weighted average price.
    t["value"] = t["quantity"] * t["price"]
    order_col = "order_execution_time" if "order_execution_time" in t.columns else "trade_date"
    t["first_time"] = pd.to_datetime(t[order_col], errors="coerce")
    day = (t.groupby(["symbol", "trade_date", "side"], as_index=False)
           .agg(quantity=("quantity", "sum"), value=("value", "sum"), first_time=("first_time", "min")))
    day["price"] = day["value"] / day["quantity"]
    # Chronological; on the same day, process buys before sells unless timestamps say otherwise.
    day["side_order"] = day["side"].map({"buy": 0, "sell": 1})
    day = day.sort_values(["trade_date", "first_time", "side_order"])

    lots: dict[str, deque] = {}
    for r in day.itertuples():
        q = lots.setdefault(r.symbol, deque())
        if r.side == "buy":
            q.append([r.trade_date, float(r.quantity), float(r.price)])
            continue
        remaining = float(r.quantity)
        while remaining > 1e-9 and q:
            take = min(q[0][1], remaining)
            q[0][1] -= take
            remaining -= take
            if q[0][1] <= 1e-9:
                q.popleft()
        if remaining > 1e-9:
            warnings.append(f"{r.symbol}: sold {remaining:g} more than bought in these files on "
                            f"{r.trade_date:%Y-%m-%d} (earlier buys missing? add older tradebooks).")

    rows = [{"symbol": s, "qty": round(qty, 6), "buy_date": d.strftime("%Y-%m-%d"), "buy_price": round(px, 4)}
            for s, q in lots.items() for d, qty, px in q if qty > 1e-9]
    out = pd.DataFrame(rows, columns=["symbol", "qty", "buy_date", "buy_price"])
    out["qty"] = out["qty"].map(lambda x: int(x) if float(x).is_integer() else x)
    return out.sort_values(["buy_date", "symbol"]).reset_index(drop=True), warnings


def _looks_dayfirst(dates: pd.Series) -> bool:
    """Console uses YYYY-MM-DD; if a file has DD-MM-YYYY (e.g. re-saved in Excel), read it day-first."""
    sample = dates.dropna().astype(str).head(20)
    return bool(len(sample)) and not sample.str.match(r"^\d{4}-").all()
