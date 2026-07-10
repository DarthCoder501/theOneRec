import { NextRequest, NextResponse } from "next/server";
import { fetchRecommendUpstream } from "@/lib/upstream-api";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limit = request.nextUrl.searchParams.get("limit") ?? "8";

  try {
    const res = await fetchRecommendUpstream(
      `/anime/search/titles?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`
    );

    if (!res.ok) {
      return NextResponse.json({ titles: [] });
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ titles: [] });
  }
}
