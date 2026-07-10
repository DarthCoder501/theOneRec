"""Load precomputed ML artifacts on first request (lazy, memory-efficient)."""

from __future__ import annotations

import gc
import json
from pathlib import Path

import numpy as np
import pandas as pd

from config import settings

_recommender = None

# Columns required at runtime — omit unused parquet columns to save RAM.
ARTIFACT_COLUMNS = (
    "MAL_ID",
    "Name",
    "Score",
    "Genres",
    "Episodes",
    "Type",
    "Studios",
    "sypnopsis",
    "Members",
    "Members_log",
    "start_date",
)


def get_recommender():
    global _recommender
    if _recommender is None:
        _recommender = _load_recommender()
    return _recommender


def _load_recommender():
    import google.generativeai as genai
    from sentence_transformers import SentenceTransformer

    from recommender.engine import create_recommendation_system

    artifacts = settings.artifacts_path
    parquet_path = artifacts / "anime_df.parquet"

    import pyarrow.parquet as pq

    available = set(pq.read_schema(parquet_path).names)
    columns = [col for col in ARTIFACT_COLUMNS if col in available]
    anime_df = pd.read_parquet(parquet_path, columns=columns)

    # Memory-map features instead of loading a second 200MB copy into RAM.
    # kNN runs directly on this array (nn_model.pkl is not loaded).
    final_features = np.load(artifacts / "final_features.npy", mmap_mode="r")

    with open(artifacts / "feature_ranges.json") as f:
        feature_ranges = json.load(f)
    feature_ranges = {k: tuple(v) for k, v in feature_ranges.items()}

    gc.collect()

    import torch

    torch.set_num_threads(1)
    st_model = SentenceTransformer(
        "BAAI/bge-base-en-v1.5",
        model_kwargs={"low_cpu_mem_usage": True},
    )
    st_model.eval()
    for param in st_model.parameters():
        param.requires_grad_(False)
    gc.collect()

    gemini_model = None
    if settings.google_api_key:
        genai.configure(api_key=settings.google_api_key)
        gemini_model = genai.GenerativeModel(settings.gemini_model_id)

    return create_recommendation_system(
        anime_df=anime_df,
        final_features=final_features,
        st_model=st_model,
        feature_ranges=feature_ranges,
        enable_cross_encoder=settings.enable_cross_encoder,
        gemini_model=gemini_model,
    )


def artifacts_exist() -> bool:
    artifacts = settings.artifacts_path
    required = ["anime_df.parquet", "final_features.npy", "feature_ranges.json"]
    return all((artifacts / f).exists() for f in required)
