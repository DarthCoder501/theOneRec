import { NextRequest, NextResponse } from "next/server";
import { getRecommendApiUrl } from "@/lib/api-base";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const authorization = request.headers.get("authorization");

  try {
    const res = await fetch(`${getRecommendApiUrl()}/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { recommendations: [], error: "Recommendation service unavailable." },
      { status: 503 }
    );
  }
}
