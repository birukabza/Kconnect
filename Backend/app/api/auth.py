from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.core.auth import get_current_user
from app.core.database import get_database
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    create_access_token,
    hash_password,
    serialize_user,
    verify_password,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: RegisterRequest,
    database: Annotated[Database, Depends(get_database)],
):
    users = database["users"]

    try:
        user = {
            "name": request.name,
            "email": request.email,
            "password_hash": hash_password(request.password),
            "created_at": datetime.now(timezone.utc),
        }
        users.create_index("email", unique=True)
        result = users.insert_one(user)
    except DuplicateKeyError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from error
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    except PyMongoError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account service is unavailable.",
        ) from error

    user["_id"] = result.inserted_id
    serialized_user = serialize_user(user)

    return {
        "access_token": create_access_token(serialized_user["id"]),
        "user": serialized_user,
    }


@router.post("/login", response_model=TokenResponse)
def login(
    request: LoginRequest,
    database: Annotated[Database, Depends(get_database)],
):
    try:
        user = database["users"].find_one(
            {"email": request.email}
        )
    except PyMongoError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account service is unavailable.",
        ) from error

    if user is None or not verify_password(
        request.password,
        user.get("password_hash", ""),
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    serialized_user = serialize_user(user)

    return {
        "access_token": create_access_token(serialized_user["id"]),
        "user": serialized_user,
    }


@router.get("/me", response_model=UserResponse)
def current_user(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
):
    return serialize_user(user)
