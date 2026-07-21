"use client";

import type { Recommendation } from "@theonerec/shared";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ExternalLink,
  ListPlus,
  ListChecks,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { malUrl } from "@/lib/utils";

interface ResultCardProps {
  anime: Recommendation;
  rank: number;
  isMember: boolean;
  isSaved?: boolean;
  isOnWatchlist?: boolean;
  isSaving?: boolean;
  isAddingToWatchlist?: boolean;
  onSave?: () => void;
  onWatchlist?: () => void;
  onFeedback?: (rating: "up" | "down") => void;
}

export function ResultCard({
  anime,
  rank,
  isMember,
  isSaved = false,
  isOnWatchlist = false,
  isSaving = false,
  isAddingToWatchlist = false,
  onSave,
  onWatchlist,
  onFeedback,
}: ResultCardProps) {
  return (
    <GlassCard className="space-y-3" role="listitem">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-ocean-blue uppercase tracking-wider">
            Treasure #{rank}
          </span>
          <h3 className="text-lg font-bold text-(--text-primary) mt-1">{anime.name}</h3>
        </div>
        <span
          className="shrink-0 rounded-lg bg-treasure-gold px-2.5 py-1 text-sm font-bold text-(--text-on-gold)"
          aria-label={`Score ${anime.score}`}
        >
          {anime.score}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <dt className="text-(--text-secondary)">Genres</dt>
          <dd className="text-(--text-primary) capitalize">{anime.genres}</dd>
        </div>
        <div>
          <dt className="text-(--text-secondary)">Episodes</dt>
          <dd className="text-(--text-primary)">{anime.episodes}</dd>
        </div>
        <div>
          <dt className="text-(--text-secondary)">Year</dt>
          <dd className="text-(--text-primary)">{anime.year}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-(--text-secondary)">Why recommended</dt>
          <dd className="text-treasure-gold italic">{anime.reason}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-(--glass-border)">
        <Button variant="outline" size="sm" asChild>
          <a
            href={malUrl(anime.mal_id)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${anime.name} on MyAnimeList (opens in new tab)`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            MAL
          </a>
        </Button>

        {isMember && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              disabled={isSaved || isSaving}
              aria-busy={isSaving}
              aria-label={
                isSaved
                  ? `${anime.name} saved to your collection`
                  : `Save ${anime.name} to your collection`
              }
              className={
                isSaved
                  ? "border border-treasure-gold/50 bg-treasure-gold/15 text-treasure-gold"
                  : undefined
              }
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Bookmark className="h-4 w-4" aria-hidden="true" />
              )}
              {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onWatchlist}
              disabled={isOnWatchlist || isAddingToWatchlist}
              aria-busy={isAddingToWatchlist}
              aria-label={
                isOnWatchlist
                  ? `${anime.name} is on your watchlist`
                  : `Add ${anime.name} to your watchlist`
              }
              className={
                isOnWatchlist
                  ? "border border-ocean-blue/50 bg-ocean-blue/15 text-ocean-blue"
                  : undefined
              }
            >
              {isOnWatchlist ? (
                <ListChecks className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ListPlus className="h-4 w-4" aria-hidden="true" />
              )}
              {isAddingToWatchlist
                ? "Adding..."
                : isOnWatchlist
                  ? "On watchlist"
                  : "Watchlist"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onFeedback?.("up")}
              aria-label={`Thumbs up for ${anime.name}`}
              className="text-treasure-gold hover:border-treasure-gold/60 hover:bg-treasure-gold/15"
            >
              <ThumbsUp className="size-5" strokeWidth={2.25} aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onFeedback?.("down")}
              aria-label={`Thumbs down for ${anime.name}`}
              className="text-(--text-secondary) hover:border-pirate-red/60 hover:bg-pirate-red/15 hover:text-pirate-red"
            >
              <ThumbsDown className="size-5" strokeWidth={2.25} aria-hidden="true" />
            </Button>
          </>
        )}
      </div>

      {(isSaved || isOnWatchlist) && (
        <p className="flex items-center gap-1.5 text-xs text-treasure-gold" role="status">
          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {isSaved && isOnWatchlist
            ? "Saved and on your watchlist"
            : isSaved
              ? "Stowed in your saved treasure"
              : "Added to your voyage watchlist"}
        </p>
      )}
    </GlassCard>
  );
}

export function ResultSkeleton() {
  return (
    <GlassCard className="animate-pulse space-y-3" aria-hidden="true">
      <div className="h-4 w-24 bg-(--glass-border) rounded" />
      <div className="h-6 w-3/4 bg-(--glass-border) rounded" />
      <div className="h-4 w-full bg-(--glass-border) rounded" />
      <div className="h-4 w-2/3 bg-(--glass-border) rounded" />
    </GlassCard>
  );
}
