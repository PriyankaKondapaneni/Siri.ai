"""A fake, randomly generated market for offline testing of the whole pipeline.

This exists so the backtest can be exercised without internet access (and in
unit tests). Numbers produced from it mean NOTHING about real Indian markets.
Stocks get a slowly drifting "alpha" so that momentum has some persistence,
and two scripted crashes exercise the regime rule and drawdown metrics.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

SYNTHETIC_BANNER = "SYNTHETIC DATA - these numbers are NOT real market results"


def make_market(start: str = "2009-06-01", end: str = "2026-09-24", n_stocks: int = 500, seed: int = 7):
    """Return (prices dict, benchmarks dict, fundamentals DataFrame, universe DataFrame)."""
    rng = np.random.default_rng(seed)
    dates = pd.bdate_range(start, end)
    T = len(dates)

    # --- market factor, with two scripted crashes --------------------------
    m = rng.normal(0.12 / 252, 0.16 / np.sqrt(252), T)
    for crash_start, days, total in [("2011-08-01", 90, -0.22), ("2020-02-20", 25, -0.35)]:
        i0 = dates.searchsorted(pd.Timestamp(crash_start))
        m[i0 : i0 + days] += np.log(1 + total) / days
    # --- stocks -------------------------------------------------------------
    beta = rng.uniform(0.6, 1.4, n_stocks)
    idio_vol = rng.uniform(0.18, 0.45, n_stocks) / np.sqrt(252)
    # Monthly AR(1) alpha: persistent enough that past winners keep winning a bit.
    months = T // 21 + 1
    alpha = np.zeros((months, n_stocks))
    for k in range(1, months):
        alpha[k] = 0.85 * alpha[k - 1] + rng.normal(0, 0.10, n_stocks)
    alpha_daily = np.repeat(alpha, 21, axis=0)[:T] / 252
    rets = beta * m[:, None] + alpha_daily + idio_vol * rng.standard_normal((T, n_stocks))
    adj = 100 * rng.lognormal(1.0, 0.8, n_stocks) * np.exp(np.cumsum(rets, axis=0))

    tickers = [f"SYN{i:03d}.NS" for i in range(n_stocks)]
    adj = pd.DataFrame(adj, index=dates, columns=tickers)
    # ~15% of names "list" later (IPO) -> NaN before their first date.
    for t in rng.choice(tickers, n_stocks // 7, replace=False):
        adj.loc[: dates[rng.integers(0, T - 300)], t] = np.nan
    # Unadjusted close = adjusted close grossed back up by a ~1%/yr dividend factor.
    years_to_end = np.arange(T)[::-1] / 252
    close = adj.mul(np.exp(0.01 * years_to_end), axis=0)
    # Daily traded value: median ~Rs 20 cr, with a long tail of illiquid names.
    value = rng.lognormal(np.log(2e8), 1.2, n_stocks) * rng.lognormal(0, 0.4, (T, n_stocks))
    volume = (pd.DataFrame(value, index=dates, columns=tickers) / close).round()

    # --- benchmarks -----------------------------------------------------------
    def series(r, level=100.0):
        return pd.Series(level * np.exp(np.cumsum(r)), index=dates)

    bench = {
        "NIFTYBEES.NS": series(m + 0.012 / 252),
        "^NSEI": series(m),
        "^NSEMDCP150": series(1.15 * m + rng.normal(0.02 / 252, 0.06 / np.sqrt(252), T)),
        "GOLDBEES.NS": series(rng.normal(0.10 / 252, 0.14 / np.sqrt(252), T)),
        "^CRSLDX": series(1.05 * m),
        # Too short on purpose (like the real ETF), so the proxy path gets used.
        "MOM30IETF.NS": series(m * 1.2)[dates >= "2022-03-01"],
    }

    fund = pd.DataFrame(
        {
            "roe": rng.normal(0.15, 0.08, n_stocks),
            "debt_to_equity": rng.lognormal(np.log(0.5), 0.9, n_stocks),
            "eps": rng.normal(25, 30, n_stocks),
            "fetched_at": pd.Timestamp.now(),
        },
        index=pd.Index(tickers, name="ticker"),
    )
    fund.loc[rng.choice(tickers, n_stocks // 8, replace=False), "roe"] = np.nan  # some missing

    universe = pd.DataFrame(
        {"symbol": [t[:-3] for t in tickers], "industry": rng.choice(["Fin", "IT", "Auto", "FMCG", "Pharma"], n_stocks)},
        index=pd.Index(tickers, name="ticker"),
    )
    prices = {"close": close, "adj_close": adj, "volume": volume}
    return prices, bench, fund, universe
