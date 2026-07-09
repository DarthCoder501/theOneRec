import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { WatchlistList } from "@/components/library/watchlist-list";
import type { WatchlistItem } from "@theonerec/shared";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: items } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  const normalized: WatchlistItem[] = (items ?? []).map((item) => ({
    ...item,
    status: item.status ?? (item.watched ? "finished" : "planned"),
  }));

  return (
    <AppShell userEmail={user.email}>
      <h1 className="text-2xl font-bold text-treasure-gold mb-6">Watchlist — Plan Your Voyage</h1>
      <WatchlistList items={normalized} />
    </AppShell>
  );
}
