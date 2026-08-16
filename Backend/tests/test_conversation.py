from types import SimpleNamespace

from bson import ObjectId
from fastapi.testclient import TestClient
import pytest

from app.core.auth import get_current_user
from app.core.database import get_database
from app.main import app


client = TestClient(app)


class FakeTemporaryConversations:
    def __init__(self):
        self.documents = []
        self.indexes = []

    def create_index(self, field, **options):
        self.indexes.append((field, options))
        return options.get("name", f"{field}_1")

    def insert_one(self, document):
        stored_document = {
            **document,
            "_id": ObjectId(),
        }
        self.documents.append(stored_document)
        return SimpleNamespace(inserted_id=stored_document["_id"])

    def update_one(self, query, update):
        document = next(
            (
                item
                for item in self.documents
                if all(
                    item.get(key) == value
                    for key, value in query.items()
                )
            ),
            None,
        )

        if document is None:
            return SimpleNamespace(matched_count=0)

        push = update["$push"]["turns"]
        document["turns"].extend(push["$each"])
        document["turns"] = document["turns"][push["$slice"]:]
        document.update(update["$set"])

        return SimpleNamespace(matched_count=1)


class FakeDatabase:
    def __init__(self):
        self.temporary_conversations = FakeTemporaryConversations()

    def __getitem__(self, collection_name):
        assert collection_name == "temporary_conversations"
        return self.temporary_conversations


@pytest.fixture(autouse=True)
def authenticated_user():
    database = FakeDatabase()
    user_id = ObjectId()
    app.dependency_overrides[get_current_user] = lambda: {
        "_id": user_id,
        "name": "Test User",
        "email": "test@example.com",
    }
    app.dependency_overrides[get_database] = lambda: database

    yield database

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_database, None)


def test_health():
    response = client.get("/api/health")

    assert response.status_code == 200


def test_conversation(monkeypatch, authenticated_user):
    async def successful_process_audio(
        audio_bytes,
        content_type=None,
        filename=None,
        direction=None,
        database=None,
    ):
        return {
            "detected_language": "en",
            "transcript": "Hello",
            "translated_text": "Muraho",
            "translated_audio": "AAAA",
            "translated_audio_mime_type": "audio/mpeg",
            "intent": {
                "category": "transport",
                "sub_category": "moto",
                "situation": "helmet_use",
                "search_query": "moto passenger helmet Rwanda",
            },
            "cultural_tip": "Fasten the helmet before the moto moves.",
            "source": "Rwanda National Police",
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
    assert data["intent"]["situation"] == "helmet_use"
    assert data["cultural_tip"] == (
        "Fasten the helmet before the moto moves."
    )
    assert ObjectId.is_valid(data["conversation_id"])

    stored = authenticated_user.temporary_conversations.documents[0]
    assert len(stored["turns"]) == 1
    assert stored["turns"][0]["transcript"] == "Hello"
    assert stored["turns"][0]["translated_text"] == "Muraho"
    assert stored["turns"][0]["cultural_tip"] == (
        "Fasten the helmet before the moto moves."
    )
    assert "translated_audio" not in stored["turns"][0]
    assert stored["expires_at"] > stored["updated_at"]


def test_conversation_continues_hidden_temporary_context(
    monkeypatch,
    authenticated_user,
):
    async def successful_process_audio(
        audio_bytes,
        content_type=None,
        filename=None,
        direction=None,
        database=None,
    ):
        return {
            "detected_language": "en",
            "transcript": "Hello",
            "translated_text": "Muraho",
        }

    monkeypatch.setattr(
        "app.api.conversation.process_audio",
        successful_process_audio,
    )

    first_response = client.post(
        "/api/conversation",
        data={"direction": "en-to-rw"},
        files={"audio": ("first.wav", b"first", "audio/wav")},
    )
    conversation_id = first_response.json()["conversation_id"]

    second_response = client.post(
        "/api/conversation",
        data={
            "direction": "en-to-rw",
            "conversation_id": conversation_id,
        },
        files={"audio": ("second.wav", b"second", "audio/wav")},
    )

    assert second_response.status_code == 200
    assert second_response.json()["conversation_id"] == conversation_id
    assert len(
        authenticated_user.temporary_conversations.documents
    ) == 1
    assert len(
        authenticated_user.temporary_conversations.documents[0]["turns"]
    ) == 2


def test_temporary_context_cannot_cross_user_ownership(
    monkeypatch,
    authenticated_user,
):
    async def successful_process_audio(
        audio_bytes,
        content_type=None,
        filename=None,
        direction=None,
        database=None,
    ):
        return {
            "detected_language": "en",
            "transcript": "Hello",
            "translated_text": "Muraho",
        }

    monkeypatch.setattr(
        "app.api.conversation.process_audio",
        successful_process_audio,
    )

    first_response = client.post(
        "/api/conversation",
        data={"direction": "en-to-rw"},
        files={"audio": ("first.wav", b"first", "audio/wav")},
    )
    first_id = first_response.json()["conversation_id"]

    app.dependency_overrides[get_current_user] = lambda: {
        "_id": ObjectId(),
        "name": "Another User",
        "email": "another@example.com",
    }

    second_response = client.post(
        "/api/conversation",
        data={
            "direction": "en-to-rw",
            "conversation_id": first_id,
        },
        files={"audio": ("second.wav", b"second", "audio/wav")},
    )

    assert second_response.status_code == 200
    assert second_response.json()["conversation_id"] != first_id
    assert len(
        authenticated_user.temporary_conversations.documents
    ) == 2


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
        database=None,
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
