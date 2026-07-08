"""theOneRec FastAPI service."""

from contextlib import asynccontextmanager

import pandas as pd
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import settings
from rate_limit import check_and_increment, get_remaining
from recommender.loader import artifacts_exist, get_recommender


@asynccontextmanager
async def lifespan(app: FastAPI):
    if artifacts_exist():
        get_recommender()
    yield


app = FastAPI(title="theOneRec API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendBody(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    top_k: int = Field(default=3, ge=1, le=10)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _is_member(authorization: str | None) -> bool:
    return bool(authorization and authorization.startswith("Bearer "))


@app.get("/health")
def health():
    return {
        "status": "ok",
        "artifacts_loaded": artifacts_exist(),
    }


@app.post("/recommend")
def recommend(
    body: RecommendBody,
    request: Request,
    authorization: str | None = Header(default=None),
):
    if not artifacts_exist():
        raise HTTPException(status_code=503, detail="Recommendation engine not ready. Artifacts missing.")

    member = _is_member(authorization)
    ip = _client_ip(request)

    allowed, remaining = check_and_increment(ip, member)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Daily query limit reached. Join the Crew for unlimited recommendations.",
        )

    max_k = settings.member_max_results if member else settings.guest_max_results
    top_k = min(body.top_k, max_k)

    recommender = get_recommender()
    result = recommender.process_user_query(body.query, top_k=top_k)

    if isinstance(result, dict) and "error" in result:
        return {
            "recommendations": [],
            "error": result["error"],
            "meta": {
                "tier": "member" if member else "guest",
                "queries_remaining": remaining if not member else None,
            },
        }

    response = {
        "recommendations": result["recommendations"],
        "meta": {
            "tier": "member" if member else "guest",
            "queries_remaining": remaining if not member else None,
        },
    }
    if member and "intent" in result:
        response["intent"] = result["intent"]
    return response


@app.get("/anime/{mal_id}")
def get_anime(mal_id: int):
    if not artifacts_exist():
        raise HTTPException(status_code=503, detail="Recommendation engine not ready.")

    recommender = get_recommender()
    row = recommender.anime_df[recommender.anime_df["MAL_ID"] == mal_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Anime not found")

    r = row.iloc[0]
    return {
        "mal_id": int(r["MAL_ID"]),
        "name": str(r["Name"]),
        "score": float(r["Score"]) if pd.notna(r.get("Score")) else "N/A",
        "genres": str(r.get("Genres", "N/A")),
        "episodes": int(r["Episodes"]) if pd.notna(r.get("Episodes")) else "N/A",
        "synopsis": str(r.get("sypnopsis", "")),
        "year": int(r["start_date"].year) if hasattr(r.get("start_date"), "year") and pd.notna(r.get("start_date")) else "Unknown",
        "type": str(r.get("Type", "N/A")),
        "studios": str(r.get("Studios", "N/A")),
    }


@app.get("/anime/search/titles")
def search_titles(q: str = "", limit: int = 10):
    if not q or len(q) < 2:
        return {"titles": []}
    if not artifacts_exist():
        return {"titles": []}

    recommender = get_recommender()
    mask = recommender.anime_df["Name"].str.contains(q, case=False, na=False)
    matches = recommender.anime_df[mask].head(limit)
    return {
        "titles": [
            {"mal_id": int(r["MAL_ID"]), "name": r["Name"]}
            for _, r in matches.iterrows()
        ]
    }


@app.get("/rate-limit")
def rate_limit_status(request: Request, authorization: str | None = Header(default=None)):
    member = _is_member(authorization)
    ip = _client_ip(request)
    remaining = get_remaining(ip, member)
    return {
        "tier": "member" if member else "guest",
        "queries_remaining": remaining if not member else None,
        "max_queries": settings.guest_max_queries if not member else None,
        "max_results": settings.member_max_results if member else settings.guest_max_results,
    }
