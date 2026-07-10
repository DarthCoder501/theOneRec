#!/usr/bin/env python3
"""Memory / smoke test for the recommendation pipeline on a 512MB budget."""

from __future__ import annotations

import gc
import os
import resource
import sys
import time
from pathlib import Path

# Keep threads low like Modal production.
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("MALLOC_ARENA_MAX", "2")

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


def rss_mb() -> float:
    # macOS: ru_maxrss is bytes; Linux: kilobytes
    usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    if sys.platform == "darwin":
        return usage / (1024 * 1024)
    return usage / 1024


def current_rss_mb() -> float:
    try:
        import psutil

        return psutil.Process().memory_info().rss / (1024 * 1024)
    except Exception:
        return rss_mb()


def report(label: str) -> float:
    gc.collect()
    cur = current_rss_mb()
    peak = rss_mb()
    print(f"[{label}] current={cur:.0f}MB peak={peak:.0f}MB")
    return cur


def main() -> int:
    budget_mb = int(os.environ.get("MEMORY_BUDGET_MB", "512"))
    enable_ce = os.environ.get("ENABLE_CROSS_ENCODER", "false").lower() in {"1", "true", "yes"}
    os.environ["ENABLE_CROSS_ENCODER"] = "true" if enable_ce else "false"
    os.environ["PRELOAD_MODELS"] = "false"

    print("=" * 60)
    print(f"Memory smoke test (budget={budget_mb}MB, cross_encoder={enable_ce})")
    print("=" * 60)

    report("start")

    from config import settings
    from recommender.loader import artifacts_exist, get_recommender

    if not artifacts_exist():
        print("FAIL: artifacts missing")
        return 1

    print(f"artifacts_path={settings.artifacts_path}")
    t0 = time.time()
    rec = get_recommender()
    load_s = time.time() - t0
    after_load = report(f"after_load ({load_s:.1f}s)")

    queries = [
        "action anime from the 90s",
        "something similar to One Piece",
        "hidden gem sci-fi anime",
    ]

    for q in queries:
        t0 = time.time()
        result = rec.process_user_query(q, top_k=3)
        took = time.time() - t0
        after = report(f"after_query={q!r} ({took:.1f}s)")
        if "error" in result:
            print(f"  error: {result['error']}")
            return 1
        names = [r["name"] for r in result["recommendations"]]
        print(f"  recommendations: {names}")

    peak = rss_mb()
    print("=" * 60)
    print(f"FINAL peak RSS ≈ {peak:.0f}MB  (budget {budget_mb}MB)")
    if peak > budget_mb:
        print(f"RESULT: FAIL — would OOM under a {budget_mb}MB limit")
        return 2
    if after_load > budget_mb * 0.9:
        print(f"RESULT: RISK — close to budget after model load ({after_load:.0f}MB)")
        return 3
    print(f"RESULT: PASS — under {budget_mb}MB budget for this configuration")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
