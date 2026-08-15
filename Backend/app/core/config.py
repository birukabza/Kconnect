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
