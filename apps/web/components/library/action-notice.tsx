"use client";

import { Check } from "lucide-react";

export type ActionNotice = {
  type: "success" | "error";
  message: string;
};

interface ActionNoticeBannerProps {
  notice: ActionNotice | null;
}

export function ActionNoticeBanner({ notice }: ActionNoticeBannerProps) {
  if (!notice) return null;

  return (
    <div
      role={notice.type === "error" ? "alert" : "status"}
      aria-live={notice.type === "error" ? "assertive" : "polite"}
      className={
        notice.type === "error"
          ? "rounded-xl border border-pirate-red bg-pirate-red/20 px-4 py-3 text-sm flex items-center gap-2 mb-6"
          : "rounded-xl border border-treasure-gold/40 bg-treasure-gold/10 px-4 py-3 text-sm text-treasure-gold flex items-center gap-2 mb-6"
      }
    >
      {notice.type === "success" && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {notice.message}
    </div>
  );
}
