#!/usr/bin/env bash
set -euo pipefail

ARTIFACTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/artifacts"

REQUIRED=(
  "anime_df.parquet"
  "final_features.npy"
  "nn_model.pkl"
  "feature_ranges.json"
)

missing=()
for file in "${REQUIRED[@]}"; do
  if [[ ! -f "${ARTIFACTS_DIR}/${file}" ]]; then
    missing+=("$file")
  fi
done

if ((${#missing[@]})); then
  echo "Missing ML artifacts in ${ARTIFACTS_DIR}:"
  printf '  - %s\n' "${missing[@]}"
  echo ""
  echo "Build them locally:"
  echo "  cd apps/api && python scripts/build_index.py"
  exit 1
fi

echo "ML artifacts OK (${ARTIFACTS_DIR}):"
for file in "${REQUIRED[@]}"; do
  size=$(du -h "${ARTIFACTS_DIR}/${file}" | cut -f1)
  printf '  ✓ %s (%s)\n' "$file" "$size"
done
