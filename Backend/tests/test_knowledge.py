from collections import Counter

from app.schemas.knowledge import KnowledgeItem
from app.services.knowledge_dataset import (
    build_retrieval_text,
    load_knowledge_dataset,
)
from app.services.knowledge_ingestion import ingest_knowledge_dataset
from app.services.knowledge_index import (
    VECTOR_INDEX_NAME,
    build_vector_index_definition,
)
from app.services.knowledge_retrieval import (
    build_vector_search_pipeline,
    search_knowledge,
)


class FakeKnowledgeCollection:
    def __init__(self):
        self.documents = {}
        self.indexes = []
        self.search_indexes = []
        self.aggregate_results = []
        self.last_pipeline = None

    def create_index(self, keys, **kwargs):
        self.indexes.append((keys, kwargs))
        return kwargs.get("name", "test_index")

    def find(self, query, projection=None):
        documents = [
            document
            for document in self.documents.values()
            if self._matches(document, query)
        ]

        if projection is None:
            return [dict(document) for document in documents]

        included = {key for key, value in projection.items() if value}
        return [
            {
                key: value
                for key, value in document.items()
                if key in included or key == "_id"
            }
            for document in documents
        ]

    def replace_one(self, query, replacement, upsert=False):
        document_id = query["_id"]
        assert replacement["_id"] == document_id
        self.documents[document_id] = dict(replacement)

    def list_search_indexes(self):
        return [dict(index) for index in self.search_indexes]

    def create_search_index(self, model):
        document = model.document
        self.search_indexes.append(
            {
                "name": document["name"],
                "type": document["type"],
                "latestDefinition": document["definition"],
                "status": "READY",
                "queryable": True,
            }
        )
        return document["name"]

    def update_search_index(self, name, definition):
        index = next(
            index
            for index in self.search_indexes
            if index["name"] == name
        )
        index["latestDefinition"] = definition

    def aggregate(self, pipeline):
        self.last_pipeline = pipeline
        return [dict(document) for document in self.aggregate_results]

    @staticmethod
    def _matches(document, query):
        for key, expected in query.items():
            actual = document.get(key)

            if isinstance(expected, dict) and "$in" in expected:
                if actual not in expected["$in"]:
                    return False
            elif actual != expected:
                return False

        return True


class FakeDatabase:
    def __init__(self):
        self.knowledge = FakeKnowledgeCollection()

    def __getitem__(self, collection_name):
        assert collection_name == "knowledge_items"
        return self.knowledge

    def list_collection_names(self):
        return ["knowledge_items"]

    def create_collection(self, collection_name):
        assert collection_name == "knowledge_items"
        return self.knowledge


class FakeEmbeddingProvider:
    model = "test-embedding"
    dimensions = 3

    def __init__(self):
        self.embedded_document_count = 0

    def embed_documents(self, texts):
        self.embedded_document_count += len(texts)
        return [[1.0, 0.5, 0.25] for _text in texts]

    def embed_query(self, _text):
        return [1.0, 0.0, 0.0]


class TwoDimensionalEmbeddingProvider(FakeEmbeddingProvider):
    dimensions = 2

    def embed_query(self, _text):
        return [1.0, 0.0]


def test_current_dataset_is_valid():
    items = load_knowledge_dataset()

    assert len(items) == 116
    assert Counter(item.category for item in items) == {
        "marketplace": 50,
        "restaurant": 50,
        "cultural": 10,
        "transport": 6,
    }


def test_retrieval_text_contains_context_tip_and_terms():
    item = KnowledgeItem(
        id="transport_001",
        category="transport",
        sub_category="moto",
        situation="helmet_use",
        rwanda_context=(
            "In Rwanda, a passenger should fasten a helmet before moving."
        ),
        suggested_tip=(
            "Wear and fasten the passenger helmet before the trip starts."
        ),
        useful_terms=["Moto", " Helmet "],
    )

    retrieval_text = build_retrieval_text(item)

    assert "Situation: helmet use" in retrieval_text
    assert item.rwanda_context in retrieval_text
    assert item.suggested_tip in retrieval_text
    assert "Useful terms: moto, helmet" in retrieval_text


def test_ingestion_reuses_embeddings_for_unchanged_records():
    database = FakeDatabase()
    provider = FakeEmbeddingProvider()

    first_report = ingest_knowledge_dataset(
        database,
        embedding_provider=provider,
    )
    database.knowledge.documents["transport_001"][
        "obsolete_field"
    ] = True
    second_report = ingest_knowledge_dataset(
        database,
        embedding_provider=provider,
    )

    assert first_report.total_records == 116
    assert first_report.embedded_records == 116
    assert first_report.reused_embeddings == 0
    assert first_report.vector_index_name == VECTOR_INDEX_NAME
    assert first_report.vector_index_status == "CREATING"
    assert second_report.embedded_records == 0
    assert second_report.reused_embeddings == 116
    assert provider.embedded_document_count == 116
    assert len(database.knowledge.documents) == 116
    assert "obsolete_field" not in (
        database.knowledge.documents["transport_001"]
    )
    assert len(database.knowledge.search_indexes) == 1
    assert database.knowledge.search_indexes[0]["latestDefinition"] == (
        build_vector_index_definition(provider.dimensions)
    )


def test_search_returns_results_in_similarity_order():
    database = FakeDatabase()
    provider = TwoDimensionalEmbeddingProvider()
    base_document = {
        "category": "transport",
        "sub_category": "moto",
        "situation": "helmet_use",
        "rwanda_context": "Rwanda-specific context for the test result.",
        "suggested_tip": "Fasten the helmet before the trip starts.",
    }

    for item_id, score in {
        "transport_001": 1.0,
        "transport_002": 0.97,
        "transport_003": 0.5,
    }.items():
        database.knowledge.aggregate_results.append(
            {
                **base_document,
                "id": item_id,
                "score": score,
            }
        )

    results = search_knowledge(
        database,
        query="Should I wear a helmet on a moto?",
        top_k=3,
        embedding_provider=provider,
    )

    assert [result.id for result in results] == [
        "transport_001",
        "transport_002",
        "transport_003",
    ]
    assert results[0].score == 1.0
    assert database.knowledge.last_pipeline == build_vector_search_pipeline(
        query_embedding=[1.0, 0.0],
        model=provider.model,
        dimensions=provider.dimensions,
        top_k=3,
    )
    vector_stage = database.knowledge.last_pipeline[0]["$vectorSearch"]
    assert vector_stage["index"] == VECTOR_INDEX_NAME
    assert vector_stage["numCandidates"] == 100
