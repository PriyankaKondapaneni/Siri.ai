"""The stock universe: Nifty 500 constituents from a CSV you provide.

We deliberately do not scrape NSE. Download the official list from
niftyindices.com ("ind_nifty500list.csv") and save it as data/nifty500.csv;
its columns (Company Name, Industry, Symbol, Series, ISIN Code) are accepted
as-is. A minimal file with just ``Symbol,Industry`` also works.
"""
from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

log = logging.getLogger(__name__)  # one logger per module, like a static Logger in Java

NSE_SUFFIX = ".NS"


def to_yahoo(symbol: str) -> str:
    """'RELIANCE' -> 'RELIANCE.NS' (idempotent)."""
    symbol = symbol.strip().upper()
    return symbol if symbol.endswith(NSE_SUFFIX) else symbol + NSE_SUFFIX


def from_yahoo(ticker: str) -> str:
    """'RELIANCE.NS' -> 'RELIANCE'."""
    return ticker[: -len(NSE_SUFFIX)] if ticker.endswith(NSE_SUFFIX) else ticker


def load_universe(csv_path: str | Path) -> pd.DataFrame:
    """Return a DataFrame indexed by Yahoo ticker with columns ``symbol`` and ``industry``."""
    csv_path = Path(csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(
            f"{csv_path} not found. Download the Nifty 500 list from "
            "https://www.niftyindices.com (Indices -> Nifty 500 -> 'Download Index Constituents') "
            "and save it there. Required columns: Symbol, Industry."
        )
    df = pd.read_csv(csv_path)
    df.columns = [c.strip() for c in df.columns]  # list comprehension = map(...).collect(toList())
    if "Symbol" not in df.columns:
        raise ValueError(f"{csv_path} must have a 'Symbol' column; found {list(df.columns)}")

    if "Series" in df.columns:  # NSE's file: keep ordinary equity shares only
        df = df[df["Series"].astype(str).str.strip() == "EQ"]

    out = pd.DataFrame(
        {
            "symbol": df["Symbol"].astype(str).str.strip().str.upper(),
            "industry": df["Industry"].astype(str).str.strip() if "Industry" in df.columns else "Unknown",
        }
    )
    out = out.drop_duplicates("symbol")
    out.index = out["symbol"].map(to_yahoo)
    out.index.name = "ticker"
    log.info("Universe: %d symbols from %s", len(out), csv_path)
    return out
