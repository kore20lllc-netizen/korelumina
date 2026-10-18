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

import {
  useKnowledgeOperationsTruth,
  type Checked,
} from "@/components/workspaces/knowledge-v3/layout/useKnowledgeOperationsTruth";

function describeCompetency(
  check: Checked<{ state: string }>,
): { value: string; footer: string; healthy: boolean } {
  if (check.status === "loading") {
    return { value: "Checking…", footer: "Reading Initial Competency certification from Runtime", healthy: false };
  }
  if (check.status === "error") {
    return { value: "Unknown", footer: "Runtime did not answer the certification check", healthy: false };
  }
  if (check.data.state === "VALID") {
    return { value: "Certified", footer: "Initial Competency certification is valid", healthy: true };
  }
  return { value: check.data.state.replace(/_/g, " ").toLowerCase(), footer: "Initial Competency certification is not valid", healthy: false };
}

function describeActivation(
  check: Checked<{ state: string; autonomyLevel: string | null }>,
): { value: string; footer: string; healthy: boolean } {
  if (check.status === "loading") {
    return { value: "Checking…", footer: "Reading the activation record from Runtime", healthy: false };
  }
  if (check.status === "error") {
    return { value: "Unknown", footer: "Runtime did not answer the activation check", healthy: false };
  }
  if (check.data.state === "ACTIVE") {
    return {
      value: "Active",
      footer: `Activated by the owner · ${check.data.autonomyLevel ?? "autonomy not recorded"}`,
      healthy: true,
    };
  }
  if (check.data.state === "SUSPENDED" || check.data.state === "REVOKED") {
    return { value: check.data.state === "SUSPENDED" ? "Suspended" : "Revoked", footer: "Recorded by the owner (ADR-0041)", healthy: false };
  }
  return { value: "Not activated", footer: "Prerequisites and owner decision are shown in Activation Readiness", healthy: false };
}

interface ExecutiveEducationalSummaryProps {
  summary: ExecutiveEducationalSummaryViewModel;
}

const metricSurface =
  "rounded-[22px] border border-cyan-300/32 bg-[linear-gradient(135deg,rgba(3,12,35,0.62),rgba(17,10,45,0.56),rgba(3,14,37,0.60))] p-0 ring-1 ring-inset ring-cyan-100/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_34px_rgba(2,6,23,0.18)]";

export function ExecutiveEducationalSummary({
  summary,
}: ExecutiveEducationalSummaryProps) {
  const truth = useKnowledgeOperationsTruth();
  const competency = describeCompetency(truth.competencyCertification);
  const activation = describeActivation(truth.activation);
  const live = truth.runtime.status === "ok";

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
            What has educated the Chief Agent, its current curriculum posture,
            and its activation state, read from Runtime.
          </p>
        </div>

        <div className="shrink-0">
          <LuminaStatusBadge variant={live ? "healthy" : truth.runtime.status === "loading" ? "neutral" : "warning"}>
            {live ? "Live from Runtime" : truth.runtime.status === "loading" ? "Checking Runtime…" : "Runtime unavailable"}
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
            value={competency.value}
            icon={
              <ExecutivePremiumIcon
                icon={BadgeCheck}
                state={competency.healthy ? "healthy" : "warning"}
              />
            }
            footer={
              <div className="text-xs leading-5 text-sky-500/78">
                {competency.footer}
              </div>
            }
          />
        </div>

        <div className={metricSurface}>
          <LuminaMetricCard
            label="Activation readiness"
            value={activation.value}
            icon={
              <ExecutivePremiumIcon
                icon={activation.healthy ? ShieldCheck : TriangleAlert}
                state={activation.healthy ? "healthy" : "warning"}
              />
            }
            footer={
              <div className="text-xs leading-5 text-sky-500/78">
                {activation.footer}
              </div>
            }
          />
        </div>
      </LuminaMetricGrid>
    </section>
  );
}
