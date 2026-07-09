"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleX, ExternalLink, PlayCircle, CheckCircle2, Compass } from "lucide-react";
import type { WatchlistItem, WatchlistStatus } from "@theonerec/shared";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { malUrl, cn } from "@/lib/utils";
import { ActionNoticeBanner, type ActionNotice } from "@/components/library/action-notice";

interface WatchlistListProps {
  items: WatchlistItem[];
}

const STATUS_CONFIG: Record<WatchlistStatus, { label: string; className: string }> = {
  planned: {
    label: "Plan to watch",
    className: "border-ocean-blue/40 bg-ocean-blue/15 text-ocean-blue",
  },
  watching: {
    label: "Watching",
    className: "border-treasure-gold/40 bg-treasure-gold/15 text-treasure-gold",
  },
  finished: {
    label: "Finished",
    className: "border-pirate-red/30 bg-pirate-red/10 text-(--text-primary)",
  },
};

export function WatchlistList({ items: initialItems }: WatchlistListProps) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function updateStatus(item: WatchlistItem, status: WatchlistStatus) {
    if (item.status === status) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/watchlist/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status, watched: status === "finished" } : i))
      );
      const labels: Record<WatchlistStatus, string> = {
        planned: "moved back to plan to watch",
        watching: "marked as watching",
        finished: "marked as finished",
      };
      setNotice({ type: "success", message: `${item.name} ${labels[status]}.` });
    } catch {
      setNotice({ type: "error", message: `Could not update ${item.name}. Please try again.` });
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(item: WatchlistItem) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/watchlist/${item.id}/remove`, { method: "POST" });
      if (!res.ok) throw new Error("Remove failed");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setNotice({ type: "success", message: `${item.name} removed from your watchlist.` });
    } catch {
      setNotice({ type: "error", message: `Could not remove ${item.name}. Please try again.` });
    } finally {
      setBusyId(null);
    }
  }

  if (!items.length) {
    return (
      <p className="text-(--text-secondary)">
        Your watchlist is empty.{" "}
        <Link href="/" className="text-ocean-blue underline">
          Add anime from recommendations
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <ActionNoticeBanner notice={notice} />
      <ol className="space-y-3">
        {items.map((item, i) => {
          const status = item.status ?? (item.watched ? "finished" : "planned");
          const statusStyle = STATUS_CONFIG[status];
          const isBusy = busyId === item.id;

          return (
            <li key={item.id}>
              <GlassCard className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <span className="text-treasure-gold font-bold w-8 shrink-0 pt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-(--text-primary)">{item.name}</h2>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            statusStyle.className
                          )}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-(--text-secondary) mt-1">{item.notes}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="shrink-0">
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
                </div>

                <div
                  className="flex flex-wrap gap-2 pt-2 border-t border-(--glass-border)"
                  role="group"
                  aria-label={`Watch status for ${item.name}`}
                >
                  <Button
                    variant={status === "planned" ? "secondary" : "outline"}
                    size="sm"
                    disabled={isBusy || status === "planned"}
                    aria-pressed={status === "planned"}
                    onClick={() => updateStatus(item, "planned")}
                  >
                    <Compass className="h-4 w-4" aria-hidden="true" />
                    Plan to watch
                  </Button>
                  <Button
                    variant={status === "watching" ? "secondary" : "outline"}
                    size="sm"
                    disabled={isBusy || status === "watching"}
                    aria-pressed={status === "watching"}
                    onClick={() => updateStatus(item, "watching")}
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden="true" />
                    Watching
                  </Button>
                  <Button
                    variant={status === "finished" ? "secondary" : "outline"}
                    size="sm"
                    disabled={isBusy || status === "finished"}
                    aria-pressed={status === "finished"}
                    onClick={() => updateStatus(item, "finished")}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Finished
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    aria-busy={isBusy}
                    onClick={() => handleRemove(item)}
                    aria-label={`Remove ${item.name} from watchlist`}
                    className="text-(--text-secondary) hover:text-pirate-red hover:border-pirate-red/50 ml-auto"
                  >
                    <CircleX className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </GlassCard>
            </li>
          );
        })}
      </ol>
    </>
  );
}
