const UPSTREAM_TIMEOUT_MS = 55_000;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Server-side Modal/FastAPI base URL (used by Next.js proxy routes). */
export function getRecommendApiUrl(): string {
  const configured = process.env.RECOMMEND_API_URL?.trim();
  if (configured) return normalizeBaseUrl(configured);
  return "http://localhost:8000";
}

/** Returns a user-facing config error, or null when the upstream URL looks valid. */
export function getRecommendApiConfigError(): string | null {
  const url = getRecommendApiUrl();

  if (!process.env.RECOMMEND_API_URL?.trim()) {
    return "RECOMMEND_API_URL is not set. Add your Modal API URL in Vercel environment variables.";
  }

  if (process.env.VERCEL && /localhost|127\.0\.0\.1/.test(url)) {
    return "RECOMMEND_API_URL points to localhost on Vercel. Set it to your Modal URL (https://…modal.run).";
  }

  return null;
}

export async function fetchRecommendUpstream(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const configError = getRecommendApiConfigError();
  if (configError) {
    throw new Error(configError);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    return await fetch(`${getRecommendApiUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function upstreamErrorMessage(error: unknown, status?: number): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "The recommendation service timed out. It may be waking up — wait a minute and try again.";
    }
    return error.message;
  }

  if (status === 502 || status === 504) {
    return "The recommendation service is unavailable or still starting. Wait a minute and try again.";
  }

  if (status === 503) {
    return "The recommendation engine is not ready. ML artifacts may be missing on Modal.";
  }

  return "Recommendation service unavailable.";
}
