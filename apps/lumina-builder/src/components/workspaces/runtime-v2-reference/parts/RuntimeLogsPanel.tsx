import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ChevronDown,
  Pause,
  Play,
} from "lucide-react";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaBadge,
  LuminaFeedCard,
} from "@/components/lumina/workspace";

import {
  LuminaSegmentedControl,
  type LuminaSegmentOption,
} from "@/components/lumina/LuminaSegmentedControl";

import {
  cn,
} from "@/lib/utils";

import type {
  LogEntry,
  LogLevel,
} from "@/services/runtime/types";

import {
  RuntimeEmptyState,
} from "./RuntimeEmptyState";

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

const LEVEL_BADGE: Record<
  LogLevel,
  string
> = {
  debug: [
    "border",
    "[border-color:var(--lumina-border-standard)]",
    "[background:var(--lumina-surface-compact)]",
    "text-muted-foreground",
  ].join(" "),

  info: [
    "border",
    "[border-color:hsl(var(--cyan)/0.28)]",
    "[background:hsl(var(--cyan)/0.10)]",
    "text-cyan",
  ].join(" "),

  warn: [
    "border",
    "[border-color:hsl(var(--gold)/0.28)]",
    "[background:hsl(var(--gold)/0.10)]",
    "text-gold",
  ].join(" "),

  error: [
    "border",
    "[border-color:hsl(var(--destructive)/0.30)]",
    "[background:hsl(var(--destructive)/0.12)]",
    "text-rose-300",
  ].join(" "),
};

function formatTime(
  timestamp: number,
): string {
  const date =
    new Date(timestamp);

  return `${date.toLocaleTimeString([], {
    hour12: false,
  })}.${date
    .getMilliseconds()
    .toString()
    .padStart(3, "0")}`;
}

export interface RuntimeLogsPanelProps {
  logs: LogEntry[];
  className?: string;
}

export function RuntimeLogsPanel({
  logs,
  className,
}: RuntimeLogsPanelProps) {
  const [
    level,
    setLevel,
  ] = useState<LogLevel>(
    "debug",
  );

  const [
    follow,
    setFollow,
  ] = useState(true);

  const viewportRef =
    useRef<HTMLDivElement>(
      null,
    );

  const filteredLogs =
    useMemo(() => {
      const minimumLevelIndex =
        LEVELS.indexOf(level);

      return logs.filter(
        (entry) =>
          LEVELS.indexOf(
            entry.level,
          ) >=
          minimumLevelIndex,
      );
    }, [
      level,
      logs,
    ]);

  useEffect(() => {
    if (!follow) {
      return;
    }

    const viewport =
      viewportRef.current;

    if (!viewport) {
      return;
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          viewport.scrollTop =
            viewport.scrollHeight;
        },
      );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );
    };
  }, [
    filteredLogs,
    follow,
  ]);

  return (
    <section
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
        "[background:var(--lumina-surface-panel)]",
        className,
      )}
      aria-label="Runtime logs"
    >
      <header
        className={cn(
          "shrink-0 border-b px-4 py-4",
          "[border-color:var(--lumina-border-standard)]",
          "[background:var(--lumina-surface-compact)]",
          "[backdrop-filter:var(--lumina-blur-surface)]",
        )}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-tight text-foreground">
                Runtime Logs
              </h3>

              <p className="mt-1 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                {filteredLogs.length} visible
                {" · "}
                {logs.length} total
              </p>
            </div>

            <LuminaButton
              variant="glow"
              size="sm"
              onClick={() =>
                setFollow(
                  (current) =>
                    !current,
                )
              }
              aria-pressed={follow}
              aria-label={
                follow
                  ? "Pause log following"
                  : "Resume log following"
              }
              title={
                follow
                  ? "Pause log following"
                  : "Resume log following"
              }
              className="shrink-0"
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
                  !follow &&
                    "-rotate-90",
                )}
              />
            </LuminaButton>
          </div>

          <div className="min-w-0 overflow-x-auto pb-1">
            <LuminaSegmentedControl
              value={level}
              onValueChange={
                setLevel
              }
              aria-label="Minimum log level"
              options={
                LEVEL_OPTIONS
              }
            />
          </div>
        </div>
      </header>

      {filteredLogs.length === 0 ? (
        <RuntimeEmptyState
          variant="logs"
          className="min-h-0 flex-1"
        />
      ) : (
        <div
          ref={viewportRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div
            role="log"
            aria-live={
              follow
                ? "polite"
                : "off"
            }
            aria-relevant="additions"
            className="space-y-1.5 px-3 py-3 font-mono text-[11.5px] leading-relaxed"
          >
            {filteredLogs.map(
              (entry) => (
                <LuminaFeedCard
                  key={entry.id}
                  className="px-3 py-2"
                >
                  <div className="grid min-w-0 grid-cols-[auto,auto,minmax(0,auto),minmax(0,1fr)] items-start gap-3">
                    <span className="whitespace-nowrap tabular-nums text-muted-foreground/70">
                      {formatTime(
                        entry.at,
                      )}
                    </span>

                    <LuminaBadge
                      className={
                        LEVEL_BADGE[
                          entry.level
                        ]
                      }
                    >
                      {entry.level}
                    </LuminaBadge>

                    <span className="max-w-32 truncate text-muted-foreground/80">
                      {entry.source}
                    </span>

                    <span className="min-w-0 break-words font-medium text-foreground/95">
                      {entry.message}
                    </span>
                  </div>
                </LuminaFeedCard>
              ),
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default RuntimeLogsPanel;
