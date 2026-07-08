import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { malUrl } from "@/lib/utils";
import Link from "next/link";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: items } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  return (
    <AppShell userEmail={user.email}>
      <h1 className="text-2xl font-bold text-[var(--treasure-gold)] mb-6">Watchlist — Plan Your Voyage</h1>
      {!items?.length ? (
        <p className="text-[var(--text-secondary)]">Your watchlist is empty. Add anime from recommendations.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, i) => (
            <li key={item.id}>
              <GlassCard className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-[var(--treasure-gold)] font-bold w-8">{i + 1}</span>
                  <div>
                    <h2 className="font-semibold text-[var(--text-primary)]">{item.name}</h2>
                    {item.notes && <p className="text-sm text-[var(--text-secondary)]">{item.notes}</p>}
                    {item.watched && <span className="text-xs text-[var(--ocean-blue)]">Watched</span>}
                  </div>
                </div>
                <Link href={malUrl(item.mal_id)} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--ocean-blue)] underline min-h-[44px] flex items-center">
                  MAL
                </Link>
              </GlassCard>
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}
