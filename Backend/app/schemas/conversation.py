from typing import Literal

from pydantic import BaseModel


class ConversationRequest(BaseModel):
    source_language: Literal["en", "rw"]
    target_language: Literal["en", "rw"]
    conversation_id: str