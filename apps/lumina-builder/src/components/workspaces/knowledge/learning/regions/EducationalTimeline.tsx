import {
  CalendarClock,
  ChevronRight,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  cn,
} from "@/lib/utils";

import type {
  EducationalTimelineEvent,
} from "../model";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  LearningStatusBadge,
  flagshipAppearance,
} from "../presentation";

interface EducationalTimelineProps {
  events: EducationalTimelineEvent[];
  timelineFilter: string;
  availableFilters: string[];
  onTimelineFilterChange(
    value: string,
  ): void;
  onArtifactSelect(id: string): void;
}

const STATUS_MAP = {
  completed: "complete",
  active: "active",
  blocked: "blocked",
  "not-started": "neutral",
  "needs-review": "review",
} as const;

export function EducationalTimeline({
  events,
  timelineFilter,
  availableFilters,
  onTimelineFilterChange,
  onArtifactSelect,
}: EducationalTimelineProps) {
  return (
    <LuminaFlagshipPanel
      title="Educational Timeline"
      description="Historical recovery • Corpus admission • Curriculum approval • Versioning • Supersession • Completion • Dependency resolution • Conversation chronology"
      emphasis="strong"
      toolbar={
        <label className="block">
          <span className="sr-only">
            Filter educational timeline
          </span>

          <select
            value={timelineFilter}
            onChange={(event) => {
              onTimelineFilterChange(
                event.target.value,
              );
            }}
            style={{
              WebkitAppearance: "none",
              appearance: "none",
              colorScheme: "dark",
              backgroundColor: "rgba(2, 6, 23, 0.88)",
              backgroundImage:
                "linear-gradient(45deg, transparent 50%, rgba(125,211,252,0.9) 50%), linear-gradient(135deg, rgba(125,211,252,0.9) 50%, transparent 50%)",
              backgroundPosition:
                "calc(100% - 15px) 50%, calc(100% - 10px) 50%",
              backgroundRepeat: "no-repeat",
              backgroundSize: "5px 5px, 5px 5px",
            }}
            className={cn(
              "h-9 min-w-[11rem] rounded-xl border px-3 pr-9 text-xs",
              "border-cyan-300/30 text-sky-200/86",
              "shadow-[inset_0_1px_5px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(186,230,253,0.05)]",
              "outline-none transition-[border-color,box-shadow,background-color] duration-200",
              "hover:border-cyan-200/50",
              "focus-visible:border-cyan-200/70",
              "focus-visible:ring-2 focus-visible:ring-cyan-300/32",
              "motion-reduce:transition-none",
            )}
          >
            {availableFilters.map(
              (filter) => (
                <option
                  key={filter}
                  value={filter}
                  className="bg-slate-950 text-sky-100"
                >
                  {filter === "all"
                    ? "All timeline events"
                    : filter}
                </option>
              ),
            )}
          </select>
        </label>
      }
    >
      <div
        role="status"
        aria-live="polite"
        className="
          border-b border-cyan-300/16 px-5 py-3
          text-[10px] font-semibold uppercase
          tracking-[0.16em] text-sky-500/72
        "
      >
        {events.length} modeled educational timeline events visible
      </div>

      <div className="relative space-y-3.5 p-5">
        <div
          aria-hidden="true"
          className="
            absolute bottom-9 left-[36px] top-9 w-px
            bg-gradient-to-b
            from-cyan-300/58 via-violet-400/32 to-amber-300/12
            shadow-[0_0_12px_rgba(34,211,238,0.20)]
          "
        />

        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => {
              const artifactId =
                event.artifactIds[0];

              if (artifactId) {
                onArtifactSelect(
                  artifactId,
                );
              }
            }}
            className={cn(
              "group relative flex w-full items-start gap-4 rounded-[20px] border p-4 text-left",
              "border-cyan-300/60 ring-1 ring-inset ring-blue-400/36",
              "bg-[linear-gradient(135deg,rgba(3,12,35,0.66),rgba(15,12,42,0.56),rgba(3,14,37,0.64))]",
              "shadow-[inset_0_1px_0_rgba(186,230,253,0.07),0_0_18px_rgba(37,99,235,0.10),0_12px_30px_rgba(2,6,23,0.18)]",
              "transition-[border-color,background-color,box-shadow,transform] duration-200",
              "hover:-translate-y-0.5 hover:border-cyan-200/78 hover:ring-blue-300/52",
              "hover:bg-[linear-gradient(135deg,rgba(5,18,49,0.78),rgba(24,16,58,0.66),rgba(5,20,48,0.74))]",
              "hover:shadow-[inset_0_1px_0_rgba(186,230,253,0.08),0_16px_36px_rgba(2,6,23,0.26)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/42",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              "motion-reduce:transform-none motion-reduce:transition-none",
            )}
          >
            <div className="relative z-10 shrink-0">
              <ExecutivePremiumIcon
                icon={CalendarClock}
                state="active"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="
                    inline-flex items-center rounded-full
                    border border-violet-300/26 bg-violet-400/[0.08]
                    px-2.5 py-1 text-[10px] font-semibold
                    uppercase tracking-[0.12em] text-violet-200/84
                  "
                >
                  {event.type}
                </span>

                <LearningStatusBadge
                  tone={STATUS_MAP[event.status]}
                >
                  {event.status}
                </LearningStatusBadge>

                <span
                  className="
                    text-[10px] font-semibold uppercase
                    tracking-[0.14em] text-amber-400/76
                  "
                >
                  {event.date}
                </span>
              </div>

              <h3
                className="
                  mt-3 text-sm font-semibold tracking-[-0.01em]
                  text-sky-200
                  transition-colors duration-200
                  group-hover:text-cyan-100
                  motion-reduce:transition-none
                "
              >
                {event.label}
              </h3>

              <p className="mt-2 text-xs leading-5 text-sky-500/76">
                {event.description}
              </p>

              <div
                className={cn(
                  "mt-4 border-t border-cyan-300/12 pt-3",
                  "text-[11px] leading-5 text-sky-500/68",
                )}
              >
                <span className={flagshipAppearance.governanceLabel}>
                  Provenance
                </span>
                <span className="ml-2 text-sky-300/78">
                  {event.provenance}
                </span>
              </div>

              <div
                className="
                  mt-2 text-[10px] font-semibold uppercase
                  tracking-[0.13em] text-cyan-300/76
                "
              >
                Related artifacts: {event.artifactIds.length}
              </div>
            </div>

            <ChevronRight
              className="
                mt-1 h-4 w-4 shrink-0 text-sky-500/54
                transition-[color,transform] duration-200
                group-hover:translate-x-0.5 group-hover:text-cyan-200
                motion-reduce:transform-none motion-reduce:transition-none
              "
            />
          </button>
        ))}

        {events.length === 0 ? (
          <div
            className={cn(
              "border-dashed px-5 py-8 text-center",
              flagshipAppearance.mutedSurface,
            )}
          >
            <div className="text-sm font-semibold text-amber-500">
              No timeline events match this filter
            </div>

            <p className="mt-2 text-xs leading-5 text-sky-500/72">
              Change the timeline filter to restore the modeled educational chronology.
            </p>
          </div>
        ) : null}
      </div>
    </LuminaFlagshipPanel>
  );
}
