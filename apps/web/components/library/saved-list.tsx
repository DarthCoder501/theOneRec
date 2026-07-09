"use client";

import { useEffect, useState } from "react";
import { CircleX, ExternalLink } from "lucide-react";
import type { SavedAnime } from "@theonerec/shared";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { malUrl } from "@/lib/utils";
import { ActionNoticeBanner, type ActionNotice } from "@/components/library/action-notice";

interface SavedListProps {
  items: SavedAnime[];
}

export function SavedList({ items: initialItems }: SavedListProps) {
  const [items, setItems] = useState(initialItems);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function handleRemove(item: SavedAnime) {
    setRemovingId(item.id);
    try {
      const res = await fetch(`/api/saved/${item.id}/remove`, { method: "POST" });
      if (!res.ok) throw new Error("Remove failed");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setNotice({ type: "success", message: `${item.name} removed from saved treasures.` });
    } catch {
      setNotice({ type: "error", message: `Could not remove ${item.name}. Please try again.` });
    } finally {
      setRemovingId(null);
    }
  }

  if (!items.length) {
    return <p className="text-(--text-secondary)">No saved anime yet.</p>;
  }

  return (
    <>
      <ActionNoticeBanner notice={notice} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <GlassCard key={item.id} className="flex flex-col gap-3">
            <div className="flex-1">
              <h2 className="font-bold text-(--text-primary)">{item.name}</h2>
              <p className="text-sm text-(--text-secondary) capitalize mt-1">{item.genres}</p>
              <p className="text-sm text-treasure-gold mt-1">Score: {item.score}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-(--glass-border)">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={malUrl(item.mal_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${item.name} on MyAnimeList (opens in new tab)`}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  MAL
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemove(item)}
                disabled={removingId === item.id}
                aria-busy={removingId === item.id}
                aria-label={`Remove ${item.name} from saved treasures`}
                className="text-(--text-secondary) hover:text-pirate-red hover:border-pirate-red/50"
              >
                <CircleX className="h-4 w-4" aria-hidden="true" />
                {removingId === item.id ? "Removing..." : "Remove"}
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
