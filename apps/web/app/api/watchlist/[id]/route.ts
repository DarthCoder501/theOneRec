import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { WatchlistStatus } from "@theonerec/shared";

const VALID_STATUSES: WatchlistStatus[] = ["planned", "watching", "finished"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { status?: WatchlistStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("watchlist")
    .update({ status, watched: status === "finished" })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, status, watched")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
