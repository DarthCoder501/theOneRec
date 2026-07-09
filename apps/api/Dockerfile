FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Render has no GPU — install CPU-only PyTorch first to avoid ~2GB CUDA packages.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download transformer models at build time
RUN python -c "from sentence_transformers import SentenceTransformer, CrossEncoder; SentenceTransformer('BAAI/bge-base-en-v1.5'); CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')"

# ML artifacts must be present in the build context (committed via Git LFS).
COPY artifacts/ ./artifacts/
RUN python -c "\
from pathlib import Path; \
p = Path('artifacts'); \
required = ['anime_df.parquet', 'final_features.npy', 'nn_model.pkl', 'feature_ranges.json']; \
missing = [f for f in required if not (p / f).exists()]; \
assert not missing, f'Missing ML artifacts: {missing}. Run scripts/build_index.py and push via Git LFS.'; \
print('ML artifacts verified:', ', '.join(required))"

COPY . .

RUN chmod +x /app/entrypoint.sh

ENV ARTIFACTS_PATH=/app/artifacts

EXPOSE 10000

ENTRYPOINT ["/app/entrypoint.sh"]
