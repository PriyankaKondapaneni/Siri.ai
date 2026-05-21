from typing import Literal
from pydantic import BaseModel, Field

EmotionalState = Literal["okay", "stressed", "overwhelmed", "low_energy", "shutdown_risk"]
EnergyLevel = Literal["low", "medium", "high"]
EnergyMode = Literal["normal", "low_energy", "shutdown"]


class EmotionalAssessment(BaseModel):
    state: EmotionalState
    energy: EnergyLevel
    energy_mode: EnergyMode
    overwhelm_score: int = Field(ge=0, le=10)
    cognitive_load_budget: float = Field(ge=0)
    distress_signals: list[str]
    in_recovery: bool = False
