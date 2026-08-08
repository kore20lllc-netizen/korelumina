import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  LockKeyhole,
} from "lucide-react";

import {
  LuminaExecutiveCard,
} from "@/components/design-system/lumina";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  cn,
} from "@/lib/utils";

import type {
  EducationalModule,
} from "../model";

import {
  LearningStatusBadge,
  flagshipAppearance,
} from "../presentation";

interface EducationalProgressProps {
  modules: EducationalModule[];
  selectedModuleId: string | null;
  onModuleSelect(id: string): void;
}

const STATUS_ICON = {
  completed: CheckCircle2,
  active: Clock3,
  blocked: LockKeyhole,
  "not-started": Circle,
  "needs-review": AlertCircle,
};

const STATUS_TONE = {
  completed: "complete",
  active: "active",
  blocked: "blocked",
  "not-started": "neutral",
  "needs-review": "review",
} as const;

function premiumIconState(
  status: EducationalModule["status"],
) {
  switch (status) {
    case "completed":
      return "healthy" as const;
    case "blocked":
      return "error" as const;
    case "needs-review":
      return "warning" as const;
    default:
      return "active" as const;
  }
}

export function EducationalProgress({
  modules,
  selectedModuleId,
  onModuleSelect,
}: EducationalProgressProps) {
  return (
    <section className="group relative h-auto min-w-0 overflow-hidden rounded-[30px] border border-blue-400/70 bg-slate-950/48 shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_30px_rgba(37,99,235,.16),0_28px_160px_rgba(0,0,0,.40),inset_0_0_22px_rgba(56,189,248,.05)] ring-1 ring-inset ring-cyan-300/20 backdrop-blur-[44px] backdrop-saturate-[170%]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_2%,rgba(124,58,237,.30),transparent_36%),radial-gradient(circle_at_29%_42%,rgba(217,119,6,.17),transparent_27%),radial-gradient(circle_at_74%_64%,rgba(67,56,202,.13),transparent_30%),radial-gradient(circle_at_91%_14%,rgba(34,211,238,.035),transparent_22%),radial-gradient(circle_at_57%_86%,rgba(236,72,153,.075),transparent_18%),linear-gradient(180deg,rgba(255,255,255,.018),transparent_24%,rgba(2,6,23,.10))]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-[7%] top-0 h-px opacity-90 [background:linear-gradient(90deg,transparent_0%,rgba(96,165,250,.10)_12%,rgba(247,215,116,.42)_34%,rgba(255,255,255,.62)_50%,rgba(125,211,252,.28)_69%,rgba(59,130,246,.08)_88%,transparent_100%)] [box-shadow:0_0_22px_rgba(125,211,252,.14),0_0_40px_rgba(247,215,116,.08)]" />

      <div className="relative z-10 border-b border-white/[0.06] px-5 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/82">
          Educational Progress
        </h2>
        <p className="mt-2 max-w-4xl text-xs leading-5 text-white/48">
          Curriculum modules, dependency gates, competency objectives, coverage gaps and unresolved conflicts
        </p>
      </div>
      <div className="grid gap-3 p-4">
        {modules.map((module) => {
          const Icon =
            STATUS_ICON[module.status];

          const selected =
            module.id === selectedModuleId;

          return (
            <LuminaExecutiveCard
              key={module.id}
              as="button"
              interactive
              selected={selected}
              onClick={() => {
                onModuleSelect(module.id);
              }}
              className="p-4"
              bodyClassName="gap-0"
            >
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-x-5 top-0 h-px",
                  selected
                    ? "bg-gradient-to-r from-transparent via-cyan-200/66 to-transparent"
                    : flagshipAppearance.cardHighlight,
                )}
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div
                    className={cn(
                      "mt-0.5 shrink-0",
                      module.status === "not-started"
                        ? "opacity-58"
                        : "",
                    )}
                  >
                    <ExecutivePremiumIcon
                      icon={Icon}
                      state={premiumIconState(
                        module.status,
                      )}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={cn(
                          "text-sm font-semibold",
                          selected
                            ? "text-amber-400"
                            : "text-sky-200",
                        )}
                      >
                        {module.title}
                      </h3>

                      <LearningStatusBadge
                        tone={
                          STATUS_TONE[
                            module.status
                          ]
                        }
                      >
                        {module.status}
                      </LearningStatusBadge>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-sky-500/76">
                      {module.description}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "text-2xl font-semibold tracking-[-0.03em]",
                    selected
                      ? "text-cyan-100"
                      : "text-sky-200",
                  )}
                >
                  {module.completion}%
                </div>
              </div>

              <div
                className="
                  relative mt-4 h-2.5 overflow-hidden rounded-full
                  border border-cyan-200/24 bg-slate-950/72
                  shadow-[inset_0_1px_5px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(186,230,253,0.05)]
                "
              >
                <div
                  aria-hidden="true"
                  className="
                    absolute inset-0
                    bg-[linear-gradient(90deg,rgba(255,255,255,0.025),transparent_45%,rgba(255,255,255,0.02))]
                  "
                />

                <div
                  className={cn(
                    "relative h-full rounded-full",
                    "transition-[width] duration-500 motion-reduce:transition-none",
                    module.status === "completed"
                      ? [
                          "bg-[linear-gradient(90deg,#22d3ee_0%,#60a5fa_38%,#a78bfa_68%,#fbbf24_100%)]",
                          "shadow-[0_0_8px_rgba(34,211,238,0.80),0_0_18px_rgba(139,92,246,0.44)]",
                        ].join(" ")
                      : module.status === "active"
                        ? [
                            "bg-[linear-gradient(90deg,#38bdf8_0%,#6366f1_48%,#c084fc_76%,#f59e0b_100%)]",
                            "shadow-[0_0_8px_rgba(56,189,248,0.74),0_0_16px_rgba(99,102,241,0.42)]",
                          ].join(" ")
                        : module.status === "blocked"
                          ? [
                              "bg-[linear-gradient(90deg,#fb7185_0%,#f97316_52%,#fbbf24_100%)]",
                              "shadow-[0_0_8px_rgba(251,113,133,0.66),0_0_16px_rgba(249,115,22,0.34)]",
                            ].join(" ")
                          : module.status === "needs-review"
                            ? [
                                "bg-[linear-gradient(90deg,#f59e0b_0%,#fbbf24_48%,#c084fc_100%)]",
                                "shadow-[0_0_8px_rgba(245,158,11,0.70),0_0_16px_rgba(192,132,252,0.32)]",
                              ].join(" ")
                            : [
                                "bg-[linear-gradient(90deg,#475569_0%,#64748b_100%)]",
                                "shadow-[0_0_8px_rgba(100,116,139,0.38)]",
                              ].join(" "),
                  )}
                  style={{
                    width: `${module.completion}%`,
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="
                      absolute inset-x-1 top-px h-px rounded-full
                      bg-white/52
                    "
                  />
                </div>
              </div>

              <div className="relative mt-4 flex flex-wrap gap-2">
                {module.competencyObjectives.map(
                  (objective) => (
                    <span
                      key={objective}
                      className="
                        inline-flex items-center rounded-full
                        border border-violet-300/24
                        bg-violet-400/[0.07]
                        px-2.5 py-1
                        text-[10px] font-medium
                        text-violet-200/84
                      "
                    >
                      {objective}
                    </span>
                  ),
                )}
              </div>

              {selected && (
                <div
                  className="
                    relative mt-4 grid gap-4
                    border-t border-cyan-300/14 pt-4
                    sm:grid-cols-2
                  "
                >
                  <div
                    className="
                      rounded-[18px] border border-blue-400/56
                      bg-slate-950/34 p-3
                      ring-1 ring-inset ring-cyan-300/14
                      shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
                    "
                  >
                    <div className={flagshipAppearance.governanceLabel}>
                      Dependency gates
                    </div>

                    <div className="mt-2 text-xs leading-5 text-sky-300/82">
                      {module.dependencyIds.length === 0
                        ? "No prerequisite modules"
                        : module.dependencyIds.join(" • ")}
                    </div>
                  </div>

                  <div
                    className="
                      rounded-[18px] border border-blue-400/56
                      bg-slate-950/34 p-3
                      ring-1 ring-inset ring-cyan-300/14
                      shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
                    "
                  >
                    <div className={flagshipAppearance.governanceLabel}>
                      Current gap
                    </div>

                    <div className="mt-2 text-xs leading-5 text-sky-300/82">
                      {module.conflict ??
                        module.coverageGap ??
                        "No unresolved gap"}
                    </div>
                  </div>
                </div>
              )}
            </LuminaExecutiveCard>
          );
        })}

        {modules.length === 0 ? (
          <div
            className="
              rounded-[18px] border border-dashed border-blue-400/56
              bg-slate-950/34 px-5 py-8 text-center
              ring-1 ring-inset ring-cyan-300/14
              shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
            "
          >
            <div className="text-sm font-semibold text-amber-500">
              No educational modules available
            </div>

            <p className="mt-2 text-xs leading-5 text-sky-500/72">
              The modeled curriculum does not currently expose progress modules.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
