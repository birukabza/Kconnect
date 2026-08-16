import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import PyMongoError
from starlette.concurrency import run_in_threadpool

from app.core.auth import get_current_user
from app.core.database import get_database
from app.schemas.knowledge import (
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
)
from app.services.gemini_embeddings import EmbeddingServiceError
from app.services.knowledge_retrieval import (
    KnowledgeIndexEmptyError,
    search_knowledge,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.post("/search", response_model=KnowledgeSearchResponse)
async def search(
    request: KnowledgeSearchRequest,
    database: Annotated[Database, Depends(get_database)],
    _current_user: Annotated[dict[str, Any], Depends(get_current_user)],
):
    try:
        results = await run_in_threadpool(
            search_knowledge,
            database,
            request.query,
            request.top_k,
        )
    except KnowledgeIndexEmptyError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error
    except EmbeddingServiceError as error:
        logger.exception("Gemini embedding request failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Knowledge embedding service is unavailable.",
        ) from error
    except PyMongoError as error:
        logger.exception("Knowledge database request failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Knowledge store is unavailable.",
        ) from error

    return KnowledgeSearchResponse(
        query=request.query,
        results=results,
    )
