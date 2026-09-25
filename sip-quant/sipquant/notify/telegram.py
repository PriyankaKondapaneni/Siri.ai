"""Send text to your Telegram chat using python-telegram-bot.

Setup: talk to @BotFather in Telegram -> /newbot -> copy the token. Send your new
bot any message, then open https://api.telegram.org/bot<TOKEN>/getUpdates and
copy "chat":{"id": ...}. Put both in .env (see sipquant/env.py).
"""
from __future__ import annotations

import asyncio
import html

from .. import env

MAX_CHARS = 3500  # Telegram's limit is 4096; leave room for the <pre> tags


def chunks(text: str, limit: int = MAX_CHARS) -> list[str]:
    """Split on line boundaries into pieces no longer than ``limit``."""
    out, cur = [], ""
    for line in text.splitlines():
        while len(line) > limit:  # a single monster line: hard-split it
            out.append(line[:limit])
            line = line[limit:]
        if len(cur) + len(line) + 1 > limit:
            out.append(cur)
            cur = ""
        cur += line + "\n"
    if cur.strip():
        out.append(cur)
    return out


def send(text: str) -> None:
    """Send ``text`` as monospaced message(s). Raises if the token/chat id are missing."""
    env.load_env()
    token, chat_id = env.get("TELEGRAM_BOT_TOKEN"), env.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        raise RuntimeError("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in .env")
    asyncio.run(_send(token, chat_id, chunks(text)))


async def _send(token: str, chat_id: str, parts: list[str]) -> None:
    # python-telegram-bot is async (like CompletableFuture); asyncio.run() above waits for it.
    from telegram import Bot

    async with Bot(token) as bot:
        for part in parts:
            await bot.send_message(chat_id=chat_id, text=f"<pre>{html.escape(part)}</pre>", parse_mode="HTML")
