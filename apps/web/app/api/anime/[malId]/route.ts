import { NextRequest, NextResponse } from "next/server";
import { getRecommendApiUrl } from "@/lib/api-base";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ malId: string }> }
) {
  const { malId } = await params;

  try {
    const res = await fetch(`${getRecommendApiUrl()}/anime/${malId}`, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(null, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(null, { status: 503 });
  }
}
