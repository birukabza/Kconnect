import logging
from dataclasses import dataclass

from pymongo.database import Database

from app.core.config import RAG_MIN_SIMILARITY_SCORE, RAG_TOP_K
from app.schemas.response import Intent
from app.services.gemini_embeddings import EmbeddingProvider
from app.services.gemini_rag import GeminiRagError, GeminiRagService
from app.services.knowledge_retrieval import search_knowledge
from app.services.rag_trace import trace_rag


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
    trace_rag(
        "pipeline.started",
        transcript=transcript,
        top_k=top_k,
        minimum_score=minimum_score,
    )

    try:
        service = gemini_service or GeminiRagService()
        trace_rag("intent.started")
        intent = service.detect_intent(transcript)
    except GeminiRagError as error:
        trace_rag("intent.skipped", reason=str(error))
        logger.warning("Gemini intent detection skipped: %s", error)
        return RagOrchestrationResult()
    except Exception as error:
        trace_rag("intent.failed", reason=str(error))
        logger.exception("Gemini intent detection failed")
        return RagOrchestrationResult()

    if intent is None:
        trace_rag(
            "pipeline.completed",
            outcome="no_matching_intent",
        )
        return RagOrchestrationResult()

    query = intent.search_query or transcript
    trace_rag("intent.detected", **intent.model_dump())
    trace_rag(
        "retrieval.started",
        query=query,
        filters={
            "category": intent.category or "",
            "sub_category": intent.sub_category or "",
            "situation": intent.situation,
        },
        top_k=top_k,
    )

    try:
        records = search_knowledge(
            database=database,
            query=query,
            category=intent.category or "",
            sub_category=intent.sub_category or "",
            situation=intent.situation,
            top_k=top_k,
            embedding_provider=embedding_provider,
        )
    except Exception as error:
        trace_rag("retrieval.failed", reason=str(error))
        logger.exception("RAG knowledge retrieval failed")
        return RagOrchestrationResult(intent=intent)

    trace_rag(
        "retrieval.completed",
        result_count=len(records),
        results=[
            {
                "id": record.id,
                "score": record.score,
                "situation": record.situation,
                "source": record.source,
            }
            for record in records
        ],
    )

    grounded_records = [
        record for record in records if record.score >= minimum_score
    ]
    trace_rag(
        "grounding.completed",
        accepted_count=len(grounded_records),
        rejected_count=len(records) - len(grounded_records),
        minimum_score=minimum_score,
        accepted_records=[
            {
                "id": record.id,
                "score": record.score,
                "rwanda_context": record.rwanda_context,
                "suggested_tip": record.suggested_tip,
                "source": record.source,
            }
            for record in grounded_records
        ],
    )

    if not grounded_records:
        trace_rag(
            "pipeline.completed",
            outcome="no_grounded_records",
        )
        return RagOrchestrationResult(intent=intent)

    try:
        trace_rag(
            "suggestion.started",
            record_ids=[record.id for record in grounded_records],
        )
        suggestion = service.generate_suggestion(
            transcript=transcript,
            intent=intent,
            records=grounded_records,
        )
    except GeminiRagError as error:
        trace_rag("suggestion.skipped", reason=str(error))
        logger.warning(
            "Gemini grounded suggestion generation skipped: %s",
            error,
        )
        return RagOrchestrationResult(intent=intent)
    except Exception as error:
        trace_rag("suggestion.failed", reason=str(error))
        logger.exception("Gemini grounded suggestion generation failed")
        return RagOrchestrationResult(intent=intent)

    if not suggestion:
        trace_rag(
            "pipeline.completed",
            outcome="suggestion_not_supported",
        )
        return RagOrchestrationResult(intent=intent)

    source = next(
        (record.source for record in grounded_records if record.source),
        None,
    )
    trace_rag(
        "suggestion.generated",
        suggestion=suggestion,
        source=source,
    )
    trace_rag("pipeline.completed", outcome="suggestion_generated")
    return RagOrchestrationResult(
        intent=intent,
        cultural_tip=suggestion,
        source=source,
    )
