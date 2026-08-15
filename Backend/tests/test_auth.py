from types import SimpleNamespace

import bcrypt
from bson import ObjectId
from fastapi.testclient import TestClient
import pytest
from pymongo.errors import DuplicateKeyError

from app.core.database import get_database
from app.main import app


class FakeUsersCollection:
    def __init__(self):
        self.documents = []

    def create_index(self, *_args, **_kwargs):
        return "email_1"

    def insert_one(self, document):
        if any(
            user["email"] == document["email"]
            for user in self.documents
        ):
            raise DuplicateKeyError("Duplicate email")

        stored_document = {
            **document,
            "_id": ObjectId(),
        }
        self.documents.append(stored_document)

        return SimpleNamespace(inserted_id=stored_document["_id"])

    def find_one(self, query):
        return next(
            (
                document
                for document in self.documents
                if all(
                    document.get(key) == value
                    for key, value in query.items()
                )
            ),
            None,
        )


class FakeDatabase:
    def __init__(self):
        self.users = FakeUsersCollection()

    def __getitem__(self, collection_name):
        assert collection_name == "users"
        return self.users


@pytest.fixture
def auth_client():
    database = FakeDatabase()
    app.dependency_overrides[get_database] = lambda: database

    with TestClient(app) as client:
        yield client, database

    app.dependency_overrides.pop(get_database, None)


def register_user(client):
    return client.post(
        "/api/auth/register",
        json={
            "name": "Biruk Test",
            "email": "Biruk@example.com",
            "password": "strong-password",
        },
    )


def test_register_hashes_password_and_returns_session(auth_client):
    client, database = auth_client

    response = register_user(client)

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "biruk@example.com"

    stored_user = database.users.documents[0]
    assert "password" not in stored_user
    assert stored_user["password_hash"] != "strong-password"
    assert bcrypt.checkpw(
        b"strong-password",
        stored_user["password_hash"].encode("ascii"),
    )


def test_duplicate_email_is_rejected(auth_client):
    client, _database = auth_client

    assert register_user(client).status_code == 201
    response = register_user(client)

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "An account with this email already exists."
    )


def test_login_and_get_current_user(auth_client):
    client, _database = auth_client
    register_user(client)

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "biruk@example.com",
            "password": "strong-password",
        },
    )

    assert login_response.status_code == 200

    access_token = login_response.json()["access_token"]
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["name"] == "Biruk Test"


def test_invalid_password_is_rejected(auth_client):
    client, _database = auth_client
    register_user(client)

    response = client.post(
        "/api/auth/login",
        json={
            "email": "biruk@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_current_user_requires_token(auth_client):
    client, _database = auth_client

    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required."


def test_conversation_requires_token(auth_client):
    client, _database = auth_client

    response = client.post(
        "/api/conversation",
        data={"direction": "en-to-rw"},
        files={
            "audio": (
                "test.wav",
                b"fake audio data",
                "audio/wav",
            )
        },
    )

    assert response.status_code == 401
