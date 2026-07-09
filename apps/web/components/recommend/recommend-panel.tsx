"use client";

import { useCallback, useEffect, useState } from "react";
import type { ParsedIntent, Recommendation } from "@theonerec/shared";
import { GUEST_MAX_RESULTS, MEMBER_MAX_RESULTS } from "@theonerec/shared";
import { QueryInput } from "./query-input";
import { ResultCard, ResultSkeleton } from "./result-card";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { fetchRecommendations } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Share2, ChevronDown, ChevronUp, Check } from "lucide-react";

interface RecommendPanelProps {
  isMember: boolean;
  queriesRemaining?: number | null;
}

type ActionNotice = {
  type: "success" | "error";
  message: string;
};

export function RecommendPanel({ isMember, queriesRemaining }: RecommendPanelProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIntent, setShowIntent] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(queriesRemaining);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());
  const [pendingSaveId, setPendingSaveId] = useState<number | null>(null);
  const [pendingWatchlistId, setPendingWatchlistId] = useState<number | null>(null);
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);

  const topK = isMember ? MEMBER_MAX_RESULTS : GUEST_MAX_RESULTS;

  useEffect(() => {
    if (!actionNotice) return;
    const timer = window.setTimeout(() => setActionNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  const showNotice = useCallback((notice: ActionNotice) => {
    setActionNotice(notice);
  }, []);

  const handleSubmit = useCallback(
    async (query: string) => {
      setLoading(true);
      setError(null);
      setResults([]);
      setIntent(null);
      setSessionId(null);
      setActionNotice(null);

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const data = await fetchRecommendations(query, topK, token);

        if (data.error) {
          setError(data.error);
        } else {
          setResults(data.recommendations);
          if (data.intent) setIntent(data.intent);
          if (data.meta?.queries_remaining !== undefined) {
            setRemaining(data.meta.queries_remaining);
          }

          if (session?.user && data.recommendations.length > 0) {
            const { data: saved } = await supabase
              .from("recommendation_sessions")
              .insert({
                user_id: session.user.id,
                query,
                results: data.recommendations,
                intent: data.intent ?? null,
              })
              .select("id, share_token")
              .single();
            if (saved) setSessionId(saved.id);
          }
        }
      } catch {
        setError("The ship hit rough seas. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [topK]
  );

  const handleSave = async (anime: Recommendation) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setPendingSaveId(anime.mal_id);
    const { error: saveError } = await supabase.from("saved_anime").upsert({
      user_id: user.id,
      mal_id: anime.mal_id,
      name: anime.name,
      score: String(anime.score),
      genres: anime.genres,
    });
    setPendingSaveId(null);

    if (saveError) {
      showNotice({
        type: "error",
        message: `Could not save ${anime.name}. Please try again.`,
      });
      return;
    }

    setSavedIds((prev) => new Set(prev).add(anime.mal_id));
    showNotice({
      type: "success",
      message: `${anime.name} saved to your collection.`,
    });
  };

  const handleWatchlist = async (anime: Recommendation) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setPendingWatchlistId(anime.mal_id);
    const { error: watchlistError } = await supabase.from("watchlist").upsert({
      user_id: user.id,
      mal_id: anime.mal_id,
      name: anime.name,
      status: "planned",
      watched: false,
    });
    setPendingWatchlistId(null);

    if (watchlistError) {
      showNotice({
        type: "error",
        message: `Could not add ${anime.name} to your watchlist. Please try again.`,
      });
      return;
    }

    setWatchlistIds((prev) => new Set(prev).add(anime.mal_id));
    showNotice({
      type: "success",
      message: `${anime.name} added to your watchlist.`,
    });
  };

  const handleFeedback = async (anime: Recommendation, rating: "up" | "down") => {
    if (!sessionId) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("query_feedback").upsert({
      user_id: user.id,
      session_id: sessionId,
      mal_id: anime.mal_id,
      rating,
    });
    showNotice({
      type: "success",
      message: `Feedback recorded for ${anime.name}.`,
    });
  };

  const handleShare = async () => {
    if (!sessionId) return;
    const supabase = createClient();
    const token = crypto.randomUUID().slice(0, 8);
    await supabase
      .from("recommendation_sessions")
      .update({ share_token: token })
      .eq("id", sessionId);
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    showNotice({
      type: "success",
      message: "Share link copied to clipboard.",
    });
  };

  return (
    <div className="space-y-8">
      {!isMember && remaining !== null && remaining !== undefined && remaining >= 0 && (
        <div role="status" className="rounded-xl border border-ocean-blue bg-ocean-blue/20 px-4 py-3 text-sm">
          {remaining === 0 ? (
            <span>Daily voyage limit reached — <strong className="text-treasure-gold">Join the Crew</strong> for unlimited recommendations.</span>
          ) : (
            <span>{5 - remaining} of 5 daily voyages used — {remaining} remaining.</span>
          )}
        </div>
      )}

      <GlassCard>
        <QueryInput onSubmit={handleSubmit} loading={loading} disabled={!isMember && remaining === 0} />
      </GlassCard>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2" aria-live="polite" aria-busy="true">
          <p className="sr-only">Loading recommendations</p>
          {Array.from({ length: topK }).map((_, i) => (
            <ResultSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-pirate-red bg-pirate-red/20 px-4 py-3">
          {error.includes("rephrasing") || error.includes("matching") ? "No treasure found — try a different course." : error}
        </div>
      )}

      {actionNotice && (
        <div
          role={actionNotice.type === "error" ? "alert" : "status"}
          aria-live={actionNotice.type === "error" ? "assertive" : "polite"}
          className={
            actionNotice.type === "error"
              ? "rounded-xl border border-pirate-red bg-pirate-red/20 px-4 py-3 text-sm flex items-center gap-2"
              : "rounded-xl border border-treasure-gold/40 bg-treasure-gold/10 px-4 py-3 text-sm text-treasure-gold flex items-center gap-2"
          }
        >
          {actionNotice.type === "success" && (
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {actionNotice.message}
        </div>
      )}

      {results.length > 0 && !loading && (
        <section aria-labelledby="results-heading">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 id="results-heading" className="text-xl font-bold text-treasure-gold">
              Your Treasure Map ({results.length} picks)
            </h2>
            {isMember && sessionId && (
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Copy Share Link
              </Button>
            )}
          </div>

          {isMember && intent && (
            <div className="mb-4">
              <button type="button" onClick={() => setShowIntent(!showIntent)} className="flex items-center gap-2 text-sm text-ocean-blue min-h-[44px]" aria-expanded={showIntent}>
                How we understood your query
                {showIntent ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showIntent && (
                <pre className="mt-2 rounded-xl bg-(--deep-sea-light) p-4 text-xs overflow-x-auto text-(--text-secondary)">
                  {JSON.stringify(intent, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2" role="list">
            {results.map((anime, i) => (
              <ResultCard
                key={anime.mal_id}
                anime={anime}
                rank={i + 1}
                isMember={isMember}
                isSaved={savedIds.has(anime.mal_id)}
                isOnWatchlist={watchlistIds.has(anime.mal_id)}
                isSaving={pendingSaveId === anime.mal_id}
                isAddingToWatchlist={pendingWatchlistId === anime.mal_id}
                onSave={() => handleSave(anime)}
                onWatchlist={() => handleWatchlist(anime)}
                onFeedback={(r) => handleFeedback(anime, r)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
