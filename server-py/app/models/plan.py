from typing import Optional
from pydantic import BaseModel

from app.models.state import EmotionalAssessment
from app.models.task import ActionStep, PlannedTask


class PlanRequest(BaseModel):
    dump: str
    refine_with_ai: bool = False


class PlanResponse(BaseModel):
    assessment: EmotionalAssessment
    do_now: list[PlannedTask]
    skip_today: list[str]
    one_tiny_step: ActionStep
    encouragement: Optional[str] = None
    recovery_hint: Optional[str] = None
