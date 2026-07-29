import { Hammer, PlayCircle, CheckCircle2, PauseCircle, StopCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  LuminaTimelineCard,
} from "@/components/lumina/workspace";

import { cn } from "@/lib/utils";
import { RuntimeEmptyState } from "./RuntimeEmptyState";
import type { LifecycleEvent } from "@/services/runtime/types";

const PHASE_ICON = {
  build: Hammer, boot: PlayCircle, ready: CheckCircle2, drain: PauseCircle, stop: StopCircle,
} as const;

const PHASE_COLOR = {
  build: "text-cyan", boot: "text-violet", ready: "text-emerald-300", drain: "text-gold", stop: "text-rose-300",
} as const;

function fmtTime(ms: number) { return new Date(ms).
toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }); }
function fmtDur(ms?: number) { if (!ms) return null; if (ms < 1000) return `${ms}ms`; return `${(ms / 1000).toFixed(1)}s`; }

export function RuntimeLifecycleTimeline({ events, className }: { events: LifecycleEvent[]; className?: string }) {
  if (events.length === 0) return <RuntimeEmptyState variant="events" className={className} />;
  const sorted = [...events].sort((a, b) => b.at - a.at);
  return (
    <ScrollArea className={cn("h-full", className)}>
      <ol className="relative px-6 py-5 space-y-3">
        <span aria-hidden className="absolute left-[18px] top-6 bottom-6 w-px bg-gradient-to-b from-cyan/40 via-violet/30 to-transparent" />
        {sorted.map((e) => {
          const Icon = PHASE_ICON[e.phase];
          return (
            <li key={e.id} className="relative pb-5 last:pb-0">
              <LuminaTimelineCard
                className="ml-12"
                icon={
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center",
                      PHASE_COLOR[e.phase],
                    )}
                  >
                    <Icon
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                  </span>
                }
                title={e.label}
                subtitle={
                  <>
                    {fmtTime(e.at)}
                    {fmtDur(e.durationMs) && (
                      <> · {fmtDur(e.durationMs)}</>
                    )}
                  </>
                }
              />
            </li>
          );
        })}
      </ol>
    </ScrollArea>
  );
}