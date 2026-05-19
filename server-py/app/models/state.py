from typing import Literal
from pydantic import BaseModel, Field

EmotionalState = Literal["okay", "stressed", "overwhelmed", "low_energy", "shutdown_risk"]
EnergyLevel = Literal["low", "medium", "high"]


class EmotionalAssessment(BaseModel):
    state: EmotionalState
    energy: EnergyLevel
    overwhelm_score: int = Field(ge=0, le=10)
    distress_signals: list[str]
