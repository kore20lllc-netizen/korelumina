import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  LockKeyhole,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  cn,
} from "@/lib/utils";

import type {
  CompetencyObjective,
} from "../model";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  LuminaFlagshipSurface,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipSurface";

import {
  LearningStatusBadge,
  flagshipAppearance,
} from "../presentation";

interface CompetencyPostureProps {
  competencies: CompetencyObjective[];
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
  status: CompetencyObjective["status"],
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

function statusGlow(
  status: CompetencyObjective["status"],
) {
  switch (status) {
    case "completed":
      return "from-emerald-300/10";
    case "blocked":
      return "from-rose-300/10";
    case "needs-review":
      return "from-amber-300/10";
    case "active":
      return "from-cyan-300/10";
    default:
      return "from-sky-300/[0.06]";
  }
}

export function CompetencyPosture({
  competencies,
}: CompetencyPostureProps) {
  return (
    <LuminaFlagshipPanel
      title="Initial Competency Posture"
      description="Constitutional competency expectations represented without certification or activation logic"
      emphasis="strong"
    >
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {competencies.map((competency) => {
          const Icon =
            STATUS_ICON[competency.status];

          const glow =
            statusGlow(
              competency.status,
            );

          return (
            <LuminaFlagshipCard
              key={competency.id}
              interactive
              className="group relative p-4"
            >

              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0",
                  "bg-gradient-to-br to-transparent via-transparent",
                  glow,
                  "opacity-0 transition-opacity duration-200",
                  "group-hover:opacity-100",
                  "motion-reduce:transition-none",
                )}
              />

              <div className="relative flex items-start gap-3">
                <div
                  className={cn(
                    "shrink-0",
                    competency.status === "not-started"
                      ? "opacity-58"
                      : "",
                  )}
                >
                  <ExecutivePremiumIcon
                    icon={Icon}
                    state={premiumIconState(
                      competency.status,
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-sky-200">
                      {competency.title}
                    </h3>

                    <LearningStatusBadge
                      tone={
                        STATUS_TONE[
                          competency.status
                        ]
                      }
                    >
                      {competency.status}
                    </LearningStatusBadge>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-sky-500/76">
                    {competency.description}
                  </p>

                  <div
                    className={cn(
                      "mt-3 rounded-xl border px-3 py-2.5",
                      "border-blue-400/56 bg-slate-950/34",
                      "ring-1 ring-inset ring-cyan-300/14",
                      "text-[11px] leading-5 text-sky-300/72",
                      "shadow-[inset_0_1px_5px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]",
                    )}
                  >
                    <div
                      className="
                        mb-1 text-[9px] font-semibold uppercase
                        tracking-[0.15em] text-violet-300/72
                      "
                    >
                      Evidence
                    </div>

                    {competency.evidence}
                  </div>
                </div>
              </div>
            </LuminaFlagshipCard>
          );
        })}

        {competencies.length === 0 ? (
          <LuminaFlagshipSurface
            dashed
            className="
              px-5 py-8 text-center md:col-span-2
              shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
            "
          >
            <div className="text-sm font-semibold text-amber-500">
              No competency objectives available
            </div>

            <p className="mt-2 text-xs leading-5 text-sky-500/72">
              The modeled educational state does not currently expose competency evidence.
            </p>
          </LuminaFlagshipSurface>
        ) : null}
      </div>
    </LuminaFlagshipPanel>
  );
}
