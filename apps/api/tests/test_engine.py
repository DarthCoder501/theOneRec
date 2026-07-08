"""Tests for AniRecs engine."""

import pytest


def test_fallback_parse_query():
    from recommender.engine import AniRecs

    class FakeRec(AniRecs):
        def __init__(self):
            pass

    rec = FakeRec()
    intent = rec._fallback_parse_query("show me hidden gem action anime")
    assert intent["is_hidden_gem"] is True
    assert intent["length_constraint"] is None


def test_get_root_title():
    from recommender.engine import AniRecs

    class FakeRec(AniRecs):
        def __init__(self):
            pass

    rec = FakeRec()
    assert rec.get_root_title("Naruto Shippuuden") == rec.get_root_title("Naruto")
    assert "season" not in rec.get_root_title("Attack on Titan Season 2")


def test_is_sequel():
    from recommender.engine import AniRecs

    class FakeRec(AniRecs):
        def __init__(self):
            pass

    rec = FakeRec()
    assert rec.is_sequel("Code Geass R2") is False
    assert rec.is_sequel("Attack on Titan Season 2") is True


def test_process_user_query_short_input():
    """Requires artifacts — skip if not built."""
    import os
    from pathlib import Path

    artifacts = Path(__file__).parent.parent / "artifacts"
    if not (artifacts / "anime_df.parquet").exists():
        pytest.skip("Artifacts not built")

    from recommender.loader import get_recommender

    rec = get_recommender()
    result = rec.process_user_query("a", top_k=3)
    assert "error" in result
