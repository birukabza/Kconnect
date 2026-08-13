from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health():
    response = client.get("/api/health")

    assert response.status_code == 200


def test_conversation(monkeypatch):
    async def successful_process_audio(
        audio_bytes,
        content_type=None,
        filename=None,
        direction=None,
    ):
        return {
            "detected_language": "en",
            "transcript": "Hello",
            "translated_text": "Muraho",
            "translated_audio": "AAAA",
            "translated_audio_mime_type": "audio/mpeg",
        }

    monkeypatch.setattr(
        "app.api.conversation.process_audio",
        successful_process_audio
    )

    audio_content = b"fake audio data"

    response = client.post(
        "/api/conversation",
        data={
            "direction": "en-to-rw",
        },
        files={
            "audio": (
                "test.wav",
                audio_content,
                "audio/wav"
            )
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["detected_language"] == "en"
    assert "transcript" in data
    assert "translated_text" in data
    assert data["translated_audio_mime_type"] == "audio/mpeg"


def test_invalid_direction():
    audio_content = b"fake audio data"

    response = client.post(
        "/api/conversation",
        data={
            "direction": "fr-to-rw",
        },
        files={
            "audio": (
                "test.wav",
                audio_content,
                "audio/wav"
            )
        }
    )

    assert response.status_code == 400

    data = response.json()

    assert data["detail"] == "Unsupported translation direction."


def test_invalid_audio_type():
    audio_content = b"fake image data"

    response = client.post(
        "/api/conversation",
        data={
            "direction": "en-to-rw",
        },
        files={
            "audio": (
                "test.jpg",
                audio_content,
                "image/jpeg"
            )
        }
    )

    assert response.status_code == 400

    data = response.json()

    assert data["detail"] == "Unsupported audio file type."


def test_empty_audio():
    response = client.post(
        "/api/conversation",
        data={
            "direction": "en-to-rw",
        },
        files={
            "audio": (
                "empty.wav",
                b"",
                "audio/wav"
            )
        }
    )

    assert response.status_code == 400

    data = response.json()

    assert data["detail"] == "Audio file is empty."


def test_audio_too_large():
    audio_content = b"0" * (10 * 1024 * 1024 + 1)

    response = client.post(
        "/api/conversation",
        data={
            "direction": "en-to-rw",
        },
        files={
            "audio": (
                "large.wav",
                audio_content,
                "audio/wav"
            )
        }
    )

    assert response.status_code == 413

    data = response.json()

    assert data["detail"] == (
        "Audio file is too large. Maximum size is 10 MB."
    )


def test_missing_direction():
    response = client.post(
        "/api/conversation",
        files={
            "audio": (
                "test.wav",
                b"fake audio data",
                "audio/wav"
            )
        }
    )

    assert response.status_code == 422


def test_ai_processing_failure(monkeypatch):
    async def failing_process_audio(
        audio_bytes,
        content_type=None,
        filename=None,
        direction=None,
    ):
        raise Exception("Test AI failure")

    monkeypatch.setattr(
        "app.api.conversation.process_audio",
        failing_process_audio
    )

    response = client.post(
        "/api/conversation",
        data={
            "direction": "en-to-rw",
        },
        files={
            "audio": (
                "test.wav",
                b"fake audio data",
                "audio/wav"
            )
        }
    )

    assert response.status_code == 500

    data = response.json()

    assert data["detail"] == "Audio processing failed."
