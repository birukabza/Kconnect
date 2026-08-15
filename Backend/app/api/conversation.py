import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.auth import get_current_user
from app.schemas.response import ConversationResponse
from app.services.ai_pipeline import process_audio

router = APIRouter()

logger = logging.getLogger(__name__)

ALLOWED_AUDIO_TYPES = {
    "audio/wav",
    "audio/webm",
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
}

MAX_AUDIO_SIZE = 10 * 1024 * 1024

ALLOWED_DIRECTIONS = {
    "en-to-rw",
    "rw-to-en",
    "en2rw",
    "rw2en",
}


@router.post(
    "/conversation",
    response_model=ConversationResponse,
)
async def process_conversation(
    current_user: Annotated[
        dict[str, Any],
        Depends(get_current_user),
    ],
    audio: UploadFile = File(...),
    direction: str = Form(...),
):
    logger.info(
        "Conversation request received: user_id=%s filename=%s content_type=%s",
        current_user["_id"],
        audio.filename,
        audio.content_type,
    )

    content_type = (
        (audio.content_type or "")
        .split(";")[0]
        .strip()
        .lower()
    )

    if content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio file type.",
        )

    if direction not in ALLOWED_DIRECTIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported translation direction.",
        )

    audio_bytes = await audio.read()

    if not audio_bytes:
        raise HTTPException(
            status_code=400,
            detail="Audio file is empty.",
        )

    if len(audio_bytes) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=413,
            detail=(
                "Audio file is too large. "
                "Maximum size is 10 MB."
            ),
        )

    logger.info(
        "Audio validated successfully: size=%d bytes type=%s",
        len(audio_bytes),
        content_type,
    )

    logger.info("Sending audio to AI pipeline.")

    try:
        result = await process_audio(
            audio_bytes=audio_bytes,
            content_type=content_type,
            filename=audio.filename,
            direction=direction,
        )

        logger.info("AI pipeline completed successfully.")

    except Exception:
        logger.exception("AI pipeline failed.")

        raise HTTPException(
            status_code=500,
            detail="Audio processing failed.",
        )

    return result
