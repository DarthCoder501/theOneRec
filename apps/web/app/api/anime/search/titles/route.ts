import { NextRequest, NextResponse } from "next/server";
import { getRecommendApiUrl } from "@/lib/api-base";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limit = request.nextUrl.searchParams.get("limit") ?? "8";

  try {
    const res = await fetch(
      `${getRecommendApiUrl()}/anime/search/titles?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ titles: [] });
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ titles: [] });
  }
}
