from pydantic import BaseModel
from typing import Optional


class Note(BaseModel):
    id: str
    user_id: str
    title: str
    content: Optional[str] = ""
    tags: Optional[str] = ""
    pinned: int = 0
    created_at: int
    updated_at: int


class NoteCreate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None
