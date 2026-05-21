"""Outcome capture — the training labels for a future ADHD model."""
from fastapi import APIRouter, Depends, HTTPException

from app import store
from app.deps import require_auth
from app.models.plan import FeedbackReport, OutcomeReport

router = APIRouter(prefix="/plans")


@router.post("/{plan_id}/complete")
def record_outcomes(plan_id: str, body: OutcomeReport, user=Depends(require_auth)):
    if not store.get_plan(plan_id, user["id"]):
        raise HTTPException(404, "Plan not found")
    touched = store.record_outcomes(plan_id, user["id"], body.completed, body.deferred)
    return {"ok": True, "updated": touched}


@router.post("/{plan_id}/feedback")
def record_feedback(plan_id: str, body: FeedbackReport, user=Depends(require_auth)):
    if not store.get_plan(plan_id, user["id"]):
        raise HTTPException(404, "Plan not found")
    store.set_feedback(plan_id, user["id"], body.helpful, body.energy_self_report)
    return {"ok": True}
