"""Telegram notifications: ``python -m sipquant.notify <command> [--dry-run]``.

Commands:
  daily      what the scheduler runs every weekday at 9:30 IST:
               - on the first trading day of the month (or the first run after it, if
                 your computer was off) sends the monthly report, plus the rebalance
                 list in rebalance months (Jan/Apr/Jul/Oct by default);
               - every run: checks alerts and sends any that fire.
  monthly    send the monthly report now
  rebalance  send the rebalance list now
  alerts     check alerts now
  test       send a test message (checks your .env setup)

--dry-run prints the messages instead of sending them (and doesn't update state).
"""
from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime

import pandas as pd

from ..config import load_config, resolve_path
from ..live.context import IST, LiveContext, build_context
from ..live.plan import DISCLAIMER, format_monthly, format_rebalance, is_rebalance_month, monthly_plan, rebalance_plan
from ..live.tracker import format_status, portfolio_status
from . import telegram
from .alerts import evaluate_alerts
from .news import news_section
from .state import load_state, save_state

log = logging.getLogger("sipquant.notify")


def is_trading_day(day: pd.Timestamp, cfg: dict) -> bool:
    holidays = {pd.Timestamp(h) for h in cfg["live"].get("nse_holidays") or []}
    return day.weekday() < 5 and day not in holidays


def monthly_message(ctx: LiveContext) -> str:
    parts = [format_monthly(monthly_plan(ctx)), format_status(portfolio_status(ctx))]
    stocks = [t for t in ctx.lots["ticker"].unique() if t not in ctx.cfg["live"]["instruments"].values()]
    news = news_section(stocks, ctx.cfg)
    if news:
        parts.append(news + "\n\n" + DISCLAIMER)
    return "\n\n".join(parts)


def alerts_message(ctx: LiveContext, state: dict) -> tuple[str | None, dict]:
    st = portfolio_status(ctx)
    returns = {} if st is None else {t: float(r) for t, r in st.holdings["return"].items() if pd.notna(r)}
    msgs, new_state = evaluate_alerts(returns, ctx.risk_on(), None if st is None else st.drawdown,
                                      state.get("alerts", {}), ctx.cfg)
    state = {**state, "alerts": new_state}
    if not msgs:
        return None, state
    text = f"sip-quant alerts ({ctx.as_of:%d %b %Y} close)\n" + "\n".join(f"- {m}" for m in msgs)
    return text + "\n\n" + DISCLAIMER, state


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="python -m sipquant.notify", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=["daily", "monthly", "rebalance", "alerts", "test"])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--synthetic", action="store_true", help="fake market data (for trying it out)")
    ap.add_argument("--config")
    args = ap.parse_args(argv)
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")
    cfg = load_config(args.config)

    def out(text: str) -> None:
        if args.dry_run:
            print(text + "\n" + "-" * 60)
        else:
            telegram.send(text)

    if args.command == "test":
        out("sip-quant: Telegram is set up correctly.")
        return 0

    ctx = build_context(cfg, synthetic=args.synthetic)
    state_path = resolve_path(cfg["live"]["state_file"])
    state = load_state(state_path)
    today = pd.Timestamp(datetime.now(IST).date())
    month_key = f"{today:%Y-%m}"

    if args.command == "monthly":
        out(monthly_message(ctx))
    elif args.command == "rebalance":
        out(format_rebalance(rebalance_plan(ctx)))
    elif args.command == "alerts":
        text, state = alerts_message(ctx, state)
        out(text or "No alerts.")
    elif args.command == "daily":
        if is_trading_day(today, cfg) and state.get("monthly_sent") != month_key:
            out(monthly_message(ctx))
            if is_rebalance_month(cfg, today.month):
                out(format_rebalance(rebalance_plan(ctx)))
            state["monthly_sent"] = month_key
        text, state = alerts_message(ctx, state)
        if text:
            out(text)
    if not args.dry_run:
        save_state(state_path, state)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except RuntimeError as exc:  # e.g. missing .env values: show the message, not a traceback
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
