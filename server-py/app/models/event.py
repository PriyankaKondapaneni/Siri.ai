from pydantic import BaseModel
from typing import Optional


class Event(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    start_at: str
    end_at: str
    location: Optional[str] = None
    color: str = "indigo"
    created_at: int


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_at: str
    end_at: str
    location: Optional[str] = None
    color: Optional[str] = "indigo"
