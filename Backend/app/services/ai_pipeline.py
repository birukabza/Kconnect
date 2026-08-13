import base64
import json
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from google.cloud import speech
from google.cloud import texttospeech
from google.cloud import translate_v3 as translate

from app.schemas.response import ConversationResponse


BACKEND_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BACKEND_DIR / ".env")

AUDIO_MIME_TYPE = "audio/mpeg"
DEFAULT_DIRECTION = "en-to-rw"
RW_TTS_FALLBACK_LANGUAGE = os.getenv(
    "GOOGLE_TTS_RW_FALLBACK_LANGUAGE",
    "sw-KE",
)

DIRECTION_CONFIG = {
    "en-to-rw": {
        "source_language": "en",
        "target_language": "rw",
        "stt_language_code": "en-US",
    },
    "en2rw": {
        "source_language": "en",
        "target_language": "rw",
        "stt_language_code": "en-US",
    },
    "rw-to-en": {
        "source_language": "rw",
        "target_language": "en",
        "stt_language_code": "rw-RW",
    },
    "rw2en": {
        "source_language": "rw",
        "target_language": "en",
        "stt_language_code": "rw-RW",
    },
}


def _credential_path() -> str:
    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    if not key_path:
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS is not set."
        )

    key_path = os.path.expanduser(key_path.strip("\"'"))

    if not os.path.exists(key_path):
        raise RuntimeError(
            "Google service account file was not found."
        )

    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path
    return key_path


@lru_cache(maxsize=1)
def _google_project_id() -> str:
    key_path = _credential_path()

    with open(key_path, encoding="utf-8") as key_file:
        project_id = json.load(key_file).get("project_id")

    if not project_id:
        raise RuntimeError(
            "Google service account file does not include a project_id."
        )

    return project_id


@lru_cache(maxsize=1)
def _speech_client() -> speech.SpeechClient:
    _credential_path()
    return speech.SpeechClient()


@lru_cache(maxsize=1)
def _translation_client() -> translate.TranslationServiceClient:
    _credential_path()
    return translate.TranslationServiceClient()


@lru_cache(maxsize=1)
def _tts_client() -> texttospeech.TextToSpeechClient:
    _credential_path()
    return texttospeech.TextToSpeechClient()


def _stt_config_for(
    content_type: str | None,
    filename: str | None,
    language_code: str,
) -> speech.RecognitionConfig:
    kwargs = {
        "language_code": language_code,
        "enable_automatic_punctuation": True,
    }

    name = (filename or "").lower()
    mime_type = (content_type or "").lower()

    if "webm" in mime_type or name.endswith(".webm"):
        kwargs["encoding"] = (
            speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
        )
        kwargs["sample_rate_hertz"] = 48000
    elif "ogg" in mime_type or name.endswith(".ogg"):
        kwargs["encoding"] = (
            speech.RecognitionConfig.AudioEncoding.OGG_OPUS
        )
        kwargs["sample_rate_hertz"] = 48000
    elif (
        "mpeg" in mime_type
        or "mp3" in mime_type
        or name.endswith(".mp3")
    ):
        kwargs["encoding"] = speech.RecognitionConfig.AudioEncoding.MP3

    return speech.RecognitionConfig(**kwargs)


async def _transcribe_audio(
    audio_bytes: bytes,
    content_type: str | None,
    filename: str | None,
    language_code: str,
) -> str:
    client = _speech_client()

    response = client.recognize(
        config=_stt_config_for(
            content_type=content_type,
            filename=filename,
            language_code=language_code,
        ),
        audio=speech.RecognitionAudio(content=audio_bytes),
    )

    transcript = " ".join(
        result.alternatives[0].transcript
        for result in response.results
        if result.alternatives
    ).strip()

    if not transcript:
        raise RuntimeError(
            "No speech recognized. Try speaking louder or recording longer."
        )

    return transcript


async def _translate_text(
    text: str,
    source_language: str,
    target_language: str,
) -> str:
    project_id = _google_project_id()
    client = _translation_client()

    response = client.translate_text(
        request={
            "parent": f"projects/{project_id}/locations/global",
            "contents": [text],
            "mime_type": "text/plain",
            "source_language_code": source_language,
            "target_language_code": target_language,
        }
    )

    return response.translations[0].translated_text


@lru_cache(maxsize=4)
def _pick_rw_voice() -> tuple[str, str]:
    client = _tts_client()

    rw_voices = client.list_voices(language_code="rw").voices

    if rw_voices:
        voice = rw_voices[0]
        return voice.language_codes[0], voice.name

    fallback_voices = client.list_voices(
        language_code=RW_TTS_FALLBACK_LANGUAGE
    ).voices

    if not fallback_voices:
        raise RuntimeError(
            f"No {RW_TTS_FALLBACK_LANGUAGE} TTS voices are available."
        )

    chirp_voices = [
        voice
        for voice in fallback_voices
        if "Chirp3-HD" in voice.name
    ]
    voice = chirp_voices[0] if chirp_voices else fallback_voices[0]

    return voice.language_codes[0], voice.name


async def _synthesize_speech(
    text: str,
    target_language: str,
) -> bytes:
    client = _tts_client()

    if target_language == "rw":
        language_code, voice_name = _pick_rw_voice()
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_name,
        )
    else:
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
        )

    response = client.synthesize_speech(
        input=texttospeech.SynthesisInput(text=text),
        voice=voice,
        audio_config=texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
        ),
    )

    return response.audio_content


def _direction_config(direction: str | None):
    normalized = direction or DEFAULT_DIRECTION

    if normalized not in DIRECTION_CONFIG:
        raise ValueError("Unsupported translation direction.")

    return DIRECTION_CONFIG[normalized]


async def process_audio(
    audio_bytes: bytes,
    content_type: str | None = None,
    filename: str | None = None,
    direction: str | None = None,
) -> ConversationResponse:
    """
    Run the speech-to-speech path:
    Speech-to-Text -> Translation -> Text-to-Speech.
    """

    config = _direction_config(direction)

    transcript = await _transcribe_audio(
        audio_bytes=audio_bytes,
        content_type=content_type,
        filename=filename,
        language_code=config["stt_language_code"],
    )

    translated_text = await _translate_text(
        text=transcript,
        source_language=config["source_language"],
        target_language=config["target_language"],
    )

    translated_audio = await _synthesize_speech(
        text=translated_text,
        target_language=config["target_language"],
    )

    return ConversationResponse(
        detected_language=config["source_language"],
        transcript=transcript,
        translated_text=translated_text,
        translated_audio=base64.b64encode(translated_audio).decode("ascii"),
        translated_audio_mime_type=AUDIO_MIME_TYPE,
    )
