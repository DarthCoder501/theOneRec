"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleX } from "lucide-react";
import type { Recommendation } from "@theonerec/shared";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ActionNoticeBanner, type ActionNotice } from "@/components/library/action-notice";

interface HistorySession {
  id: string;
  query: string;
  created_at: string;
  results: Recommendation[];
}

interface HistoryListProps {
  sessions: HistorySession[];
}

export function HistoryList({ sessions: initialSessions }: HistoryListProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<ActionNotice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function handleRemove(session: HistorySession) {
    setRemovingId(session.id);
    try {
      const res = await fetch(`/api/sessions/${session.id}/delete`, { method: "POST" });
      if (!res.ok) throw new Error("Delete failed");
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      setNotice({ type: "success", message: "Voyage removed from your history." });
    } catch {
      setNotice({ type: "error", message: "Could not remove this voyage. Please try again." });
    } finally {
      setRemovingId(null);
    }
  }

  if (!sessions.length) {
    return (
      <p className="text-(--text-secondary)">
        No voyages yet.{" "}
        <Link href="/" className="text-ocean-blue underline">
          Set sail
        </Link>{" "}
        to get started.
      </p>
    );
  }

  return (
    <>
      <ActionNoticeBanner notice={notice} />
      <div className="space-y-4">
        {sessions.map((s) => (
          <GlassCard key={s.id}>
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <p className="text-sm text-(--text-secondary)">
                  {new Date(s.created_at).toLocaleDateString()}
                </p>
                <p className="font-semibold text-(--text-primary) mt-1">&ldquo;{s.query}&rdquo;</p>
                <ul className="mt-2 text-sm text-(--text-secondary)">
                  {(s.results as Recommendation[]).slice(0, 3).map((r) => (
                    <li key={r.mal_id}>{r.name}</li>
                  ))}
                </ul>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemove(s)}
                disabled={removingId === s.id}
                aria-busy={removingId === s.id}
                aria-label={`Remove voyage: ${s.query}`}
                className="shrink-0 text-(--text-secondary) hover:text-pirate-red hover:border-pirate-red/50"
              >
                <CircleX className="h-4 w-4" aria-hidden="true" />
                {removingId === s.id ? "Removing..." : "Remove"}
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
