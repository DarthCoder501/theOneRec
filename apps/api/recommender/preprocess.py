"""Data preprocessing and feature engineering (ported from notebook cells 3-21)."""

from __future__ import annotations

import re
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import OneHotEncoder, StandardScaler, normalize
from sentence_transformers import SentenceTransformer

WEIGHT_SYNOPSIS = 0.60
WEIGHT_GENRES = 0.30
WEIGHT_PROD_STUDIO = 0.05
WEIGHT_NUM_CAT = 0.05


def preprocess_text(text) -> str:
    if pd.isna(text):
        return ""
    text = re.sub(r"[^\w\s-]", " ", str(text))
    return re.sub(r"\s+", " ", text).strip().lower()


def extract_minutes(duration) -> int:
    if not isinstance(duration, str):
        return 0
    match = re.search(r"(\d+)\s*min", duration)
    return int(match.group(1)) if match else 0


def load_and_clean_data(anime_list_path: Path, synopsis_path: Path) -> pd.DataFrame:
    anime_list_df = pd.read_csv(anime_list_path)
    anime_descriptions_df = pd.read_csv(synopsis_path)

    cols_to_drop = [c for c in anime_list_df.columns if c.startswith("Score-")]
    anime_stats = anime_list_df.drop(columns=cols_to_drop, errors="ignore")
    anime_stats = anime_stats.drop(
        columns=["English name", "Japanese name", "Premiered", "Licensors"],
        errors="ignore",
    )

    anime_stats["Episodes"] = anime_stats["Episodes"].replace(["Unknown"], -1)
    anime_stats["Score"] = anime_stats["Score"].replace(["Unknown"], np.nan)

    text_cols = ["Producers", "Studios", "Genres", "Source", "Rating", "Type"]
    for col in text_cols:
        if col in anime_stats.columns:
            anime_stats[col] = anime_stats[col].replace(["Unknown"], "")

    anime_stats_cleaned = anime_stats.dropna(subset=["Score"]).copy()

    synopsis_col = "sypnopsis" if "sypnopsis" in anime_descriptions_df.columns else "synopsis"
    desc_subset = anime_descriptions_df[["MAL_ID", synopsis_col]].rename(
        columns={synopsis_col: "sypnopsis"}
    )
    anime_df = pd.merge(anime_stats_cleaned, desc_subset, on="MAL_ID", how="left")
    anime_df = anime_df.dropna(subset=["sypnopsis"]).reset_index(drop=True)

    anime_df[["start_str", "end_str"]] = anime_df["Aired"].str.split(" to ", expand=True)
    anime_df["start_date"] = pd.to_datetime(anime_df["start_str"], errors="coerce")
    anime_df["end_date"] = pd.to_datetime(anime_df["end_str"], errors="coerce")
    anime_df["ongoing"] = anime_df["Aired"].str.contains("to \\?", regex=True)
    anime_df.loc[
        anime_df["end_date"].isna() & ~anime_df["ongoing"], "end_date"
    ] = anime_df["start_date"]
    anime_df = anime_df.drop(columns=["start_str", "end_str", "Aired"])
    anime_df["end_date"] = anime_df["end_date"].fillna(pd.to_datetime("today"))

    textual_columns = [
        "Genres", "Type", "Producers", "Studios", "Source",
        "Duration", "Rating", "sypnopsis",
    ]
    for col in textual_columns:
        if col in anime_df.columns:
            anime_df[col] = anime_df[col].apply(preprocess_text)

    return anime_df


def build_features(anime_df: pd.DataFrame, st_model: SentenceTransformer | None = None):
    if st_model is None:
        st_model = SentenceTransformer("BAAI/bge-base-en-v1.5")

    one_hot_columns = ["Type", "Source"]
    encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
    feat_cat = normalize(encoder.fit_transform(anime_df[one_hot_columns]))

    genre_vec = TfidfVectorizer()
    feat_genres = normalize(
        genre_vec.fit_transform(anime_df["Genres"].fillna("")).toarray()
    )

    prod_studio_text = (
        anime_df["Producers"].fillna("") + " " + anime_df["Studios"].fillna("")
    ).values
    ps_vec = TfidfVectorizer()
    feat_prod_studio = normalize(ps_vec.fit_transform(prod_studio_text).toarray())

    synopsis_embeddings = st_model.encode(
        anime_df["sypnopsis"].fillna("").tolist(), convert_to_numpy=True
    )
    feat_synopsis = normalize(synopsis_embeddings)

    anime_df = anime_df.copy()
    anime_df["Duration_min"] = anime_df["Duration"].apply(extract_minutes)
    numeric_cols = ["Episodes", "Score", "Duration_min"]
    if "Members" in anime_df.columns:
        anime_df["Members"] = pd.to_numeric(anime_df["Members"], errors="coerce").fillna(0)
        anime_df["Members_log"] = np.log1p(anime_df["Members"])
        numeric_cols.append("Members_log")

    for col in numeric_cols:
        anime_df[col] = pd.to_numeric(anime_df[col], errors="coerce").fillna(0)

    scaler = StandardScaler()
    feat_numeric = normalize(scaler.fit_transform(anime_df[numeric_cols]))
    feat_num_cat = normalize(np.hstack([feat_numeric, feat_cat]))

    feature_ranges: dict[str, tuple[int, int]] = {}
    current_col = 0

    def add_block(name: str, block: np.ndarray, weight: float) -> np.ndarray:
        nonlocal current_col
        cols = block.shape[1]
        feature_ranges[name] = (current_col, current_col + cols)
        current_col += cols
        return weight * block

    final_features = np.hstack([
        add_block("synopsis", feat_synopsis, WEIGHT_SYNOPSIS),
        add_block("genres", feat_genres, WEIGHT_GENRES),
        add_block("prod_studio", feat_prod_studio, WEIGHT_PROD_STUDIO),
        add_block("num_cat", feat_num_cat, WEIGHT_NUM_CAT),
    ])

    nn_model = NearestNeighbors(n_neighbors=50, metric="cosine", n_jobs=-1)
    nn_model.fit(final_features)

    vectorizers = {
        "encoder": encoder,
        "genre_vec": genre_vec,
        "ps_vec": ps_vec,
        "scaler": scaler,
        "numeric_cols": numeric_cols,
        "one_hot_columns": one_hot_columns,
    }

    return anime_df, final_features, nn_model, feature_ranges, vectorizers, st_model
