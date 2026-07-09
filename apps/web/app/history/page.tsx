import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { HistoryList } from "@/components/library/history-list";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: sessions } = await supabase
    .from("recommendation_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell userEmail={user.email}>
      <h1 className="text-2xl font-bold text-treasure-gold mb-6">Voyage History</h1>
      <HistoryList sessions={sessions ?? []} />
    </AppShell>
  );
}
