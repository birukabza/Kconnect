import argparse
import json
from dataclasses import asdict
from pathlib import Path

from app.core.database import get_database
from app.services.knowledge_dataset import DEFAULT_DATASET_PATH
from app.services.knowledge_ingestion import ingest_knowledge_dataset


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Embed and upsert KConnect knowledge into MongoDB."
    )
    parser.add_argument(
        "dataset",
        nargs="?",
        type=Path,
        default=DEFAULT_DATASET_PATH,
    )
    args = parser.parse_args()

    report = ingest_knowledge_dataset(
        get_database(),
        dataset_path=args.dataset,
    )
    print(json.dumps(asdict(report), indent=2))


if __name__ == "__main__":
    main()
