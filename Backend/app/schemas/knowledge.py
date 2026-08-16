from pydantic import BaseModel, ConfigDict, Field, field_validator


class KnowledgeItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=r"^[a-z][a-z0-9_]*_[0-9]{3,}$")
    category: str = Field(min_length=2, max_length=80)
    sub_category: str = Field(min_length=2, max_length=80)
    situation: str = Field(min_length=2, max_length=120)
    rwanda_context: str = Field(min_length=20, max_length=1000)
    suggested_tip: str = Field(min_length=20, max_length=600)
    useful_terms: list[str] = Field(default_factory=list)
    source_url: str | None = Field(default=None, max_length=500)
    reviewer: str | None = Field(default=None, max_length=120)
    scope: str = Field(default="rwanda", min_length=2, max_length=80)

    @field_validator(
        "category",
        "sub_category",
        "situation",
        "rwanda_context",
        "suggested_tip",
        "scope",
        mode="before",
    )
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("source_url", "reviewer")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()
        return cleaned or None

    @field_validator("useful_terms")
    @classmethod
    def normalize_useful_terms(cls, values: list[str]) -> list[str]:
        normalized = []

        for value in values:
            term = value.strip().lower()

            if term and term not in normalized:
                normalized.append(term)

        return normalized


class KnowledgeSearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=1000)
    top_k: int = Field(default=3, ge=1, le=10)

    @field_validator("query", mode="before")
    @classmethod
    def strip_query(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


class KnowledgeSearchResult(BaseModel):
    id: str
    category: str
    sub_category: str
    situation: str
    rwanda_context: str
    suggested_tip: str
    score: float


class KnowledgeSearchResponse(BaseModel):
    query: str
    results: list[KnowledgeSearchResult]
