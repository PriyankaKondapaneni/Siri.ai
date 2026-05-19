from pydantic import BaseModel
from typing import Optional, Literal


class Chat(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: int
    updated_at: int


class Message(BaseModel):
    id: str
    chat_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: int


class ChatCreate(BaseModel):
    title: Optional[str] = None


class MessageCreate(BaseModel):
    content: str
