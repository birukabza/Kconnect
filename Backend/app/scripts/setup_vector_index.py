import argparse
import json
from dataclasses import asdict

from app.core.database import get_database
from app.services.knowledge_index import (
    ensure_vector_index,
    wait_for_vector_index,
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create or update the MongoDB vector search index."
    )
    parser.add_argument(
        "--wait",
        action="store_true",
        help="Wait until Atlas reports that the index is queryable.",
    )
    parser.add_argument("--timeout", type=int, default=300)
    args = parser.parse_args()

    database = get_database()
    status = ensure_vector_index(database)

    if args.wait:
        status = wait_for_vector_index(
            database,
            timeout_seconds=args.timeout,
        )

    print(json.dumps(asdict(status), indent=2))


if __name__ == "__main__":
    main()
