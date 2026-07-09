# theOneRec

AI-powered anime recommendation web app — port of the AniRecs hybrid ML notebook with a WCAG 2.2-compliant One Piece-themed liquid glass UI.

## Architecture

- **Frontend** (`apps/web`): Next.js 16, Tailwind, shadcn-style components, React Three Fiber ocean scene
- **API** (`apps/api`): FastAPI + sentence-transformers + cross-encoder + Gemini intent parsing
- **Database**: Supabase (auth, history, saved, watchlist, share links)
- **Deploy**: Vercel (web) + Render (API)

## Quick Start

### 1. Data

Place MAL CSV files in `data/`:
- `anime.csv`
- `anime_with_synopsis.csv`

[Download from Kaggle](https://www.kaggle.com/datasets/animetaste/anime-recommender-system-2020)

### 2. Build ML Artifacts

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/build_index.py
```

### 3. API

```bash
cp apps/api/.env.example apps/api/.env
# Set GOOGLE_API_KEY

cd apps/api && uvicorn main:app --reload --port 8000
```

### 4. Supabase

```bash
# Apply migration
supabase db push
# Or run supabase/migrations/20250706000000_initial_schema.sql in Supabase SQL editor
```

### 5. Web

```bash
cp apps/web/.env.example apps/web/.env.local
# Set Supabase URL + anon key, RECOMMEND_API_URL

npm install
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000)

## Guest vs Member

| Feature | Guest | Member |
|---------|-------|--------|
| Queries/day | 5 | Unlimited |
| Results/query | 3 | 10 |
| History, saved, watchlist | No | Yes |
| Share links | No | Yes |
| Parsed intent view | No | Yes |

## Deploy

**Render** (API): Connect repo, use `render.yaml`. Set `GOOGLE_API_KEY` and `CORS_ORIGINS`.

ML artifacts (~400 MB) live in `apps/api/artifacts/` and are tracked with **Git LFS** so Render can bake them into the Docker image:

```bash
# One-time: install Git LFS, then from repo root:
git lfs install
git lfs pull
apps/api/scripts/verify-artifacts.sh   # confirm files exist locally
git add .gitattributes apps/api/artifacts/
git commit -m "Add ML artifacts via Git LFS"
git push origin main
git lfs push origin main --all
```

After push, redeploy on Render. `/health` should report `"artifacts_loaded": true`.

**Vercel** (Web): Set root to `apps/web`, env vars from `.env.example`.

## Testing

```bash
cd apps/api && pytest
npm run test:e2e --workspace=web
```

## Design

One Piece-inspired palette: `#BB353B`, `#DEBC6E`, `#506CB5`. Subtle pirate copy, liquid glass panels, decorative 3D ocean scene with `prefers-reduced-motion` fallback.
