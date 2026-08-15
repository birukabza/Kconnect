from datetime import datetime, timedelta, timezone
from typing import Any

from bson import ObjectId
from pymongo.database import Database

from app.core.config import (
    TEMPORARY_CONVERSATION_MAX_TURNS,
    TEMPORARY_CONVERSATION_TTL_MINUTES,
)


COLLECTION_NAME = "temporary_conversations"


def store_temporary_turn(
    database: Database,
    user_id: ObjectId,
    turn: dict[str, Any],
    conversation_id: str | None = None,
) -> str:
    collection = database[COLLECTION_NAME]
    collection.create_index(
        "expires_at",
        expireAfterSeconds=0,
        name="temporary_conversations_ttl",
    )

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(
        minutes=TEMPORARY_CONVERSATION_TTL_MINUTES
    )
    stored_turn = {
        **turn,
        "created_at": now,
    }

    if conversation_id and ObjectId.is_valid(conversation_id):
        object_id = ObjectId(conversation_id)
        result = collection.update_one(
            {
                "_id": object_id,
                "user_id": user_id,
            },
            {
                "$push": {
                    "turns": {
                        "$each": [stored_turn],
                        "$slice": -TEMPORARY_CONVERSATION_MAX_TURNS,
                    }
                },
                "$set": {
                    "updated_at": now,
                    "expires_at": expires_at,
                },
            },
        )

        if result.matched_count:
            return conversation_id

    result = collection.insert_one(
        {
            "user_id": user_id,
            "turns": [stored_turn],
            "created_at": now,
            "updated_at": now,
            "expires_at": expires_at,
        }
    )

    return str(result.inserted_id)
