"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
}

export function GlassCard({ className, animated = true, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-panel p-6",
        animated && "glass-panel-animated",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
