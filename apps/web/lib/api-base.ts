/** Server-side calls hit the FastAPI service directly; browser calls go through Next.js proxy routes. */
export function getApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.RECOMMEND_API_URL || "http://localhost:8000";
  }
  return "/api";
}

export function getRecommendApiUrl(): string {
  return process.env.RECOMMEND_API_URL || "http://localhost:8000";
}
