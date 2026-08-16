import json


def trace_rag(stage: str, **details) -> None:
    """Print a compact, terminal-friendly trace for one RAG pipeline stage."""
    payload = json.dumps(
        details,
        ensure_ascii=True,
        default=str,
        sort_keys=True,
    )
    print(f"[rag trace] {stage} | {payload}", flush=True)
