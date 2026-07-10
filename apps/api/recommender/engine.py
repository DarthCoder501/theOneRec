"""AniRecs recommendation engine (ported from notebook cell 23)."""

from __future__ import annotations

import json
import re
from collections import defaultdict
from difflib import get_close_matches

import google.generativeai as genai
import numpy as np
import pandas as pd
from sentence_transformers import CrossEncoder, SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


class AniRecs:
    CROSS_ENCODER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    def __init__(
        self,
        anime_df: pd.DataFrame,
        final_features: np.ndarray,
        st_model: SentenceTransformer,
        feature_ranges: dict,
        enable_cross_encoder: bool = False,
        gemini_model=None,
    ):
        self.anime_df = anime_df
        self.final_features = final_features
        self.st_model = st_model
        self.feature_ranges = feature_ranges
        self.enable_cross_encoder = enable_cross_encoder
        self._cross_encoder: CrossEncoder | None = None
        self.gemini_model = gemini_model
        self._prepare_lookup_sets()

    def _get_cross_encoder(self) -> CrossEncoder:
        if self._cross_encoder is None:
            self._cross_encoder = CrossEncoder(self.CROSS_ENCODER_MODEL)
        return self._cross_encoder

    def _nearest_indices(self, query_vector: np.ndarray, n_neighbors: int) -> np.ndarray:
        """Cosine kNN over mmap-backed features in chunks (never materialize the full matrix)."""
        import heapq

        n_rows = self.final_features.shape[0]
        n = min(n_neighbors, n_rows)
        if n <= 0:
            return np.array([], dtype=int)

        query = np.asarray(query_vector, dtype=np.float32).reshape(-1)
        q_norm = float(np.linalg.norm(query)) + 1e-12
        query = query / q_norm

        # Min-heap of (similarity, index); keep top-n highest scores.
        heap: list[tuple[float, int]] = []
        chunk_size = 1024

        for start in range(0, n_rows, chunk_size):
            block = np.asarray(self.final_features[start : start + chunk_size], dtype=np.float32)
            norms = np.linalg.norm(block, axis=1) + 1e-12
            sims = (block @ query) / norms
            for offset, score in enumerate(sims):
                idx = start + offset
                s = float(score)
                if len(heap) < n:
                    heapq.heappush(heap, (s, idx))
                elif s > heap[0][0]:
                    heapq.heapreplace(heap, (s, idx))

        heap.sort(reverse=True)
        return np.array([idx for _, idx in heap], dtype=int)

    def _fallback_semantic_scores(
        self,
        user_input: str,
        candidate_indices: list[int],
        pooled_vector: np.ndarray | None,
    ) -> np.ndarray:
        """Synopsis-block cosine scores when cross-encoder is disabled to save RAM."""
        syn_start, syn_end = self.feature_ranges["synopsis"]
        idxs = np.asarray(candidate_indices, dtype=np.int64)
        candidate_feats = np.asarray(
            self.final_features[idxs, syn_start:syn_end], dtype=np.float32
        )

        if pooled_vector is not None:
            query_vector = np.asarray(pooled_vector[:, syn_start:syn_end], dtype=np.float32)
        else:
            query_vector = self.st_model.encode([user_input], convert_to_numpy=True).astype(
                np.float32, copy=False
            )

        return cosine_similarity(query_vector, candidate_feats)[0]

    def _prepare_lookup_sets(self):
        self.genres_set: set[str] = set()
        for _, row in self.anime_df.iterrows():
            if pd.notna(row["Genres"]):
                self.genres_set.update(g.strip().lower() for g in str(row["Genres"]).split())
        self.canonical_genres = list(self.genres_set)

    def parse_query_intent(self, query: str) -> dict:
        if not self.gemini_model:
            return self._fallback_parse_query(query)

        prompt = f"""
        Extract the following information from the user's anime recommendation query into a valid JSON object.
        Query: "{query}"

        Required JSON fields:
        - "seed_names": list of strings (anime names the user wants something similar to, or watch after). Empty list if none.
        - "genres": list of strings (genres requested). Empty list if none.
        - "moods": list of strings (e.g. sad, feel-good, dark). Empty list if none.
        - "year_range": list of two integers [start_year, end_year] or [null, null] if no year is specified.
        - "is_hidden_gem": boolean (true if user asks for hidden gem or underrated).
        - "length_constraint": string ("short", "long", or null).
        - "exclusions": list of strings (genres or terms to exclude). Empty list if none.

        Return ONLY valid JSON.
        """
        try:
            response = self.gemini_model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            intent = json.loads(text.strip())

            if intent.get("length_constraint") not in ["short", "long"]:
                intent["length_constraint"] = None
            if not isinstance(intent.get("year_range"), list) or len(intent.get("year_range", [])) != 2:
                intent["year_range"] = [None, None]
            intent["original_query"] = query
            return intent
        except Exception:
            return self._fallback_parse_query(query)

    def _fallback_parse_query(self, query: str) -> dict:
        query_lower = query.lower()
        return {
            "seed_names": [],
            "genres": [],
            "moods": [],
            "year_range": [None, None],
            "is_hidden_gem": "hidden gem" in query_lower,
            "length_constraint": (
                "short" if "short" in query_lower else ("long" if "long" in query_lower else None)
            ),
            "exclusions": [],
            "original_query": query,
        }

    def find_anime_by_name(self, query_name: str):
        if "Name" not in self.anime_df.columns:
            return None
        anime_names = self.anime_df["Name"].tolist()
        exact = self.anime_df[self.anime_df["Name"].str.lower() == query_name.lower()]
        if not exact.empty:
            return exact.iloc[0]
        close = get_close_matches(query_name, anime_names, n=5, cutoff=0.5)
        if close:
            return self.anime_df[self.anime_df["Name"] == close[0]].iloc[0]
        return None

    def get_dynamic_reason(self, target_idx: int, rec_idx: int) -> str:
        vec_target = self.final_features[target_idx]
        vec_rec = self.final_features[rec_idx]
        contributions = {}
        for block, (start, end) in self.feature_ranges.items():
            contributions[block] = np.dot(vec_target[start:end], vec_rec[start:end])
        top_block = max(contributions, key=contributions.get)
        if top_block == "synopsis":
            return "Highly similar themes and story"
        if top_block == "genres":
            return "Strong genre alignment"
        if top_block == "prod_studio":
            return "Shared studio or producers"
        return "Similar popularity and format"

    def get_root_title(self, title: str) -> str:
        title_clean = str(title).lower()
        patterns = [
            r"\b\d{1,2}(?:st|nd|rd|th)?\s+season\b",
            r"\bseason\s+\d{1,2}\b",
            r"\bpart\s+\d{1,2}\b",
            r"\bdai\s+\d{1,2}\s+maku\b",
            r"\b(?:ii|iii|iv|v|vi|vii|viii|ix|x)\b",
            r"-hen\b",
            r"\bchapter\s+\d+\b",
        ]
        for p in patterns:
            title_clean = re.sub(p, "", title_clean)
        return re.sub(r"[^a-z0-9]", "", title_clean).strip()

    def is_franchise_duplicate(self, title, existing_titles, seed_titles) -> bool:
        root_title = self.get_root_title(title)
        if not root_title:
            return False
        for ex in existing_titles:
            ex_root = self.get_root_title(ex)
            if ex_root and (root_title in ex_root or ex_root in root_title):
                return True
        for st in seed_titles:
            st_root = self.get_root_title(st)
            if st_root and (root_title in st_root or st_root in root_title):
                return True
        return False

    def is_sequel(self, title: str) -> bool:
        title_lower = str(title).lower()
        patterns = [
            r"\b\d{1,2}(?:nd|rd|th)\s+season\b",
            r"\bseason\s+[2-9]\b",
            r"\bpart\s+[2-9]\b",
            r"\bdai\s+[2-9]\s+maku\b",
            r"\b(?:ii|iii|iv|v|vi|vii|viii|ix|x)\b",
            r"-hen\b",
        ]
        return any(re.search(p, title_lower) for p in patterns)

    def _get_sequel_matches(self, title: str) -> list[str]:
        title_lower = str(title).lower()
        patterns = [
            r"\b\d{1,2}(?:nd|rd|th)\s+season\b",
            r"\bseason\s+[2-9]\b",
            r"\bpart\s+[2-9]\b",
            r"\bdai\s+[2-9]\s+maku\b",
            r"\b(?:ii|iii|iv|v|vi|vii|viii|ix|x)\b",
            r"-hen\b",
        ]
        matches = []
        for p in patterns:
            match = re.search(p, title_lower)
            if match:
                matches.append(match.group(0))
        return matches

    @staticmethod
    def _json_safe(value):
        """Convert pandas/numpy scalars to JSON-serializable Python types."""
        if value is None:
            return None
        if isinstance(value, (str, bool)):
            return value
        if isinstance(value, (np.integer,)):
            return int(value)
        if isinstance(value, (np.floating,)):
            if np.isnan(value) or np.isinf(value):
                return None
            return float(value)
        if isinstance(value, (int, float)):
            if isinstance(value, float) and (np.isnan(value) or np.isinf(value)):
                return None
            return value
        if pd.isna(value):
            return None
        return str(value)

    def process_user_query(self, user_input: str, top_k: int = 10):
        if not user_input or len(user_input.strip()) < 2:
            return {"error": "Please provide a valid query."}

        intent = self.parse_query_intent(user_input)
        filtered_df = self.anime_df.copy()

        for ex in intent.get("exclusions", []):
            filtered_df = filtered_df[~filtered_df["Genres"].str.contains(ex, case=False, na=False)]

        query_lower = user_input.lower()
        is_movie = "movie" in query_lower or "film" in query_lower
        is_ova = "ova" in query_lower
        length_constraint = intent.get("length_constraint")

        if is_movie:
            filtered_df = filtered_df[filtered_df["Episodes"] == 1]
        elif length_constraint == "short":
            filtered_df = filtered_df[(filtered_df["Episodes"] >= 10) & (filtered_df["Episodes"] <= 13)]
        elif length_constraint == "long":
            filtered_df = filtered_df[filtered_df["Episodes"] >= 50]
        elif not is_ova:
            filtered_df = filtered_df[(filtered_df["Type"] == "tv") & (filtered_df["Episodes"] >= 12)]

        if intent.get("year_range") and intent["year_range"][0]:
            start_y, end_y = intent["year_range"]
            filtered_df = filtered_df[
                (filtered_df["start_date"].dt.year >= start_y)
                & (filtered_df["start_date"].dt.year <= end_y)
            ]

        if intent.get("genres") and not intent.get("seed_names"):
            mask = pd.Series(False, index=filtered_df.index)
            for g in intent["genres"]:
                mask = mask | filtered_df["Genres"].str.contains(g, case=False, na=False)
            filtered_df = filtered_df[mask]

        if filtered_df.empty:
            return {"error": "No anime found matching all constraints."}

        seed_names_list: list[str] = []
        target_indices: list[int] = []
        pooled_vector: np.ndarray | None = None

        if intent.get("seed_names"):
            for name in intent["seed_names"]:
                anime = self.find_anime_by_name(name)
                if anime is not None:
                    target_indices.append(anime.name)
                    seed_names_list.append(str(anime["Name"]))
            if not target_indices:
                return {"error": f"Could not find seed anime matching: {intent['seed_names']}"}

            pooled_vector = np.mean(self.final_features[target_indices], axis=0).reshape(1, -1)
            neighbor_indices = self._nearest_indices(
                pooled_vector, min(200, len(self.anime_df))
            )
            candidate_indices = [
                idx for idx in neighbor_indices if idx in filtered_df.index and idx not in target_indices
            ]
        else:
            query_emb = self.st_model.encode([user_input], convert_to_numpy=True).astype(
                np.float32, copy=False
            )
            syn_start, syn_end = self.feature_ranges["synopsis"]
            filtered_idxs = filtered_df.index.to_numpy(dtype=np.int64)
            # Fancy-index only the synopsis columns for filtered rows (avoid full-row copies).
            synopsis_feats = np.asarray(
                self.final_features[filtered_idxs, syn_start:syn_end], dtype=np.float32
            )
            if synopsis_feats.shape[1] == query_emb.shape[1]:
                sims = cosine_similarity(query_emb, synopsis_feats)[0]
                if np.max(sims) < 0.15:
                    return {
                        "error": "I couldn't find any anime matching that description. Could you try rephrasing?"
                    }
                filtered_df = filtered_df.copy()
                filtered_df["sim"] = sims
                filtered_df = filtered_df.sort_values("sim", ascending=False)
            candidate_indices = filtered_df.index.tolist()[:200]

        if not candidate_indices:
            return {"error": "No candidates found."}

        candidate_texts = [
            (user_input, str(self.anime_df.iloc[idx].get("sypnopsis", "")))
            for idx in candidate_indices
        ]
        if self.enable_cross_encoder:
            cross_scores = self._get_cross_encoder().predict(candidate_texts)
        else:
            cross_scores = self._fallback_semantic_scores(
                user_input, candidate_indices, pooled_vector
            )
        c_min, c_max = np.min(cross_scores), np.max(cross_scores)
        max_members_log = (
            self.anime_df["Members_log"].max() if "Members_log" in self.anime_df.columns else 15.0
        )

        hybrid_scores = []
        for i, idx in enumerate(candidate_indices):
            row = self.anime_df.iloc[idx]
            semantic = (cross_scores[i] - c_min) / (c_max - c_min) if c_max > c_min else 0
            score_val = pd.to_numeric(row.get("Score", 0), errors="coerce")
            score_norm = score_val / 10.0 if pd.notna(score_val) else 0.0
            members_log = pd.to_numeric(row.get("Members_log", 0), errors="coerce")
            members_norm = min((members_log / max_members_log) if pd.notna(members_log) else 0.0, 1.0)
            final_score = 0.70 * semantic + 0.20 * score_norm + 0.10 * members_norm
            hybrid_scores.append((final_score, idx))

        ranked = [idx for _, idx in sorted(hybrid_scores, key=lambda p: p[0], reverse=True)]

        recommendations = []
        accepted_titles: list[str] = []
        seen_studios: dict[str, int] = defaultdict(int)

        for idx in ranked:
            row = self.anime_df.iloc[idx]
            title = row.get("Name", "Unknown")

            if self.is_sequel(title):
                sequel_matches = self._get_sequel_matches(title)
                if not any(m in query_lower for m in sequel_matches):
                    continue

            if self.is_franchise_duplicate(title, accepted_titles, seed_names_list):
                continue

            if intent.get("is_hidden_gem"):
                score = pd.to_numeric(row.get("Score", 0), errors="coerce")
                popularity = pd.to_numeric(row.get("Members", 0), errors="coerce")
                if score < 7.0 or popularity > 100000:
                    continue

            studio = str(row.get("Studios", "Unknown"))
            if seen_studios[studio] >= 2:
                continue
            seen_studios[studio] += 1

            reason = "High relevance & quality (Hybrid Reranked)"
            if intent.get("seed_names"):
                reason = self.get_dynamic_reason(target_indices[0], idx)

            score_raw = row.get("Score", "N/A")
            episodes_raw = row.get("Episodes", "N/A")
            recommendations.append({
                "mal_id": int(row.get("MAL_ID", 0)),
                "name": str(title),
                "score": self._json_safe(score_raw) if pd.notna(score_raw) else "N/A",
                "genres": str(row.get("Genres", "N/A")),
                "episodes": self._json_safe(episodes_raw) if pd.notna(episodes_raw) else "N/A",
                "reason": reason,
                "year": self._json_safe(row["start_date"].year) if pd.notna(row.get("start_date")) else "Unknown",
            })
            accepted_titles.append(title)

            if len(recommendations) >= top_k:
                break

        if not recommendations:
            return {"error": "No recommendations passed the diversity and franchise filters."}

        return {"recommendations": recommendations, "intent": intent}


def create_recommendation_system(
    anime_df,
    final_features,
    st_model,
    feature_ranges,
    enable_cross_encoder: bool = False,
    gemini_model=None,
) -> AniRecs:
    return AniRecs(
        anime_df,
        final_features,
        st_model,
        feature_ranges,
        enable_cross_encoder=enable_cross_encoder,
        gemini_model=gemini_model,
    )
