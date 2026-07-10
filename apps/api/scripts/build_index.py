"""Offline script to build ML artifacts from CSV data."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from recommender.preprocess import build_features, load_and_clean_data


def main():
    root = Path(__file__).parent.parent.parent.parent
    data_dir = root / "data"
    artifacts_dir = Path(__file__).parent.parent / "artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    anime_path = data_dir / "anime.csv"
    synopsis_path = data_dir / "anime_with_synopsis.csv"

    if not anime_path.exists() or not synopsis_path.exists():
        print(f"Missing data files in {data_dir}")
        print("Required: anime.csv, anime_with_synopsis.csv")
        sys.exit(1)

    print("Loading and cleaning data...")
    anime_df = load_and_clean_data(anime_path, synopsis_path)

    print("Building features (this may take several minutes)...")
    anime_df, final_features, nn_model, feature_ranges, vectorizers, st_model = build_features(anime_df)

    print("Saving artifacts...")
    anime_df.to_parquet(artifacts_dir / "anime_df.parquet")
    np.save(artifacts_dir / "final_features.npy", final_features.astype(np.float32))
    joblib.dump(nn_model, artifacts_dir / "nn_model.pkl")
    joblib.dump(vectorizers, artifacts_dir / "vectorizers.pkl")

    with open(artifacts_dir / "feature_ranges.json", "w") as f:
        json.dump({k: list(v) for k, v in feature_ranges.items()}, f)

    print(f"Done! {len(anime_df)} anime indexed.")
    print(f"Artifacts saved to {artifacts_dir}")


if __name__ == "__main__":
    main()
