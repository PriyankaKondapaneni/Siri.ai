from pydantic import BaseModel
from typing import Optional


class Email(BaseModel):
    id: str
    user_id: str
    sender: str
    sender_email: str
    subject: str
    preview: Optional[str] = None
    body: Optional[str] = None
    received_at: int
    is_read: int = 0
    is_starred: int = 0
    label: Optional[str] = None
