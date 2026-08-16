from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path

from pymongo.database import Database

from app.services.gemini_embeddings import (
    EmbeddingProvider,
    GeminiEmbeddingService,
)
from app.services.knowledge_dataset import (
    DEFAULT_DATASET_PATH,
    load_knowledge_dataset,
)
from app.services.knowledge_index import (
    COLLECTION_NAME,
    ensure_vector_index,
)


@dataclass(frozen=True)
class KnowledgeIngestionReport:
    total_records: int
    embedded_records: int
    reused_embeddings: int
    upserted_records: int
    vector_index_name: str
    vector_index_status: str


def ingest_knowledge_dataset(
    database: Database,
    dataset_path: Path | str = DEFAULT_DATASET_PATH,
    embedding_provider: EmbeddingProvider | None = None,
) -> KnowledgeIngestionReport:
    items = load_knowledge_dataset(dataset_path)
    provider = embedding_provider or GeminiEmbeddingService()
    collection = database[COLLECTION_NAME]

    collection.create_index("category", name="knowledge_category")
    collection.create_index(
        [("category", 1), ("sub_category", 1)],
        name="knowledge_category_subcategory",
    )
    item_ids = [item.id for item in items]
    existing = {
        document["_id"]: document
        for document in collection.find(
            {"_id": {"$in": item_ids}},
            {
                "content_hash": 1,
                "embedding": 1,
                "embedding_model": 1,
                "embedding_dimensions": 1,
            },
        )
    }

    prepared = []
    pending = []
    embeddings_by_id = {}
    reused_embeddings = 0

    for item in items:
        embedding_text = item.rwanda_context
        content_hash = sha256(
            embedding_text.encode("utf-8")
        ).hexdigest()
        prepared.append((item, embedding_text, content_hash))

        existing_document = existing.get(item.id)

        if (
            existing_document
            and existing_document.get("content_hash") == content_hash
            and existing_document.get("embedding_model") == provider.model
            and existing_document.get("embedding_dimensions")
            == provider.dimensions
            and len(existing_document.get("embedding", []))
            == provider.dimensions
        ):
            embeddings_by_id[item.id] = existing_document["embedding"]
            reused_embeddings += 1
        else:
            pending.append((item.id, embedding_text))

    if pending:
        new_embeddings = provider.embed_documents(
            [text for _item_id, text in pending]
        )
        embeddings_by_id.update(
            {
                item_id: embedding
                for (item_id, _text), embedding in zip(
                    pending,
                    new_embeddings,
                    strict=True,
                )
            }
        )

    ingested_at = datetime.now(timezone.utc)

    for item, _embedding_text, content_hash in prepared:
        document = {
            "_id": item.id,
            **item.model_dump(),
        }
        document.update(
            {
                "id": item.id,
                "content_hash": content_hash,
                "embedding": embeddings_by_id[item.id],
                "embedding_model": provider.model,
                "embedding_dimensions": provider.dimensions,
                "active": True,
                "ingested_at": ingested_at,
            }
        )
        collection.replace_one(
            {"_id": item.id},
            document,
            upsert=True,
        )

    vector_index = ensure_vector_index(
        database,
        dimensions=provider.dimensions,
    )

    return KnowledgeIngestionReport(
        total_records=len(items),
        embedded_records=len(pending),
        reused_embeddings=reused_embeddings,
        upserted_records=len(items),
        vector_index_name=vector_index.name,
        vector_index_status=vector_index.status,
    )
