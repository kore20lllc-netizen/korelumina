import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Pause,
  Play,
} from "lucide-react";

import { LuminaButton } from "@/components/lumina/LuminaButton";
import {
  LuminaBadge,
  LuminaFeedCard,
  LuminaPanelHeader,
} from "@/components/lumina/workspace";
import {
  LuminaSegmentedControl,
  type LuminaSegmentOption,
} from "@/components/lumina/LuminaSegmentedControl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { RuntimeEmptyState } from "./RuntimeEmptyState";

import type {
  LogEntry,
  LogLevel,
} from "@/services/runtime/types";

const LEVELS: LogLevel[] = [
  "debug",
  "info",
  "warn",
  "error",
];

const LEVEL_OPTIONS: LuminaSegmentOption<LogLevel>[] = [
  {
    value: "debug",
    label: "Debug",
    dotClassName: "bg-muted-foreground",
  },
  {
    value: "info",
    label: "Info",
    dotClassName: "bg-cyan",
  },
  {
    value: "warn",
    label: "Warn",
    dotClassName: "bg-gold",
  },
  {
    value: "error",
    label: "Error",
    dotClassName: "bg-rose-400",
  },
];

const LEVEL_BADGE: Record<LogLevel, string> = {
  debug:
    "border-white/10 bg-white/[0.04] text-muted-foreground",
  info:
    "border-cyan/25 bg-cyan/10 text-cyan",
  warn:
    "border-gold/25 bg-gold/10 text-gold",
  error:
    "border-rose-400/25 bg-rose-500/10 text-rose-300",
};

function fmtTime(ms: number) {
  const d = new Date(ms);

  return `${d.toLocaleTimeString([], {
    hour12: false,
  })}.${d
    .getMilliseconds()
    .toString()
    .padStart(3, "0")}`;
}

export function RuntimeLogsPanel({
  logs,
  className,
}: {
  logs: LogEntry[];
  className?: string;
}) {
  const [level, setLevel] =
    useState<LogLevel>("debug");

  const [follow, setFollow] =
    useState(true);

  const bottomRef =
    useRef<HTMLDivElement>(null);

  const minIdx = LEVELS.indexOf(level);

  const filtered = logs.filter(
    (entry) =>
      LEVELS.indexOf(entry.level) >= minIdx,
  );

  useEffect(() => {
    if (!follow) {
      return;
    }

    bottomRef.current?.scrollIntoView({
      block: "end",
    });
  }, [logs, follow]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col",
        "bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,.08),transparent_30%)]",
        className,
      )}
    >
      <LuminaPanelHeader
        title="Runtime Logs"
        subtitle={`${filtered.length} visible · ${logs.length} total`}
        trailing={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <LuminaSegmentedControl
            value={level}
            onValueChange={setLevel}
            aria-label="Log level"
            options={LEVEL_OPTIONS}
          />

          <LuminaButton
            variant="glow"
            size="sm"
            onClick={() =>
              setFollow((current) => !current)
            }
            aria-pressed={follow}
            aria-label={
              follow
                ? "Pause tail"
                : "Follow tail"
            }
            title={
              follow
                ? "Pause tail (L)"
                : "Follow tail (L)"
            }
          >
            {follow ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}

            <span className="text-[11px]">
              {follow
                ? "Following"
                : "Paused"}
            </span>

            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                follow
                  ? "rotate-0"
                  : "-rotate-90",
              )}
            />
          </LuminaButton>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <RuntimeEmptyState
          variant="logs"
          className="flex-1"
        />
      ) : (
        <ScrollArea className="flex-1">
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="space-y-1.5 px-3 py-3 font-mono text-[11.5px] leading-relaxed"
          >
            {[...filtered].reverse().map((entry) => (
              <LuminaFeedCard
                key={entry.id}
                className="px-3 py-2"
              >
                <div
                  className={cn(
                    "grid grid-cols-[auto,auto,auto,1fr] gap-3",
                  )}
                >
                <span className="tabular-nums text-muted-foreground/70">
                  {fmtTime(entry.at)}
                </span>

                <LuminaBadge
                  className={LEVEL_BADGE[entry.level]}
                >
                  {entry.level}
                </LuminaBadge>

                <span className="text-muted-foreground/80">
                  {entry.source}
                </span>

                <span className="truncate font-medium text-foreground/95">
                  {entry.message}
                </span>
                </div>
              </LuminaFeedCard>
            ))}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
