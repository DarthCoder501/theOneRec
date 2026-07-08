import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { malUrl } from "@/lib/utils";
import type { Recommendation } from "@theonerec/shared";
import { notFound } from "next/navigation";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("recommendation_sessions")
    .select("*")
    .eq("share_token", token)
    .single();

  if (!session) notFound();

  const results = session.results as Recommendation[];

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-[var(--treasure-gold)]">Shared Treasure Map</h1>
          <p className="text-[var(--text-secondary)] mt-2">&ldquo;{session.query}&rdquo;</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((anime, i) => (
            <GlassCard key={anime.mal_id}>
              <span className="text-xs text-[var(--ocean-blue)]">#{i + 1}</span>
              <h2 className="font-bold text-lg mt-1">{anime.name}</h2>
              <p className="text-sm text-[var(--text-secondary)] capitalize">{anime.genres}</p>
              <p className="text-sm text-[var(--treasure-gold)] mt-1">{anime.reason}</p>
              <a href={malUrl(anime.mal_id)} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--ocean-blue)] underline mt-2 inline-block min-h-[44px]">
                View on MAL
              </a>
            </GlassCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
