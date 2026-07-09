export interface ParsedIntent {
  seed_names: string[];
  genres: string[];
  moods: string[];
  year_range: [number | null, number | null];
  is_hidden_gem: boolean;
  length_constraint: "short" | "long" | null;
  exclusions: string[];
  original_query?: string;
}

export interface Recommendation {
  mal_id: number;
  name: string;
  score: number | string;
  genres: string;
  episodes: number | string;
  reason: string;
  year: number | string;
}

export interface RecommendRequest {
  query: string;
  top_k?: number;
}

export interface RecommendResponse {
  recommendations: Recommendation[];
  intent?: ParsedIntent;
  meta: {
    tier: "guest" | "member";
    queries_remaining?: number;
  };
  error?: string;
}

export interface AnimeDetail {
  mal_id: number;
  name: string;
  score: number | string;
  genres: string;
  episodes: number | string;
  synopsis: string;
  year: number | string;
  type: string;
  studios: string;
}

export interface RecommendationSession {
  id: string;
  user_id: string;
  query: string;
  results: Recommendation[];
  intent: ParsedIntent | null;
  created_at: string;
  share_token?: string | null;
}

export interface SavedAnime {
  id: string;
  user_id: string;
  mal_id: number;
  name: string;
  score: number | string;
  genres: string;
  created_at: string;
}

export type WatchlistStatus = "planned" | "watching" | "finished";

export interface WatchlistItem {
  id: string;
  user_id: string;
  mal_id: number;
  name: string;
  notes: string | null;
  watched: boolean;
  status?: WatchlistStatus;
  sort_order: number;
  created_at: string;
}

export interface QueryFeedback {
  id: string;
  user_id: string;
  session_id: string;
  mal_id: number;
  rating: "up" | "down";
  created_at: string;
}

export const GUEST_MAX_QUERIES = 5;
export const GUEST_MAX_RESULTS = 3;
export const MEMBER_MAX_RESULTS = 10;

export const STARTER_QUERIES = [
  "action anime from the 90s",
  "hidden gem sci-fi anime",
  "something similar to One Piece",
  "short bingeable anime under 13 episodes",
  "sad anime that will make me cry",
] as const;
