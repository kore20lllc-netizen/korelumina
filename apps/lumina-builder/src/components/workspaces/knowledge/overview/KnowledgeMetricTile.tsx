import type { LucideIcon } from "lucide-react";

import { GlowCard } from "@/components/lumina/GlowCard";
import { cn } from "@/lib/utils";

export interface KnowledgeMetricTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "violet" | "magenta" | "cyan" | "gold";
  className?: string;
}

export function KnowledgeMetricTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = "violet",
  className,
}: KnowledgeMetricTileProps) {
  return (
    <GlowCard
      accent={accent}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,.18)]",
        className,
      )}
    >
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </div>

          <div className="mt-2 font-display text-3xl font-semibold tracking-tight tabular-nums md:text-[34px]">
            {value}
          </div>

          {hint && (
            <div className="mt-2 truncate text-[11px] text-muted-foreground">
              {hint}
            </div>
          )}
        </div>

        {Icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,.12)]">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        )}
      </div>
    </GlowCard>
  );
}
