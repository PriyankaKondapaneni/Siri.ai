from fastapi import APIRouter

from app.config import ANTHROPIC_API_KEY

router = APIRouter()


@router.get("/health")
def health():
    return {"ok": True, "app": "siri.ai", "hasClaudeKey": bool(ANTHROPIC_API_KEY)}
