import { NextRequest, NextResponse } from "next/server";
import { getRecommendApiUrl } from "@/lib/api-base";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  try {
    const res = await fetch(`${getRecommendApiUrl()}/rate-limit`, {
      headers: authorization ? { Authorization: authorization } : {},
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(null, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(null, { status: 503 });
  }
}
