from functools import lru_cache

from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import MONGODB_DATABASE, MONGODB_URI


@lru_cache
def get_mongo_client() -> MongoClient:
    return MongoClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=5000,
    )


def get_database() -> Database:
    return get_mongo_client()[MONGODB_DATABASE]
