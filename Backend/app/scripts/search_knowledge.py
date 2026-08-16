import argparse
import json

from app.core.database import get_database
from app.services.knowledge_retrieval import search_knowledge


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run a semantic search against ingested knowledge."
    )
    parser.add_argument("query")
    parser.add_argument("--category", required=True)
    parser.add_argument("--sub-category", required=True)
    parser.add_argument("--situation")
    parser.add_argument("--top-k", type=int, default=3, choices=range(1, 11))
    args = parser.parse_args()

    results = search_knowledge(
        get_database(),
        query=args.query,
        category=args.category.strip().lower(),
        sub_category=args.sub_category.strip().lower(),
        situation=(
            args.situation.strip().lower()
            if args.situation
            else None
        ),
        top_k=args.top_k,
    )
    print(
        json.dumps(
            [result.model_dump() for result in results],
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
