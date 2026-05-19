from typing import Literal, Optional
from pydantic import BaseModel, Field

Category = Literal["survival", "communication", "self_care", "chore", "work", "emotional", "other"]
Priority = Literal["high", "medium", "low"]


class TaskScores(BaseModel):
    urgency: int = Field(ge=0, le=10)
    importance: int = Field(ge=0, le=10)
    activation_energy: int = Field(ge=0, le=10)
    emotional_resistance: int = Field(ge=0, le=10)
    focus_required: int = Field(ge=1, le=5)
    duration_minutes: int = Field(ge=1)
    dopamine_reward: int = Field(ge=0, le=10)


class ScoredTask(BaseModel):
    raw: str
    category: Category
    scores: TaskScores
    priority_score: float = 0.0


class ActionStep(BaseModel):
    order: int
    text: str


class PlannedTask(BaseModel):
    raw: str
    rewrite: str
    category: Category
    duration_minutes: int
    priority: Priority
    why: str
    tiny_steps: list[ActionStep]


# Persistent task model (matches the SQLite tasks table)
class Task(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    duration: Optional[int] = None
    reminder: Optional[str] = None
    repeat_rule: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    list: str = "inbox"
    starred: int = 0
    parent_id: Optional[str] = None
    created_at: int
    updated_at: int
