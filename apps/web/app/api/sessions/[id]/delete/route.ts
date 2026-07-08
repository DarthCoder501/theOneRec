import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));

  await supabase.from("recommendation_sessions").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.redirect(new URL("/history", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
