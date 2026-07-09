"""Load precomputed ML artifacts on first request (lazy)."""

from __future__ import annotations

import json
from pathlib import Path

from config import settings

_recommender = None


def get_recommender():
    global _recommender
    if _recommender is None:
        _recommender = _load_recommender()
    return _recommender


def _load_recommender():
    import google.generativeai as genai
    import joblib
    import numpy as np
    import pandas as pd
    from sentence_transformers import CrossEncoder, SentenceTransformer

    from recommender.engine import create_recommendation_system

    artifacts = settings.artifacts_path
    anime_df = pd.read_parquet(artifacts / "anime_df.parquet")
    final_features = np.load(artifacts / "final_features.npy")
    nn_model = joblib.load(artifacts / "nn_model.pkl")
    st_model = SentenceTransformer("BAAI/bge-base-en-v1.5")
    cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

    with open(artifacts / "feature_ranges.json") as f:
        feature_ranges = json.load(f)
    feature_ranges = {k: tuple(v) for k, v in feature_ranges.items()}

    gemini_model = None
    if settings.google_api_key:
        genai.configure(api_key=settings.google_api_key)
        gemini_model = genai.GenerativeModel(settings.gemini_model_id)

    return create_recommendation_system(
        anime_df, nn_model, final_features, st_model, feature_ranges, cross_encoder, gemini_model
    )


def artifacts_exist() -> bool:
    artifacts = settings.artifacts_path
    required = ["anime_df.parquet", "final_features.npy", "nn_model.pkl", "feature_ranges.json"]
    return all((artifacts / f).exists() for f in required)
