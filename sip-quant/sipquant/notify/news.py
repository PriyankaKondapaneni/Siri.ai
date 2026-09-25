"""Optional: 2-3 line NEUTRAL summaries of recent headlines per holding, written by Claude.

Only runs if ANTHROPIC_API_KEY is set. Two layers keep it factual:
  1. The prompt forbids opinions, predictions, targets and buy/sell/hold language.
  2. ``is_clean`` rejects any summary that still contains such language anyway -
     it's replaced by a plain "withheld" note rather than sent.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta, timezone

from .. import env

log = logging.getLogger(__name__)

SYSTEM = (
    "You summarise news headlines about an Indian listed company for the company's shareholder. "
    "Write 2-3 short, neutral, factual sentences describing only what the headlines report. "
    "Never give an opinion, forecast, price target, rating, or any suggestion to buy, sell, hold, "
    "add, reduce or exit. Never say whether the news is good or bad for the stock price. "
    "If the headlines are unrelated to the company or empty, reply exactly: No material news."
)

# Advice-like or predictive language. Summaries containing any of it are withheld.
BANNED = re.compile(
    r"\b(buy|buying opportunity|sell|hold|accumulate|add to|exit|book profits?|target( price)?|"
    r"outperform|underperform|overweight|underweight|upside|downside|recommend\w*|should (you )?invest|"
    r"will (rise|fall|rally|surge|drop|decline|go up|go down)|likely to (rise|fall|rally|surge|drop|decline)|"
    r"bullish|bearish|undervalued|overvalued|price prediction|forecast)\b",
    re.IGNORECASE,
)
WITHHELD = "(summary withheld: it contained opinion/advice-like wording)"


def is_clean(summary: str) -> bool:
    return not BANNED.search(summary)


def headlines(ticker: str, max_items: int, max_age_days: int) -> list[str]:
    """Recent headlines from yfinance (handles both old and new yfinance news formats)."""
    import yfinance as yf

    try:
        items = yf.Ticker(ticker).news or []
    except Exception as exc:
        log.debug("news failed for %s: %s", ticker, exc)
        return []
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    out = []
    for it in items:
        c = it.get("content", it)  # newer yfinance nests fields under "content"
        title = c.get("title")
        when = c.get("pubDate") or c.get("providerPublishTime")
        try:
            ts = (datetime.fromtimestamp(when, timezone.utc) if isinstance(when, (int, float))
                  else datetime.fromisoformat(str(when).replace("Z", "+00:00")))
        except (TypeError, ValueError):
            ts = None
        if title and (ts is None or ts >= cutoff):
            out.append(title.strip())
    return out[:max_items]


def summarise(company: str, titles: list[str], model: str, client=None) -> str:
    """One neutral summary. ``client`` can be injected for tests."""
    if not titles:
        return "No recent headlines."
    import anthropic

    client = client or anthropic.Anthropic()
    try:
        # fallbacks="default": if a safety classifier declines, the API retries on its
        # recommended fallback model server-side (needs this beta header).
        resp = client.beta.messages.create(
            model=model,
            max_tokens=1024,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "low"},
            system=SYSTEM,
            messages=[{"role": "user", "content": f"Company: {company}\nHeadlines:\n"
                       + "\n".join(f"- {t}" for t in titles)}],
        )
    except anthropic.APIError as exc:
        log.warning("Claude summary failed for %s: %s", company, exc)
        return "(summary unavailable)"
    if resp.stop_reason == "refusal":
        return "(summary unavailable)"
    text = " ".join(b.text for b in resp.content if b.type == "text").strip()
    return text if is_clean(text) else WITHHELD


def news_section(tickers: list[str], cfg: dict, names: dict[str, str] | None = None, client=None) -> str | None:
    """Text block with one summary per stock, or None if disabled / no API key."""
    env.load_env()
    n = cfg.get("news", {})
    if not n.get("enabled") or not (client or env.get("ANTHROPIC_API_KEY")):
        return None
    lines = ["News (neutral summaries of recent headlines, not advice):"]
    for t in tickers:
        name = (names or {}).get(t, t.removesuffix(".NS"))
        text = summarise(name, headlines(t, n["max_headlines_per_stock"], n["max_age_days"]), n["model"], client)
        lines.append(f"- {t.removesuffix('.NS')}: {text}")
    return "\n".join(lines)
