import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { malUrl } from "@/lib/utils";
import Link from "next/link";

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: saved } = await supabase
    .from("saved_anime")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell userEmail={user.email}>
      <h1 className="text-2xl font-bold text-[var(--treasure-gold)] mb-6">Saved Treasures</h1>
      {!saved?.length ? (
        <p className="text-[var(--text-secondary)]">No saved anime yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {saved.map((item) => (
            <GlassCard key={item.id}>
              <h2 className="font-bold text-[var(--text-primary)]">{item.name}</h2>
              <p className="text-sm text-[var(--text-secondary)] capitalize mt-1">{item.genres}</p>
              <p className="text-sm text-[var(--treasure-gold)] mt-1">Score: {item.score}</p>
              <Link href={malUrl(item.mal_id)} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--ocean-blue)] underline mt-2 inline-block min-h-[44px] flex items-center">
                View on MAL
              </Link>
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
