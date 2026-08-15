from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from bson import ObjectId
from jwt import InvalidTokenError

from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
)


def hash_password(password: str) -> str:
    encoded_password = password.encode("utf-8")

    if len(encoded_password) > 72:
        raise ValueError("Password must be at most 72 bytes.")

    return bcrypt.hashpw(
        encoded_password,
        bcrypt.gensalt(),
    ).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("ascii"),
        )
    except (TypeError, ValueError):
        return False


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)

    return jwt.encode(
        {
            "sub": user_id,
            "iat": now,
            "exp": now + timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            ),
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
    except InvalidTokenError as error:
        raise ValueError("Invalid or expired access token.") from error

    user_id = payload.get("sub")

    if not isinstance(user_id, str) or not ObjectId.is_valid(user_id):
        raise ValueError("Invalid access token subject.")

    return user_id


def serialize_user(user: dict[str, Any]) -> dict[str, str]:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
    }
