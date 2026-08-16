from pydantic import BaseModel, ConfigDict, Field, field_validator


class KnowledgeItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=r"^[a-z][a-z0-9_]*_[0-9]{3,}$")
    category: str = Field(min_length=2, max_length=80)
    sub_category: str = Field(min_length=2, max_length=80)
    situation: str = Field(min_length=2, max_length=120)
    rwanda_context: str = Field(min_length=20, max_length=1000)
    suggested_tip: str = Field(min_length=20, max_length=600)
    source: str | None = Field(default=None, max_length=300)

    @field_validator(
        "category",
        "sub_category",
        "situation",
        "rwanda_context",
        "suggested_tip",
        mode="before",
    )
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("source", mode="before")
    @classmethod
    def strip_source(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()
        return cleaned or None


class KnowledgeSearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=1000)
    category: str = Field(min_length=2, max_length=80)
    sub_category: str = Field(min_length=2, max_length=80)
    situation: str | None = Field(default=None, min_length=2, max_length=120)
    top_k: int = Field(default=3, ge=1, le=10)

    @field_validator("query", mode="before")
    @classmethod
    def strip_query(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator(
        "category",
        "sub_category",
        "situation",
        mode="before",
    )
    @classmethod
    def normalize_filter(cls, value: str | None) -> str | None:
        if not isinstance(value, str):
            return value

        cleaned = value.strip().lower()
        return cleaned or None


class KnowledgeSearchResult(BaseModel):
    id: str
    category: str
    sub_category: str
    situation: str
    rwanda_context: str
    suggested_tip: str
    source: str | None = None
    score: float


class KnowledgeSearchResponse(BaseModel):
    query: str
    results: list[KnowledgeSearchResult]
