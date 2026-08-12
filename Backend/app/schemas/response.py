from typing import Optional

from pydantic import BaseModel


class Intent(BaseModel):
    category: Optional[str] = None
    sub_category: Optional[str] = None
    situation: Optional[str] = None


class ConversationResponse(BaseModel):
    detected_language: str
    transcript: str
    translated_text: str
    translated_audio: Optional[str] = None
    intent: Optional[Intent] = None
    cultural_tip: Optional[str] = None
    source: Optional[str] = None