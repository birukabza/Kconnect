from app.schemas.response import ConversationResponse, Intent


async def process_audio(
    audio_bytes: bytes,
    content_type: str | None = None
) -> ConversationResponse:
    """
    Process the user's audio.

    This is currently a test implementation.
    Biruk will replace this with the real AI pipeline.
    """

    return ConversationResponse(
        detected_language="en",
        transcript="Do I need a helmet?",
        translated_text="Test translation",
        translated_audio=None,
        intent=Intent(
            category="transport",
            sub_category="moto",
            situation="helmet_use"
        ),
        cultural_tip="Test cultural tip",
        source="Test source"
    )