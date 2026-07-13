import { AlertTriangle, CheckCircle2, Info, Rocket, RotateCw, Scaling } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  LuminaFeedCard,
  LuminaBadge,
} from "@/components/lumina/workspace";

import { cn } from "@/lib/utils";
import { RuntimeEmptyState } from "./RuntimeEmptyState";
import type { RuntimeEvent } from "@/services/runtime/types";

const KIND_ICON = {
  deploy: Rocket, restart: RotateCw, scale: Scaling, alert: AlertTriangle, health: Info,
} as const;

const SEV: Record<RuntimeEvent["severity"], string> = {
  info:    "text-cyan",
  warn:    "text-gold",
  error:   "text-rose-300",
  success: "text-emerald-300",
};

function relative(ms: number) {
  const d = Date.now() - ms;
  if (d < 60_000) return `${Math.max(1, Math.floor(d / 1000))}s`;
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}

export function RuntimeEventStream({ events, className }: { events: RuntimeEvent[]; className?: string }) {
  if (events.length === 0) return <RuntimeEmptyState variant="events" className={className} />;
  return (
    <ScrollArea className={cn("h-full", className)}>
      <ul
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex flex-col gap-2 p-3"
      >
        {events.map((e) => {
          const Icon = KIND_ICON[e.kind] ?? Info;
          return (
            <li key={e.id}>
              <LuminaFeedCard>
                <div className="anim-in flex items-start gap-4">
                  <Icon
                    className={cn("h-5 w-5 shrink-0", SEV[e.severity])}
                    strokeWidth={1.75}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium tracking-tight">
                      {e.message}
                    </div>

                    <div className="mt-2">
                      <LuminaBadge>
                        {e.kind}
                      </LuminaBadge>
                    </div>
                  </div>

                  <div className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {relative(e.at)}
                  </div>
                </div>
              </LuminaFeedCard>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}