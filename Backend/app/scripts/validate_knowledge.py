import argparse
from collections import Counter
from pathlib import Path

from app.services.knowledge_dataset import (
    DEFAULT_DATASET_PATH,
    load_knowledge_dataset,
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate the KConnect knowledge dataset."
    )
    parser.add_argument(
        "dataset",
        nargs="?",
        type=Path,
        default=DEFAULT_DATASET_PATH,
    )
    args = parser.parse_args()

    items = load_knowledge_dataset(args.dataset)
    categories = Counter(item.category for item in items)

    print(f"Validated {len(items)} knowledge records.")
    for category, count in sorted(categories.items()):
        print(f"{category}: {count}")


if __name__ == "__main__":
    main()
