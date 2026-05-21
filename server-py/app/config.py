import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = Path(os.environ.get("SIRI_DB_PATH") or (DATA_DIR / "siri.db"))

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_EXPIRES_DAYS = 30

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY") or None
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-opus-4-7")


def _env_bool(name: str, default: bool) -> bool:
    val = os.environ.get(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


# Paused by default: don't persist plans/outcomes for now. Flip to true (or set
# COLLECT_PLAN_DATA=true) to start the data flywheel. Recovery Mode also depends
# on this, since it reads persisted plan history.
COLLECT_PLAN_DATA = _env_bool("COLLECT_PLAN_DATA", False)

PORT = int(os.environ.get("PORT", "4000"))

CLIENT_DIST = BASE_DIR.parent / "client" / "dist"
