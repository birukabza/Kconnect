import logging
from dataclasses import dataclass

from pymongo.database import Database

from app.core.config import RAG_MIN_SIMILARITY_SCORE, RAG_TOP_K
from app.schemas.response import Intent
from app.services.gemini_embeddings import EmbeddingProvider
from app.services.gemini_rag import GeminiRagError, GeminiRagService
from app.services.knowledge_retrieval import search_knowledge


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RagOrchestrationResult:
    intent: Intent | None = None
    cultural_tip: str | None = None
    source: str | None = None


def orchestrate_rag(
    database: Database,
    transcript: str,
    gemini_service: GeminiRagService | None = None,
    embedding_provider: EmbeddingProvider | None = None,
    top_k: int = RAG_TOP_K,
    minimum_score: float = RAG_MIN_SIMILARITY_SCORE,
) -> RagOrchestrationResult:
    try:
        service = gemini_service or GeminiRagService()
        intent = service.detect_intent(transcript)
    except GeminiRagError as error:
        logger.warning("Gemini intent detection skipped: %s", error)
        return RagOrchestrationResult()
    except Exception:
        logger.exception("Gemini intent detection failed")
        return RagOrchestrationResult()

    if intent is None:
        return RagOrchestrationResult()

    try:
        records = search_knowledge(
            database=database,
            query=intent.search_query or transcript,
            category=intent.category or "",
            sub_category=intent.sub_category or "",
            situation=intent.situation,
            top_k=top_k,
            embedding_provider=embedding_provider,
        )
    except Exception:
        logger.exception("RAG knowledge retrieval failed")
        return RagOrchestrationResult(intent=intent)

    grounded_records = [
        record for record in records if record.score >= minimum_score
    ]

    if not grounded_records:
        return RagOrchestrationResult(intent=intent)

    try:
        suggestion = service.generate_suggestion(
            transcript=transcript,
            intent=intent,
            records=grounded_records,
        )
    except GeminiRagError as error:
        logger.warning(
            "Gemini grounded suggestion generation skipped: %s",
            error,
        )
        return RagOrchestrationResult(intent=intent)
    except Exception:
        logger.exception("Gemini grounded suggestion generation failed")
        return RagOrchestrationResult(intent=intent)

    if not suggestion:
        return RagOrchestrationResult(intent=intent)

    source = next(
        (record.source for record in grounded_records if record.source),
        None,
    )
    return RagOrchestrationResult(
        intent=intent,
        cultural_tip=suggestion,
        source=source,
    )
