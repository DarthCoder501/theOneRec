# Deploy the recommendation API on Modal (full quality)

Modal gives **$30/month free compute credits** on the Starter plan — enough for demos
and light traffic with the **full** pipeline (bge-base + cross-encoder).

**Vercel** hosts the Next.js app. **Supabase** handles auth/DB. Only the ML API runs on Modal.

---

## Checklist

### 1. Account

1. Sign up at [modal.com](https://modal.com).
2. Stay on **Starter** ($0 platform fee + $30 credits).

### 2. CLI

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate   # or use existing .venv
pip install -U modal
modal setup
modal --version   # should be recent (e.g. 1.x), not 0.68.x
```

If `modal --version` shows an old global install, upgrade that Python too:

```bash
python3 -m pip install -U modal
```

### 3. ML artifacts

```bash
apps/api/scripts/verify-artifacts.sh
```

Modal uploads `artifacts/` from your machine at deploy time.

### 4. Secret `theonerec-api`

[Modal → Secrets](https://modal.com/secrets), or:

```bash
modal secret create theonerec-api \
  GOOGLE_API_KEY="your-gemini-key" \
  CORS_ORIGINS="https://YOUR-VERCEL-APP.vercel.app,http://localhost:3000"
```

Optional: `GEMINI_MODEL_ID=gemini-2.0-flash`

### 5. Deploy

```bash
cd apps/api
modal deploy modal_app.py
```

Copy the URL Modal prints, e.g.:

```text
https://YOUR_WORKSPACE--theonerec-api-fastapi-app.modal.run
```

### 6. Smoke-test

```bash
curl https://YOUR_WORKSPACE--theonerec-api-fastapi-app.modal.run/health
```

Expect `"artifacts_loaded": true`.

```bash
curl -X POST https://YOUR_WORKSPACE--theonerec-api-fastapi-app.modal.run/recommend \
  -H "Content-Type: application/json" \
  -d '{"query":"action anime from the 90s","top_k":3}'
```

First request after idle can take 1–2 minutes (cold start).

### 7. Vercel

| Variable | Value |
|----------|--------|
| `RECOMMEND_API_URL` | `https://YOUR_WORKSPACE--theonerec-api-fastapi-app.modal.run` |

Redeploy. Leave Supabase / Google OAuth unchanged.

---

## Local dry-run

```bash
cd apps/api
modal serve modal_app.py
```

Temporary URL until Ctrl+C.

---

## What you do **not** change

- Supabase Site URL / Redirect URLs (still Vercel)
- Google OAuth redirect URI (`https://PROJECT.supabase.co/auth/v1/callback`)
- Vercel Supabase env vars

---

## Architecture

```text
Browser
  → Vercel (Next.js + /api/recommend proxy)
      → Modal (FastAPI + full ML)
  → Supabase (auth, saved, watchlist, history)
      → Google OAuth
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `modal` version deprecated | `pip install -U modal` (upgrade the binary on your PATH) |
| `Secret 'theonerec-api' not found` | Create secret with that exact name, redeploy |
| Missing artifacts | `verify-artifacts.sh`, redeploy from `apps/api` |
| Vercel 503 | Wrong `RECOMMEND_API_URL`, or cold start — retry |
| CORS errors | Exact Vercel origin in `CORS_ORIGINS` (no trailing slash) |

---

## Repo file

`apps/api/modal_app.py` serves `main:app` with 4 GB RAM, cross-encoder on, models cached in the image.
