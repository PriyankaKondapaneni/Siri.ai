import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import (
    assistant, auth, chats, emails, events, health, notes, plans, recovery, tasks,
)
from app.config import ANTHROPIC_API_KEY, CLIENT_DIST
from app.db import init_db

init_db()

app = FastAPI(title="siri.ai", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth")
app.include_router(tasks.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(emails.router, prefix="/api")
app.include_router(chats.router, prefix="/api")
app.include_router(assistant.router, prefix="/api")
app.include_router(plans.router, prefix="/api")
app.include_router(recovery.router, prefix="/api")


# Serve the built React client in production (mirror of the Node setup).
if CLIENT_DIST.exists():
    app.mount("/assets", StaticFiles(directory=CLIENT_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        if full_path.startswith("api/"):
            return {"error": "not found"}
        index = CLIENT_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
        return {"error": "client build not found"}


if not ANTHROPIC_API_KEY:
    logging.getLogger("uvicorn").warning(
        "ANTHROPIC_API_KEY not set — /assistant/adhd-plan will still work via the rule-based engine."
    )
