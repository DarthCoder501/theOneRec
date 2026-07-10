# theOneRec

AI-powered anime recommendation web app — port of the AniRecs hybrid ML notebook with a WCAG 2.2-compliant One Piece-themed liquid glass UI.

## Architecture

- **Frontend** (`apps/web`): Next.js 16, Tailwind, shadcn-style components, ocean scene
- **API** (`apps/api`): FastAPI + sentence-transformers + cross-encoder + Gemini intent parsing
- **Database**: Supabase (auth, history, saved, watchlist, share links)
- **Deploy**: Vercel (web) + Modal (API, full ML quality) — see [docs/deploy-modal.md](docs/deploy-modal.md)

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

### 3. API (local)

```bash
cp apps/api/.env.example apps/api/.env
# Set GOOGLE_API_KEY

cd apps/api && uvicorn main:app --reload --port 8000
```

### 4. Supabase

```bash
# Apply migration
supabase db push
# Or run supabase/migrations/*.sql in the Supabase SQL editor
```

### 5. Web

```bash
cp apps/web/.env.example apps/web/.env.local
# Set Supabase URL + anon key, RECOMMEND_API_URL=http://localhost:8000

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

**Modal** (API) + **Vercel** (web). Full pipeline (bge-base + cross-encoder) runs on Modal with 4GB RAM.

Follow **[docs/deploy-modal.md](docs/deploy-modal.md)**.

```bash
cd apps/api
pip install -U modal
modal setup
modal secret create theonerec-api GOOGLE_API_KEY=... CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
modal deploy modal_app.py
```

On Vercel set `RECOMMEND_API_URL` to the Modal URL Modal prints, then redeploy.

**Supabase / Google OAuth** stay pointed at Vercel — do not put the Modal URL into OAuth settings.

ML artifacts live in `apps/api/artifacts/` (Git LFS). Verify with `apps/api/scripts/verify-artifacts.sh`.

## Testing

```bash
cd apps/api && pytest
npm run test:e2e --workspace=web
```

## Design

One Piece-inspired palette: `#BB353B`, `#DEBC6E`, `#506CB5`. Subtle pirate copy, liquid glass panels, decorative ocean scene with `prefers-reduced-motion` fallback.
