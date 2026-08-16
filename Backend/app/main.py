from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.conversation import router as conversation_router
from app.api.health import router as health_router
from app.api.knowledge import router as knowledge_router
from app.core.config import APP_NAME, APP_VERSION, CORS_ORIGINS

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    health_router,
    prefix="/api",
)

app.include_router(
    auth_router,
    prefix="/api",
)

app.include_router(
    conversation_router,
    prefix="/api",
)

app.include_router(
    knowledge_router,
    prefix="/api",
)
