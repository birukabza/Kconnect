from typing import Any


conversations: dict[str, list[dict[str, Any]]] = {}


def add_turn(
    conversation_id: str,
    turn: dict[str, Any]
) -> None:
    """
    Add one turn to a conversation.
    """

    if conversation_id not in conversations:
        conversations[conversation_id] = []

    conversations[conversation_id].append(turn)


def get_conversation(
    conversation_id: str
) -> list[dict[str, Any]]:
    """
    Get all turns for a conversation.
    """

    return conversations.get(conversation_id, [])