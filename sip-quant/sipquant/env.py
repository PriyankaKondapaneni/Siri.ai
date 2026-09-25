"""Secrets come from a local .env file (never from code or config.yaml).

.env (in the project root, git-ignored)::

    TELEGRAM_BOT_TOKEN=123456:ABC...
    TELEGRAM_CHAT_ID=123456789
    ANTHROPIC_API_KEY=sk-ant-...      # optional: enables news summaries
"""
from __future__ import annotations

import os

from .config import PROJECT_ROOT


def load_env() -> None:
    """Load .env into os.environ (existing environment variables win)."""
    try:
        from dotenv import load_dotenv
    except ImportError:  # python-dotenv not installed: rely on the real environment
        return
    load_dotenv(PROJECT_ROOT / ".env", override=False)


def get(name: str) -> str | None:
    value = os.environ.get(name, "").strip()
    return value or None
