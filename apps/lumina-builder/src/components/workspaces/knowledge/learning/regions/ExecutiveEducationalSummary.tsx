import {
  BadgeCheck,
  BookOpenCheck,
  GitBranch,
  MessagesSquare,
  Network,
  ShieldCheck,
  Target,
  TriangleAlert,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  LuminaMetricCard,
  LuminaMetricGrid,
  LuminaStatusBadge,
} from "@/components/lumina/workspace";

import type {
  ExecutiveEducationalSummaryViewModel,
} from "../model";

interface ExecutiveEducationalSummaryProps {
  summary: ExecutiveEducationalSummaryViewModel;
}

const metricSurface =
  "rounded-[22px] border border-cyan-300/32 bg-[linear-gradient(135deg,rgba(3,12,35,0.62),rgba(17,10,45,0.56),rgba(3,14,37,0.60))] p-0 ring-1 ring-inset ring-cyan-100/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(2,6,23,0.18)]";

export function ExecutiveEducationalSummary({
  summary,
}: ExecutiveEducationalSummaryProps) {
  return (
    <section
      aria-labelledby="executive-educational-summary"
      className="flex h-full flex-col gap-6"
    >
      <div
        className="
          flex flex-col gap-5
          border-b border-cyan-300/18 pb-6
          lg:flex-row lg:items-end lg:justify-between
        "
      >
        <div className="min-w-0">
          <div
            id="executive-educational-summary"
            className="
              text-[10px] font-semibold uppercase
              tracking-[0.2em] text-cyan-300/82
            "
          >
            Executive educational posture
          </div>

          <h2
            className="
              mt-2 text-2xl font-semibold
              tracking-[-0.03em] text-amber-500
              drop-shadow-[0_0_20px_rgba(180,83,9,0.20)]
            "
          >
            Education before activation
          </h2>

          <p
            className="
              mt-2 max-w-3xl
              text-sm leading-6 text-sky-400/78
            "
          >
            Representative UI state showing what has educated the Chief Agent,
            current curriculum posture, and unresolved activation prerequisites.
          </p>
        </div>

        <div className="shrink-0">
          <LuminaStatusBadge status="warning">
            Modeled UI contract · No live telemetry
          </LuminaStatusBadge>
        </div>
      </div>

      <LuminaMetricGrid className="grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={metricSurface}>
          <LuminaMetricCard
            label="Genesis corpus"
            value={summary.genesisSourceCount}
            icon={
              <ExecutivePremiumIcon
                icon={GitBranch}
                state="active"
              />
            }
            footer={
              <div className="text-xs leading-5 text-sky-500/78">
                Historical, constitutional, operational and conversational sources
              </div>
            }
          />
        </div>

        <div className={metricSurface}>
          <LuminaMetricCard
            label="Approved curriculum"
            value={summary.approvedCurriculumCount}
            icon={
              <ExecutivePremiumIcon
                icon={BookOpenCheck}
                state="healthy"
              />
            }
            footer={
              <div className="text-xs leading-5 text-sky-500/78">
                Governed assets admitted into the modeled corpus
              </div>
            }
          />
        </div>

        <div className={metricSurface}>
          <LuminaMetricCard
            label="Educational completion"
            value={`${summary.educationalCompletion}%`}
            icon={
              <ExecutivePremiumIcon
                icon={Target}
                state="active"
              />
            }
            footer={
              <div className="text-xs leading-5 text-sky-500/78">
                Completion across modeled curriculum modules
              </div>
            }
          />
        </div>

        <div className={metricSurface}>
          <LuminaMetricCard
            label="Constitutional coverage"
            value={`${summary.constitutionalCoverage}%`}
            icon={
              <ExecutivePremiumIcon
                icon={ShieldCheck}
                state="warning"
              />
            }
            footer={
              <div className="text-xs leading-5 text-sky-500/78">
                Vision, Constitution and CA-001 through CA-005 represented
              </div>
            }
          />
        </div>

        <div className={metricSurface}>
          <LuminaMetricCard
            label="Dependency health"
            value={
              summary.unresolvedGapCount === 0
                ? "Clear"
                : `${summary.unresolvedGapCount} gaps`
            }
            icon={
              <ExecutivePremiumIcon
                icon={Network}
                state={
                  summary.unresolvedGapCount === 0
                    ? "healthy"
                    : "warning"
                }
              />
            }
            footer={
              <div className="text-xs leading-5 text-sky-500/78">
                Blocked and review-required educational dependencies
              </div>
            }
          />
        </div>

        <div className={metricSurface}>
          <LuminaMetricCard
            label="Conversation coverage"
            value={`${summary.approvedConversationCount}/${summary.conversationCurriculumCount}`}
            icon={
              <ExecutivePremiumIcon
                icon={MessagesSquare}
                state="active"
              />
            }
            footer={
              <div className="text-xs leading-5 text-sky-500/78">
                Validated conversations admitted to curriculum
              </div>
            }
          />
        </div>

        <div className={metricSurface}>
          <LuminaMetricCard
            label="Initial competency"
            value="Developing"
            icon={
              <ExecutivePremiumIcon
                icon={BadgeCheck}
                state="healthy"
              />
            }
            footer={
              <div className="text-xs leading-5 text-sky-500/78">
                Certification intentionally excluded from Phase 1A
              </div>
            }
          />
        </div>

        <div className={metricSurface}>
          <LuminaMetricCard
            label="Activation readiness"
            value="Not ready"
            icon={
              <ExecutivePremiumIcon
                icon={TriangleAlert}
                state="warning"
              />
            }
            footer={
              <div className="text-xs leading-5 text-sky-500/78">
                Human authorization and unresolved curriculum gaps remain
              </div>
            }
          />
        </div>
      </LuminaMetricGrid>
    </section>
  );
}
