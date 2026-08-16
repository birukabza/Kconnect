import os
import secrets

from dotenv import load_dotenv


load_dotenv()


APP_NAME = os.getenv(
    "APP_NAME",
    "KConnect Backend"
)

APP_VERSION = os.getenv(
    "APP_VERSION",
    "0.1.0"
)

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://localhost:27017"
)

MONGODB_DATABASE = os.getenv(
    "MONGODB_DATABASE",
    "kconnect"
)

JWT_SECRET_KEY = (
    os.getenv("JWT_SECRET_KEY")
    or secrets.token_urlsafe(48)
)

JWT_ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

TEMPORARY_CONVERSATION_TTL_MINUTES = max(
    1,
    int(os.getenv("TEMPORARY_CONVERSATION_TTL_MINUTES", "60")),
)

TEMPORARY_CONVERSATION_MAX_TURNS = max(
    1,
    int(os.getenv("TEMPORARY_CONVERSATION_MAX_TURNS", "20")),
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "")
GEMINI_EMBEDDING_MODEL = os.getenv(
    "GEMINI_EMBEDDING_MODEL",
    "gemini-embedding-2",
)
GEMINI_EMBEDDING_DIMENSIONS = max(
    1,
    int(os.getenv("GEMINI_EMBEDDING_DIMENSIONS", "768")),
)
GEMINI_EMBEDDING_BATCH_SIZE = max(
    1,
    int(os.getenv("GEMINI_EMBEDDING_BATCH_SIZE", "20")),
)
RAG_TOP_K = min(
    10,
    max(1, int(os.getenv("RAG_TOP_K", "3"))),
)
RAG_MIN_SIMILARITY_SCORE = min(
    1.0,
    max(0.0, float(os.getenv("RAG_MIN_SIMILARITY_SCORE", "0.75"))),
)
