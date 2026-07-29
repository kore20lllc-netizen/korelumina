import {
  AlertTriangle,
  Info,
  Rocket,
  RotateCw,
  Scaling,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";

import {
  LuminaBadge,
  LuminaFeedCard,
  LuminaStatusBadge,
} from "@/components/lumina/workspace";

import { cn } from "@/lib/utils";

import {
  RuntimeEmptyState,
} from "./RuntimeEmptyState";

import type {
  RuntimeEvent,
} from "@/services/runtime/types";

const KIND_ICON = {
  deploy: Rocket,
  restart: RotateCw,
  scale: Scaling,
  alert: AlertTriangle,
  health: Info,
} as const;

const KIND_LABEL = {
  deploy: "Deployment",
  restart: "Restart",
  scale: "Scaling",
  alert: "Alert",
  health: "Health",
} as const;

const SEVERITY_STATUS = {
  success: "healthy",
  info: "healthy",
  warn: "degraded",
  error: "critical",
} as const;

const ICON_CLASS = {
  success: "text-emerald-300",
  info: "text-cyan",
  warn: "text-gold",
  error: "text-rose-300",
} as const;

function relative(ms: number) {
  const d = Date.now() - ms;

  if (d < 60_000) {
    return `${Math.max(1, Math.floor(d / 1000))} sec ago`;
  }

  if (d < 3_600_000) {
    return `${Math.floor(d / 60_000)} min ago`;
  }

  if (d < 86_400_000) {
    return `${Math.floor(d / 3_600_000)} hr ago`;
  }

  return `${Math.floor(d / 86_400_000)} day`;
}

export interface RuntimeEventStreamProps {
  events: RuntimeEvent[];
  className?: string;
}

export function RuntimeEventStream({
  events,
  className,
}: RuntimeEventStreamProps) {
  if (events.length === 0) {
    return (
      <RuntimeEmptyState
        variant="events"
        className={className}
      />
    );
  }

  return (
    <ScrollArea
      className={cn(
        "h-full",
        className,
      )}
    >
      <ul
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="space-y-3 p-4"
      >
        {events.map((event) => {
          const Icon =
            KIND_ICON[event.kind] ?? Info;

          return (
            <li key={event.id}>
              <LuminaFeedCard className="overflow-hidden">
                <div className="space-y-4">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex min-w-0 items-start gap-4">

                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                          "border",
                          "[border-color:var(--lumina-border-standard)]",
                          "[background:var(--lumina-surface-interactive)]",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            ICON_CLASS[event.severity],
                          )}
                        />
                      </div>

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <div className="text-sm font-semibold tracking-tight">
                            {KIND_LABEL[event.kind]}
                          </div>

                          <LuminaBadge>
                            {event.kind}
                          </LuminaBadge>

                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {event.projectId}
                        </div>

                      </div>

                    </div>

                    <div className="flex flex-col items-end gap-2">

                      <LuminaStatusBadge
                        status={
                          SEVERITY_STATUS[
                            event.severity
                          ]
                        }
                      />

                      <div className="text-[11px] tabular-nums text-muted-foreground">
                        {relative(event.at)}
                      </div>

                    </div>

                  </div>

                  <div className="rounded-xl border px-4 py-3 [border-color:var(--lumina-border-standard)] [background:var(--lumina-surface-compact)]">
                    <div className="text-[13px] leading-6 text-foreground">
                      {event.message}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">

                    <div>
                      <div className="uppercase tracking-[0.18em] text-muted-foreground">
                        Source
                      </div>

                      <div className="mt-1 font-medium">
                        Runtime
                      </div>
                    </div>

                    <div>
                      <div className="uppercase tracking-[0.18em] text-muted-foreground">
                        Severity
                      </div>

                      <div className="mt-1 font-medium capitalize">
                        {event.severity}
                      </div>
                    </div>

                    <div>
                      <div className="uppercase tracking-[0.18em] text-muted-foreground">
                        Status
                      </div>

                      <div className="mt-1 font-medium">
                        Active
                      </div>
                    </div>

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

export default RuntimeEventStream;
