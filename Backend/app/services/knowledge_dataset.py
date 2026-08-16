import json
from collections import Counter
from pathlib import Path

from pydantic import ValidationError

from app.schemas.knowledge import KnowledgeItem


BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATASET_PATH = BACKEND_DIR / "data.json"


class DatasetValidationError(ValueError):
    pass


def load_knowledge_dataset(
    dataset_path: Path | str = DEFAULT_DATASET_PATH,
) -> list[KnowledgeItem]:
    path = Path(dataset_path)

    try:
        raw_data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise DatasetValidationError(
            f"Knowledge dataset was not found: {path}"
        ) from error
    except json.JSONDecodeError as error:
        raise DatasetValidationError(
            f"Knowledge dataset is not valid JSON: {error}"
        ) from error

    if not isinstance(raw_data, list):
        raise DatasetValidationError(
            "Knowledge dataset must be a JSON array."
        )

    if not raw_data:
        raise DatasetValidationError(
            "Knowledge dataset must contain at least one record."
        )

    items = []
    errors = []

    for index, raw_item in enumerate(raw_data):
        try:
            items.append(KnowledgeItem.model_validate(raw_item))
        except ValidationError as error:
            errors.append(f"Record {index + 1}: {error}")

    id_counts = Counter(item.id for item in items)
    duplicate_ids = sorted(
        item_id for item_id, count in id_counts.items() if count > 1
    )

    if duplicate_ids:
        errors.append(
            "Duplicate IDs: " + ", ".join(duplicate_ids)
        )

    if errors:
        raise DatasetValidationError("\n".join(errors))

    return items


def build_retrieval_text(item: KnowledgeItem) -> str:
    fields = [
        f"Category: {item.category.replace('_', ' ')}",
        f"Subcategory: {item.sub_category.replace('_', ' ')}",
        f"Situation: {item.situation.replace('_', ' ')}",
        f"Location scope: {item.scope.replace('_', ' ')}",
        f"Rwanda context: {item.rwanda_context}",
        f"Suggested tip: {item.suggested_tip}",
    ]

    if item.useful_terms:
        fields.append("Useful terms: " + ", ".join(item.useful_terms))

    return "\n".join(fields)
