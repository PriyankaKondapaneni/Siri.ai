"""Run the full backtest: ``python -m sipquant.backtest``.

(A package's ``__main__.py`` is what ``python -m package`` executes - similar to
a class with ``public static void main``.)

Options:
  --synthetic     use the built-in fake market (no internet; numbers are meaningless)
  --no-download   use only the local cache, don't contact Yahoo
  --no-variants   skip the 8-variant grid (faster)
  --config PATH   alternative config.yaml
"""
from __future__ import annotations

import argparse
import logging
import sys

import pandas as pd

from ..config import load_config, resolve_path
from ..data.market import load_market
from ..strategy.signals import compute_signals
from . import benchmarks as B
from . import report as R
from .engine import run_backtest


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="python -m sipquant.backtest", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--synthetic", action="store_true")
    ap.add_argument("--no-download", action="store_true")
    ap.add_argument("--no-variants", action="store_true")
    ap.add_argument("--config")
    args = ap.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    pd.set_option("display.width", 200)
    pd.set_option("display.max_columns", 20)

    cfg = load_config(args.config)
    market = load_market(cfg, synthetic=args.synthetic, update=not args.no_download)
    out = resolve_path(cfg["backtest"]["output_dir"]) / ("synthetic" if args.synthetic else "")
    out.mkdir(parents=True, exist_ok=True)

    banner = "\n".join(market.notes)
    print("\n" + "=" * 100 + "\n" + banner + "\n" + "=" * 100)
    print("Tickers used:", ", ".join(f"{k}={v}" for k, v in market.bench_ticker.items()))

    signals = compute_signals(market, cfg)  # computed once, shared by every run below

    # ---- main comparison -------------------------------------------------
    n_buckets = sum(1 for v in cfg["allocation"].values() if v > 0)
    main_run = run_backtest(market, cfg, f"{n_buckets}-bucket portfolio", signals)
    n50 = run_backtest(market, B.nifty50_only(cfg), "Nifty 50 SIP", signals)
    m30_cfg, m30_label = B.momentum30(cfg, market)
    m30 = run_backtest(market, m30_cfg, m30_label, signals)
    mom = run_backtest(market, B.momentum_alone(cfg), "Momentum sleeve alone", signals)
    results = [main_run, n50, m30, mom]
    if cfg["allocation"].get("international", 0) > 0:  # what does the international bucket add?
        results.append(run_backtest(market, B.without_bucket(cfg, "international"), "Without international", signals))

    table = R.metrics_table(results)
    print(f"\nSIP of Rs {cfg['sip']['monthly_amount']:,}/month, "
          f"{main_run.value.index[0].date()} to {main_run.value.index[-1].date()}  "
          f"(strategy: quality={'on' if cfg['strategy']['quality']['enabled'] else 'off'}, "
          f"regime={'on' if cfg['strategy']['regime']['enabled'] else 'off'}, {cfg['strategy']['rebalance']})\n")
    print(table.to_string())
    if "PROXY" in m30_label:
        print("\nNOTE: Nifty 200 Momentum 30 has no usable history on Yahoo for this period -> PROXY built from "
              "our universe (top 200 by liquidity, top 30 by 12-1/vol, semi-annual, no filters).")

    # ---- variants ----------------------------------------------------------
    variants_table = None
    if cfg["backtest"]["run_variants"] and not args.no_variants:
        vres = [run_backtest(market, c, label, signals) for label, c in B.variant_grid(cfg)]
        keep = ["XIRR", "XIRR after exit tax", "CAGR (NAV)", "Max drawdown", "Longest underwater (months)",
                "Worst year", "Annual turnover (momentum sleeve)", "Tax paid during SIP", "Final value",
                "Eligible stocks at rebalance (min / median)", "Stocks held (min / median)"]
        variants_table = R.metrics_table(vres).loc[keep].T
        print(f"\nVARIANTS ({n_buckets}-bucket portfolio; Q = quality filter, R = regime rule)\n")
        print(variants_table.to_string())

    # ---- files ---------------------------------------------------------------
    subtitle = market.notes[0] if market.synthetic else market.notes[0].replace("WARNING: ", "")
    R.chart_values(results, main_run.invested, out / "portfolio_vs_benchmarks.png", subtitle)
    R.chart_drawdown(main_run, n50, out / "drawdown.png", subtitle)
    R.chart_yearly([main_run, n50], out / "yearly_returns.png", subtitle)
    table.to_csv(out / "comparison.csv")
    main_run.trades.to_csv(out / "trades.csv", index=False)
    main_run.tax_by_fy.to_csv(out / "tax_by_fy.csv", header=["tax"])
    pd.Series({d.date(): ", ".join(p) for d, p in main_run.picks.items()}).to_csv(out / "picks.csv", header=["picks"])
    with open(out / "report.md", "w", encoding="utf-8") as fh:
        fh.write("# sip-quant backtest\n\n" + "\n\n".join(f"> {n}" for n in market.notes) + "\n\n")
        fh.write("## Comparison\n\n" + R.to_markdown(table) + "\n\n")
        if variants_table is not None:
            fh.write("## Variants\n\n" + R.to_markdown(variants_table) + "\n\n")
        fh.write(f"## Tax by financial year ({main_run.name})\n\n" + R.to_markdown(
                 main_run.tax_by_fy.to_frame("tax").map(lambda v: f"Rs {v:,.0f}")) + "\n")

    print(f"\nCharts and CSVs written to {out}")
    print("\n" + banner + "\n")
    return 0


if __name__ == "__main__":  # true only when run directly, not when imported
    sys.exit(main())
