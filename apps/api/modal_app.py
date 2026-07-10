"""Deploy theOneRec FastAPI recommender on Modal (full quality pipeline).

Usage (from apps/api):
  pip install modal
  modal setup
  modal secret create theonerec-api GOOGLE_API_KEY=... CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
  modal deploy modal_app.py

Then set Vercel:
  RECOMMEND_API_URL=https://<workspace>--theonerec-api-fastapi-app.modal.run
"""

from __future__ import annotations

from pathlib import Path

import modal

APP_NAME = "theonerec-api"
API_DIR = Path(__file__).resolve().parent

# CPU-only torch first so sentence-transformers does not pull CUDA wheels.
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch",
        index_url="https://download.pytorch.org/whl/cpu",
    )
    .pip_install(
        "fastapi>=0.115.0",
        "uvicorn[standard]>=0.32.0",
        "pydantic>=2.9.0",
        "pydantic-settings>=2.6.0",
        "pandas>=2.2.0",
        "numpy>=1.26.0",
        "scikit-learn>=1.5.0",
        "sentence-transformers>=3.3.0",
        "google-generativeai>=0.8.0",
        "pyarrow>=18.0.0",
        "joblib>=1.4.0",
        "python-multipart>=0.0.12",
        "httpx>=0.27.0",
    )
    .env(
        {
            "ARTIFACTS_PATH": "/app/artifacts",
            "ENABLE_CROSS_ENCODER": "true",
            "PRELOAD_MODELS": "true",
            "TOKENIZERS_PARALLELISM": "false",
            "OMP_NUM_THREADS": "1",
            "MKL_NUM_THREADS": "1",
            "OPENBLAS_NUM_THREADS": "1",
        }
    )
    .run_commands(
        "python -c \"from sentence_transformers import SentenceTransformer, CrossEncoder; "
        "SentenceTransformer('BAAI/bge-base-en-v1.5'); "
        "CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2'); "
        "print('models cached')\""
    )
    .add_local_dir(str(API_DIR / "artifacts"), remote_path="/app/artifacts")
    .add_local_dir(str(API_DIR / "recommender"), remote_path="/app/recommender")
    .add_local_file(str(API_DIR / "main.py"), remote_path="/app/main.py")
    .add_local_file(str(API_DIR / "config.py"), remote_path="/app/config.py")
    .add_local_file(str(API_DIR / "rate_limit.py"), remote_path="/app/rate_limit.py")
)

app = modal.App(APP_NAME, image=image)

# Full pipeline peak ~600MB locally; give headroom for CE + concurrency spikes.
MEMORY_MB = 4096
CPU = 2.0


@app.function(
    image=image,
    memory=MEMORY_MB,
    cpu=CPU,
    timeout=300,
    scaledown_window=300,
    secrets=[modal.Secret.from_name("theonerec-api")],
)
@modal.concurrent(max_inputs=4)
@modal.asgi_app()
def fastapi_app():
    import sys

    sys.path.insert(0, "/app")
    from main import app as fastapi

    return fastapi
