import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "siri.db"

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALG = "HS256"
JWT_EXPIRES_DAYS = 30

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY") or None
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-opus-4-7")

PORT = int(os.environ.get("PORT", "4000"))

CLIENT_DIST = BASE_DIR.parent / "client" / "dist"
