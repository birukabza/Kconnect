from fastapi import FastAPI

from app.api.conversation import router as conversation_router
from app.api.health import router as health_router
from app.core.config import APP_NAME, APP_VERSION


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION
)


app.include_router(
    health_router,
    prefix="/api"
)


app.include_router(
    conversation_router,
    prefix="/api"
)