from pymongo.database import Database

from app.schemas.knowledge import KnowledgeSearchResult
from app.services.gemini_embeddings import (
    EmbeddingProvider,
    GeminiEmbeddingService,
)
from app.services.knowledge_index import (
    COLLECTION_NAME,
    VECTOR_INDEX_NAME,
)


class KnowledgeIndexEmptyError(RuntimeError):
    pass


def build_vector_search_pipeline(
    query_embedding: list[float],
    model: str,
    dimensions: int,
    category: str,
    sub_category: str,
    situation: str | None,
    top_k: int,
) -> list[dict]:
    filters = [
        {"active": {"$eq": True}},
        {"embedding_model": {"$eq": model}},
        {"embedding_dimensions": {"$eq": dimensions}},
        {"category": {"$eq": category}},
        {"sub_category": {"$eq": sub_category}},
    ]

    if situation:
        filters.append({"situation": {"$eq": situation}})

    return [
        {
            "$vectorSearch": {
                "index": VECTOR_INDEX_NAME,
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": max(100, top_k * 20),
                "limit": top_k,
                "filter": {
                    "$and": filters
                },
            }
        },
        {
            "$project": {
                "_id": 0,
                "id": 1,
                "category": 1,
                "sub_category": 1,
                "situation": 1,
                "rwanda_context": 1,
                "suggested_tip": 1,
                "source": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]


def search_knowledge(
    database: Database,
    query: str,
    category: str,
    sub_category: str,
    situation: str | None = None,
    top_k: int = 3,
    embedding_provider: EmbeddingProvider | None = None,
) -> list[KnowledgeSearchResult]:
    provider = embedding_provider or GeminiEmbeddingService()
    query_embedding = provider.embed_query(query)
    documents = list(
        database[COLLECTION_NAME].aggregate(
            build_vector_search_pipeline(
                query_embedding=query_embedding,
                model=provider.model,
                dimensions=provider.dimensions,
                category=category,
                sub_category=sub_category,
                situation=situation,
                top_k=top_k,
            )
        )
    )

    if not documents:
        raise KnowledgeIndexEmptyError(
            "Knowledge index is empty. Run dataset ingestion first."
        )

    return [
        KnowledgeSearchResult(
            id=document["id"],
            category=document["category"],
            sub_category=document["sub_category"],
            situation=document["situation"],
            rwanda_context=document["rwanda_context"],
            suggested_tip=document["suggested_tip"],
            source=document.get("source"),
            score=document["score"],
        )
        for document in documents
    ]
