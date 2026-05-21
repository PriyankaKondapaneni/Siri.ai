"""Recovery Mode endpoints."""
from fastapi import APIRouter, Depends

from app import store
from app.deps import require_auth
from app.engine import recovery

router = APIRouter(prefix="/recovery")


@router.get("/status")
def status(user=Depends(require_auth)):
    stats = store.recovery_stats(user["id"])
    in_recovery, hint = recovery.evaluate(
        stats.days_since_seen, stats.open_outcomes, stats.overwhelm_streak
    )
    return {
        "in_recovery": in_recovery,
        "hint": hint,
        "signals": {
            "days_since_seen": stats.days_since_seen,
            "open_outcomes": stats.open_outcomes,
            "overwhelm_streak": stats.overwhelm_streak,
        },
    }


@router.post("/restart")
def restart(user=Depends(require_auth)):
    """Gentle re-entry: reset the clock, archive the backlog. No shame."""
    store.restart_recovery(user["id"])
    return {"ok": True, "message": "Fresh start. Nothing carried over."}
