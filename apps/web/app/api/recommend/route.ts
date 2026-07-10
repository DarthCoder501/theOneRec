import { NextRequest, NextResponse } from "next/server";
import {
  fetchRecommendUpstream,
  getRecommendApiConfigError,
  upstreamErrorMessage,
} from "@/lib/upstream-api";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const configError = getRecommendApiConfigError();
  if (configError) {
    return NextResponse.json({ recommendations: [], error: configError }, { status: 503 });
  }

  const body = await request.text();
  const authorization = request.headers.get("authorization");

  try {
    const res = await fetchRecommendUpstream("/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        typeof data.detail === "string"
          ? data.detail
          : typeof data.error === "string"
            ? data.error
            : upstreamErrorMessage(null, res.status);

      return NextResponse.json(
        { recommendations: [], error: message, meta: data.meta },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { recommendations: [], error: upstreamErrorMessage(error) },
      { status: 503 }
    );
  }
}
