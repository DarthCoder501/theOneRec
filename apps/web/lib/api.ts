import type { RecommendResponse } from "@theonerec/shared";
import { getApiBase } from "@/lib/api-base";

export async function fetchRecommendations(
  query: string,
  topK: number,
  token?: string
): Promise<RecommendResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getApiBase()}/recommend`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, top_k: topK }),
  });

  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    return {
      recommendations: [],
      error: data.detail || data.error || "Daily query limit reached.",
      meta: { tier: "guest" },
    };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return {
      recommendations: [],
      error:
        data.error ||
        data.detail ||
        (res.status === 502 || res.status === 504
          ? "The recommendation service is waking up. Wait a minute and try again."
          : `Recommendation failed (${res.status}).`),
      meta: data.meta ?? { tier: token ? "member" : "guest" },
    };
  }

  return res.json();
}

export async function fetchRateLimit(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getApiBase()}/rate-limit`, { headers, cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function searchAnimeTitles(q: string) {
  try {
    const res = await fetch(
      `${getApiBase()}/anime/search/titles?q=${encodeURIComponent(q)}&limit=8`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.titles ?? []) as { mal_id: number; name: string }[];
  } catch {
    return [];
  }
}

export async function fetchAnimeDetail(malId: number) {
  try {
    const res = await fetch(`${getApiBase()}/anime/${malId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
