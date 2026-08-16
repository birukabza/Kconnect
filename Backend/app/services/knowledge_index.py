from dataclasses import dataclass
from time import monotonic, sleep

from pymongo.database import Database
from pymongo.operations import SearchIndexModel

from app.core.config import GEMINI_EMBEDDING_DIMENSIONS


COLLECTION_NAME = "knowledge_items"
VECTOR_INDEX_NAME = "knowledge_embedding_vector"


@dataclass(frozen=True)
class VectorIndexStatus:
    name: str
    status: str
    queryable: bool
    definition_ready: bool
    created: bool = False
    updated: bool = False


def build_vector_index_definition(
    dimensions: int = GEMINI_EMBEDDING_DIMENSIONS,
) -> dict:
    return {
        "fields": [
            {
                "type": "vector",
                "path": "embedding",
                "numDimensions": dimensions,
                "similarity": "cosine",
            },
            {"type": "filter", "path": "active"},
            {"type": "filter", "path": "embedding_model"},
            {"type": "filter", "path": "embedding_dimensions"},
            {"type": "filter", "path": "category"},
            {"type": "filter", "path": "sub_category"},
            {"type": "filter", "path": "situation"},
        ]
    }


def get_vector_index_status(
    database: Database,
    dimensions: int = GEMINI_EMBEDDING_DIMENSIONS,
) -> VectorIndexStatus | None:
    collection = database[COLLECTION_NAME]

    for index in collection.list_search_indexes():
        if index.get("name") == VECTOR_INDEX_NAME:
            return VectorIndexStatus(
                name=VECTOR_INDEX_NAME,
                status=index.get("status", "UNKNOWN"),
                queryable=bool(index.get("queryable", False)),
                definition_ready=_definition_matches(
                    index.get("latestDefinition")
                    or index.get("definition"),
                    build_vector_index_definition(dimensions),
                ),
            )

    return None


def _definition_matches(
    current: dict | None,
    expected: dict,
) -> bool:
    if not current:
        return False

    current_fields = {
        field.get("path"): field
        for field in current.get("fields", [])
    }

    return all(
        current_fields.get(field["path"]) == field
        for field in expected["fields"]
    ) and len(current_fields) == len(expected["fields"])


def ensure_vector_index(
    database: Database,
    dimensions: int = GEMINI_EMBEDDING_DIMENSIONS,
) -> VectorIndexStatus:
    if COLLECTION_NAME not in database.list_collection_names():
        database.create_collection(COLLECTION_NAME)

    collection = database[COLLECTION_NAME]
    definition = build_vector_index_definition(dimensions)
    existing = next(
        (
            index
            for index in collection.list_search_indexes()
            if index.get("name") == VECTOR_INDEX_NAME
        ),
        None,
    )

    if existing is None:
        model = SearchIndexModel(
            definition=definition,
            name=VECTOR_INDEX_NAME,
            type="vectorSearch",
        )
        collection.create_search_index(model=model)
        return VectorIndexStatus(
            name=VECTOR_INDEX_NAME,
            status="CREATING",
            queryable=False,
            definition_ready=True,
            created=True,
        )

    current_definition = (
        existing.get("latestDefinition")
        or existing.get("definition")
    )
    needs_update = (
        existing.get("type") != "vectorSearch"
        or not _definition_matches(current_definition, definition)
    )

    if needs_update:
        collection.update_search_index(
            VECTOR_INDEX_NAME,
            definition,
        )

    return VectorIndexStatus(
        name=VECTOR_INDEX_NAME,
        status=existing.get("status", "UNKNOWN"),
        queryable=bool(existing.get("queryable", False)),
        definition_ready=not needs_update,
        updated=needs_update,
    )


def wait_for_vector_index(
    database: Database,
    dimensions: int = GEMINI_EMBEDDING_DIMENSIONS,
    timeout_seconds: int = 300,
    poll_seconds: int = 2,
) -> VectorIndexStatus:
    deadline = monotonic() + timeout_seconds

    while monotonic() < deadline:
        status = get_vector_index_status(database, dimensions)

        if (
            status
            and status.queryable
            and status.definition_ready
            and status.status.upper() == "READY"
        ):
            return status

        if status and status.status.upper() in {"FAILED", "DELETING"}:
            raise RuntimeError(
                f"Vector index entered {status.status} status."
            )

        sleep(poll_seconds)

    raise TimeoutError(
        f"Vector index was not queryable after {timeout_seconds} seconds."
    )
