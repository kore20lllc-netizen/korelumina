import {
  useEffect,
  useState,
} from "react";

import { runtimeRead } from "@/services/runtime/runtimeReadQueue";
import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

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
  LuminaBadge,
} from "@/components/lumina/workspace/primitives/LuminaBadge";

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

const STATUS_VARIANT = {
  completed: "complete",
  active: "active",
  blocked: "blocked",
  "not-started": "muted",
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

/*
 * UI-1: competency status and evidence come from the certified Initial
 * Competency assessment (GET /api/knowledge/education/initial-competency)
 * and its certification. The contract list supplies titles and
 * descriptions only; no status is shown that the Runtime did not report.
 */

type AssessedCompetency = {
  id: string;
  title?: string;
  status?: string;
  evidence?: string;
};

type Assessment =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ok";
      competencies: AssessedCompetency[];
      certification: string;
    };

const KNOWN_STATUSES = new Set<CompetencyObjective["status"]>([
  "completed",
  "active",
  "blocked",
  "not-started",
  "needs-review",
]);

function useCertifiedAssessment(): Assessment {
  const [assessment, setAssessment] = useState<Assessment>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const read = async (path: string) => {
      const response = await runtimeRead(`${RUNTIME_API}${path}`, {
        cache: "no-store",
        headers: getRuntimeCallerHeaders(),
      });
      if (!response.ok) throw new Error(`Runtime answered ${response.status}`);
      return response.json();
    };

    void (async () => {
      try {
        const [assessed, certification] = await Promise.all([
          read("/api/knowledge/education/initial-competency"),
          read("/api/knowledge/education/initial-competency/certification"),
        ]);
        if (!cancelled) {
          setAssessment({
            status: "ok",
            competencies: Array.isArray(assessed?.assessment?.competencies)
              ? assessed.assessment.competencies
              : [],
            certification: String(certification?.projection?.state ?? "UNKNOWN"),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setAssessment({
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return assessment;
}

export function CompetencyPosture({
  competencies: contract,
}: CompetencyPostureProps) {
  const assessment = useCertifiedAssessment();

  const competencies: CompetencyObjective[] =
    assessment.status === "ok"
      ? assessment.competencies.map((assessed) => {
          const known = contract.find((c) => c.id === assessed.id);
          const status = KNOWN_STATUSES.has(assessed.status as CompetencyObjective["status"])
            ? (assessed.status as CompetencyObjective["status"])
            : "needs-review";
          return {
            id: assessed.id,
            title: known?.title ?? assessed.title ?? assessed.id,
            description: known?.description ?? "",
            status,
            evidence: /^(competency-evidence|initial-competency):/.test(assessed.evidence ?? "")
              ? "Validated evidence record on file."
              : assessed.evidence ?? "",
          };
        })
      : [];

  const rawEvidence = new Map(
    assessment.status === "ok"
      ? assessment.competencies.map((assessed) => [assessed.id, assessed.evidence ?? ""] as const)
      : [],
  );

  const description =
    assessment.status === "loading"
      ? "Reading the certified Initial Competency assessment from the Runtime."
      : assessment.status === "error"
        ? `The Runtime could not be read (${assessment.message}). Nothing is shown rather than a guess.`
        : `Certified assessment from the Runtime. Certification: ${assessment.certification.toLowerCase()}. ${competencies.filter((c) => c.status === "completed").length} of ${competencies.length} competencies completed.`;

  return (
    <LuminaFlagshipPanel
      title="Initial Competency Posture"
      description={description}
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

                    <LuminaBadge
                      variant={
                        STATUS_VARIANT[
                          competency.status
                        ]
                      }
                      className="min-h-7 text-[11px] leading-none"
                    >
                      {competency.status}
                    </LuminaBadge>
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

                    <span title={rawEvidence.get(competency.id) || undefined}>
                      {competency.evidence}
                    </span>
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
              {assessment.status === "loading" ? "Checking the certified assessment" : "No competencies reported"}
            </div>

            <p className="mt-2 text-xs leading-5 text-sky-500/72">
              {assessment.status === "loading"
                ? "Waiting for the Runtime to answer."
                : "The Runtime did not report a certified Initial Competency assessment."}
            </p>
          </LuminaFlagshipSurface>
        ) : null}
      </div>
    </LuminaFlagshipPanel>
  );
}
