# theOneRec recommendation API

FastAPI service that powers theOneRec recommendations.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + whether ML artifacts are present |
| POST | `/recommend` | Full hybrid recommend pipeline |
| GET | `/anime/{mal_id}` | Anime detail |
| GET | `/anime/search/titles` | Title autocomplete |
| GET | `/rate-limit` | Guest rate-limit status |

## Local development

```bash
cp .env.example .env   # set GOOGLE_API_KEY
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# CPU torch if needed: pip install torch --index-url https://download.pytorch.org/whl/cpu
uvicorn main:app --reload --port 8000
```

## Production: Modal

Full quality (sentence-transformer + cross-encoder) is deployed with:

```bash
pip install -U modal
modal setup
modal secret create theonerec-api GOOGLE_API_KEY=... CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
modal deploy modal_app.py
```

See [docs/deploy-modal.md](../../docs/deploy-modal.md).

## Secrets (Modal)

| Name | Required | Example |
|------|----------|---------|
| `GOOGLE_API_KEY` | Yes (Gemini intent) | your Gemini key |
| `CORS_ORIGINS` | Yes | `https://your-app.vercel.app,http://localhost:3000` |
| `GEMINI_MODEL_ID` | Optional | `gemini-2.0-flash` |

Defaults enable `ENABLE_CROSS_ENCODER=true` and `PRELOAD_MODELS=true`.
