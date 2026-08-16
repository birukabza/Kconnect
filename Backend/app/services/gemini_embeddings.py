from typing import Protocol

from google import genai
from google.genai import types

from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_EMBEDDING_BATCH_SIZE,
    GEMINI_EMBEDDING_DIMENSIONS,
    GEMINI_EMBEDDING_MODEL,
)


class EmbeddingServiceError(RuntimeError):
    pass


class EmbeddingProvider(Protocol):
    model: str
    dimensions: int

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        pass

    def embed_query(self, text: str) -> list[float]:
        pass


class GeminiEmbeddingService:
    def __init__(
        self,
        client=None,
        model: str = GEMINI_EMBEDDING_MODEL,
        dimensions: int = GEMINI_EMBEDDING_DIMENSIONS,
        batch_size: int = GEMINI_EMBEDDING_BATCH_SIZE,
    ):
        if client is None:
            if not GEMINI_API_KEY:
                raise EmbeddingServiceError(
                    "GEMINI_API_KEY is not configured."
                )

            client = genai.Client(api_key=GEMINI_API_KEY)

        self.client = client
        self.model = model
        self.dimensions = dimensions
        self.batch_size = batch_size

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        prepared = [
            "Task: document retrieval\nDocument:\n" + text
            for text in texts
        ]
        return self._embed_in_batches(prepared)

    def embed_query(self, text: str) -> list[float]:
        [embedding] = self._embed_in_batches(
            ["Task: document retrieval\nQuery:\n" + text]
        )
        return embedding

    def _embed_in_batches(
        self,
        texts: list[str],
    ) -> list[list[float]]:
        embeddings = []

        for start in range(0, len(texts), self.batch_size):
            batch = texts[start:start + self.batch_size]

            try:
                response = self.client.models.embed_content(
                    model=self.model,
                    contents=batch,
                    config=types.EmbedContentConfig(
                        output_dimensionality=self.dimensions,
                    ),
                )
            except Exception as error:
                raise EmbeddingServiceError(
                    "Gemini embedding request failed."
                ) from error

            batch_embeddings = [
                [float(value) for value in embedding.values]
                for embedding in (response.embeddings or [])
            ]

            if len(batch_embeddings) != len(batch):
                raise EmbeddingServiceError(
                    "Gemini returned an unexpected number of embeddings."
                )

            if any(
                len(embedding) != self.dimensions
                for embedding in batch_embeddings
            ):
                raise EmbeddingServiceError(
                    "Gemini returned an unexpected embedding dimension."
                )

            embeddings.extend(batch_embeddings)

        return embeddings
