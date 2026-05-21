from typing import Literal, Optional
from pydantic import BaseModel

from app.models.state import EmotionalAssessment
from app.models.task import ActionStep, PlannedTask


class PlanRequest(BaseModel):
    dump: str
    refine_with_ai: bool = False
    energy_self_report: Optional[Literal["low", "medium", "high"]] = None


class PlanResponse(BaseModel):
    plan_id: Optional[str] = None
    assessment: EmotionalAssessment
    do_now: list[PlannedTask]
    skip_today: list[str]
    one_tiny_step: ActionStep
    encouragement: Optional[str] = None
    recovery_hint: Optional[str] = None


class OutcomeReport(BaseModel):
    completed: list[int] = []
    deferred: list[int] = []


class FeedbackReport(BaseModel):
    helpful: bool
    energy_self_report: Optional[Literal["low", "medium", "high"]] = None
