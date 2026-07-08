import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { Recommendation } from "@theonerec/shared";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: sessions } = await supabase
    .from("recommendation_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell userEmail={user.email}>
      <h1 className="text-2xl font-bold text-[var(--treasure-gold)] mb-6">Voyage History</h1>
      {!sessions?.length ? (
        <p className="text-[var(--text-secondary)]">No voyages yet. <Link href="/" className="text-[var(--ocean-blue)] underline">Set sail</Link> to get started.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <GlassCard key={s.id}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">{new Date(s.created_at).toLocaleDateString()}</p>
                  <p className="font-semibold text-[var(--text-primary)] mt-1">&ldquo;{s.query}&rdquo;</p>
                  <ul className="mt-2 text-sm text-[var(--text-secondary)]">
                    {(s.results as Recommendation[]).slice(0, 3).map((r) => (
                      <li key={r.mal_id}>{r.name}</li>
                    ))}
                  </ul>
                </div>
                <form action={`/api/sessions/${s.id}/delete`} method="POST">
                  <Button variant="ghost" size="icon" type="submit" aria-label="Delete session">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
