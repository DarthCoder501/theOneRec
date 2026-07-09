import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { SavedList } from "@/components/library/saved-list";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: saved } = await supabase
    .from("saved_anime")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell userEmail={user.email}>
      <h1 className="text-2xl font-bold text-treasure-gold mb-6">Saved Treasures</h1>
      <SavedList items={saved ?? []} />
    </AppShell>
  );
}
