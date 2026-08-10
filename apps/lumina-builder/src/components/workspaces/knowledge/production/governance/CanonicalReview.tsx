import {
  flagshipAppearance,
} from "../../learning/presentation/flagshipAppearance";

import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileClock,
  GitCompareArrows,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  LuminaBalancedSplitPanelComposition,
} from "@/components/design-system/compositions/LuminaBalancedSplitPanelComposition";

import {
  LuminaExecutiveTitleMetricsComposition,
} from "@/components/design-system/compositions/LuminaExecutiveTitleMetricsComposition";

import {
  LuminaPanelHeaderComposition,
} from "@/components/design-system/compositions/LuminaPanelHeaderComposition";

import {
  electricContour,
  LuminaExecutiveCard,
  LuminaExecutiveMetricGrid,
  premiumSurfaces,
} from "@/components/design-system/lumina";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  LuminaStandardPremiumCard,
} from "@/components/design-system/surfaces/LuminaStandardPremiumCard";

import {
  LuminaStandardPremiumPanel,
} from "@/components/design-system/surfaces/LuminaStandardPremiumPanel";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

type CanonicalReviewProps = {
  selectedReviewId?: string;
  selectedTimelineEventId?: string;
  onReviewSelect: (
    capsuleId: string,
    reviewId: string,
  ) => void;
  onTimelineEventSelect: (
    capsuleId: string,
    eventId: string,
  ) => void;
};

const REVIEW_QUEUE = [
  {
    id: "KCAP-2026-042",
    capsuleId: "capsule-144",
    title: "Runtime Isolation Recovery Standard",
    domain: "Runtime Architecture",
    authority: "Architecture Council",
    reviewers: "3 of 4 assigned",
    conflict: "No unresolved conflicts",
    readiness: 92,
    state: "Ready for final review",
    tone: "emerald" as const,
  },
  {
    id: "KCAP-2026-039",
    capsuleId: null,
    title: "Knowledge Package Integrity Protocol",
    domain: "Knowledge Constitution",
    authority: "Constitutional Review Board",
    reviewers: "4 of 5 assigned",
    conflict: "1 constitutional interpretation",
    readiness: 74,
    state: "Decision required",
    tone: "amber" as const,
  },
  {
    id: "KCAP-2026-036",
    capsuleId: null,
    title: "Mission Recovery Evidence Standard",
    domain: "Mission System",
    authority: "Mission Governance",
    reviewers: "2 of 4 assigned",
    conflict: "Supersession scope disputed",
    readiness: 58,
    state: "Review blocked",
    tone: "rose" as const,
  },
];

const TIMELINE = [
  {
    id: "canonical-review-event-evidence-certified",
    capsuleId: "capsule-144",
    label: "Evidence certified",
    detail: "Validation Council · 09:14",
    state: "complete",
  },
  {
    id: "canonical-review-event-scope-reviewed",
    capsuleId: "capsule-144",
    label: "Constitutional scope reviewed",
    detail: "Chief Systems Architect · 10:02",
    state: "complete",
  },
  {
    id: "canonical-review-event-authority-review",
    capsuleId: "capsule-144",
    label: "Authority review",
    detail: "Architecture Council · In progress",
    state: "active",
  },
  {
    id: "canonical-review-event-publication-decision",
    capsuleId: "capsule-144",
    label: "Publication decision",
    detail: "Required before canonical promotion",
    state: "waiting",
  },
];

const AUTHORITIES = [
  {
    title: "Constitutional authority",
    value: "Knowledge Constitution",
    detail: "Defines admissibility and canonical constraints.",
  },
  {
    title: "Domain authority",
    value: "Architecture Council",
    detail: "Owns technical scope and supersession decisions.",
  },
  {
    title: "Publication authority",
    value: "Chief Systems Architect",
    detail: "Certifies organizational publication readiness.",
  },
];

function readinessTone(
  value: number,
) {
  if (value >= 85) {
    return "bg-emerald-300";
  }

  if (value >= 70) {
    return "bg-amber-300";
  }

  return "bg-rose-300";
}

const compactCardClass = [
  "rounded-[16px] p-3",
  premiumSurfaces.base.card,
  electricContour.strength.standard,
].join(" ");

export function CanonicalReview({
  selectedReviewId,
  selectedTimelineEventId,
  onReviewSelect,
  onTimelineEventSelect,
}: CanonicalReviewProps) {
  return (
    <section
      aria-labelledby="canonical-review-title"
      className="grid gap-5"
    >
      <LuminaExecutiveTitleMetricsComposition
        variant="content-led"
        titleRegion={
          <LuminaFlagshipPanel
            className="flex h-full flex-col"
            title={null}
          >
            <div className="relative z-10 flex h-full flex-col px-6 pb-7 pt-2">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon
                icon={Scale}
                state="warning"
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/68">
                  Governance threshold
                </div>

                <h2
                  id="canonical-review-title"
                  className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-amber-400"
                >
                  Canonical Review
                </h2>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-sky-300/68">
              Knowledge Packages leave production and enter constitutional
              governance. Authority, conflict resolution, reviewer coverage,
              supersession, and publication readiness become visible before
              canonical promotion.
            </p>

            <div className="mb-auto mt-7 grid grid-cols-2 gap-3.5 xl:mt-8">
              <LuminaFlagshipCard
                as="article"
                className="rounded-[18px] px-3.5 py-3"
              >
                <div className="relative z-10">
                <div className="text-[9px] uppercase tracking-[0.16em] text-amber-200/58">
                  Awaiting review
                </div>
                <div className="mt-1 text-xl font-semibold text-amber-100">
                  12
                </div>
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard
                as="article"
                className="rounded-[18px] px-3.5 py-3"
              >
                <div className="relative z-10">
                <div className="text-[9px] uppercase tracking-[0.16em] text-rose-200/58">
                  Conflicts
                </div>
                <div className="mt-1 text-xl font-semibold text-rose-100">
                  3
                </div>
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard
                as="article"
                className="rounded-[18px] px-3.5 py-3"
              >
                <div className="relative z-10">
                <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-200/58">
                  Reviewers active
                </div>
                <div className="mt-1 text-xl font-semibold text-cyan-100">
                  18
                </div>
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard
                as="article"
                className="rounded-[18px] px-3.5 py-3"
              >
                <div className="relative z-10">
                <div className="text-[9px] uppercase tracking-[0.16em] text-emerald-200/58">
                  Ready to publish
                </div>
                <div className="mt-1 text-xl font-semibold text-emerald-100">
                  5
                </div>
                </div>
              </LuminaFlagshipCard>
            </div>
          </div>
            </div>
          </LuminaFlagshipPanel>
        }
        metricsRegion={
          <LuminaExecutiveMetricGrid
            columns={2}
          >
        <LuminaExecutiveCard
          title="Review queue"
          value="12"
          description="Knowledge Packages awaiting governance."
          accentKey="amber"
          icon={<FileClock className="h-4 w-4 text-amber-300" />}
        />

        <LuminaExecutiveCard
          title="Required reviewers"
          value="18"
          description="Assigned authorities across active reviews."
          accentKey="cyan"
          icon={<Users className="h-4 w-4 text-cyan-300" />}
        />

        <LuminaExecutiveCard
          title="Pending decisions"
          value="7"
          description="Authority decisions required before promotion."
          accentKey="violet"
          icon={<Clock3 className="h-4 w-4 text-violet-300" />}
        />

        <LuminaExecutiveCard
          title="Publication readiness"
          value="82%"
          description="Average readiness across the governance queue."
          accentKey="emerald"
          icon={<BadgeCheck className="h-4 w-4 text-emerald-300" />}
        />
          </LuminaExecutiveMetricGrid>
        }
      />

      <LuminaBalancedSplitPanelComposition
        primaryRegion={
          <LuminaFlagshipPanel
            title={null}
            className="h-full [&>div:nth-of-type(3)]:hidden"
          >
            <div className="p-5 sm:p-6">
          <LuminaPanelHeaderComposition
            copyRegion={
              <>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/62">
                  Governance queue
                </div>
                <h3 className="mt-1 text-lg font-semibold text-sky-100">
                  Capsules awaiting canonical decision
                </h3>
              </>
            }
            trailingRegion={
              <div className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.05] px-3 py-1.5 text-[10px] font-semibold text-cyan-100">
                3 priority reviews
              </div>
            }
          />

          <div className="mt-5 grid gap-4">
            {REVIEW_QUEUE.map((item) => {
              const selectable =
                item.capsuleId !== null;
              const selected =
                selectable &&
                selectedReviewId === item.id;

              const article = (
                <LuminaFlagshipCard
                  as="article"
                  className={[
                    "rounded-[18px] p-4",
                    selectable
                      ? "transition-[border-color,box-shadow,transform] duration-200"
                      : "",
                    selected
                      ? "ring-1 ring-inset ring-cyan-200/80 shadow-[0_0_28px_rgba(37,99,235,0.24)]"
                      : selectable
                        ? "hover:ring-1 hover:ring-inset hover:ring-cyan-300/45"
                        : "",
                  ].join(" ")}
                >
                  <div className="relative z-10">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/68">
                        {item.id}
                      </span>

                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]",
                          item.tone === "emerald"
                            ? "border-emerald-300/24 bg-emerald-300/[0.07] text-emerald-100"
                            : item.tone === "amber"
                              ? "border-amber-300/24 bg-amber-300/[0.07] text-amber-100"
                              : "border-rose-300/24 bg-rose-300/[0.07] text-rose-100",
                        ].join(" ")}
                      >
                        {item.state}
                      </span>
                    </div>

                    <h4 className="mt-2 text-base font-semibold text-white">
                      {item.title}
                    </h4>

                    <div className="mt-2 text-xs text-sky-400/68">
                      {item.domain} · {item.authority}
                    </div>
                  </div>

                  <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:w-[360px]">
                    <div className={[
                      flagshipAppearance.canonicalSurface,
                      flagshipAppearance.canonicalDetailSurface,
                    ].join(" ")}>
                      <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                        Required reviewers
                      </div>
                      <div className="mt-1 text-xs font-semibold text-cyan-100">
                        {item.reviewers}
                      </div>
                    </div>

                    <div className={compactCardClass}>
                      <div className="text-[9px] uppercase tracking-[0.14em] text-rose-300/52">
                        Conflict posture
                      </div>
                      <div className="mt-1 text-xs font-semibold text-rose-100">
                        {item.conflict}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold uppercase tracking-[0.14em] text-sky-400/56">
                      Publication readiness
                    </span>
                    <span className="font-semibold text-white">
                      {item.readiness}%
                    </span>
                  </div>

                  <div
                    className={[
                      "mt-2 h-2 overflow-hidden rounded-full",
                      item.tone === "rose"
                        ? "bg-rose-950/72 ring-1 ring-inset ring-rose-400/18"
                        : "bg-slate-950/72",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "h-full rounded-full",
                        item.tone === "rose"
                          ? "shadow-[0_0_14px_rgba(244,63,94,0.55)]"
                          : readinessTone(item.readiness),
                      ].join(" ")}
                      style={{
                        width: `${item.readiness}%`,
                        ...(item.tone === "rose"
                          ? { backgroundColor: "#f43f5e" }
                          : {}),
                      }}
                    />
                  </div>
                </div>
                  </div>
                </LuminaFlagshipCard>
              );

              if (!item.capsuleId) {
                return (
                  <div key={item.id}>
                    {article}
                  </div>
                );
              }

              return (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={selected}
                  onClick={() =>
                    onReviewSelect(
                      item.capsuleId,
                      item.id,
                    )
                  }
                  className="block w-full text-left"
                >
                  {article}
                </button>
              );
            })}
          </div>
            </div>
          </LuminaFlagshipPanel>
        }
        secondaryRegion={
          <div className="grid h-full gap-5 xl:grid-rows-2">
          <LuminaStandardPremiumPanel className="h-full">
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon
                icon={ShieldCheck}
                state="active"
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/58">
                  Authority hierarchy
                </div>
                <h3 className="mt-1 text-base font-semibold text-violet-100">
                  Governance chain
                </h3>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {AUTHORITIES.map((authority, index) => (
                <div
                  key={authority.title}
                  className={[
                    "relative",
                    flagshipAppearance.canonicalSurface,
                    flagshipAppearance.canonicalPanelSurface,
                  ].join(" ")}
                >
                  {index < AUTHORITIES.length - 1 ? (
                    <div className="absolute left-7 top-full h-3 w-px bg-violet-300/24" />
                  ) : null}

                  <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-violet-300/52">
                    {authority.title}
                  </div>

                  <div className="mt-1 text-sm font-semibold text-white">
                    {authority.value}
                  </div>

                  <div className="mt-2 text-xs leading-5 text-violet-200/56">
                    {authority.detail}
                  </div>
                </div>
              ))}
            </div>
          </LuminaStandardPremiumPanel>

          <LuminaStandardPremiumPanel className="h-full">
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon
                icon={GitCompareArrows}
                state="warning"
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/58">
                  Supersession preview
                </div>
                <h3 className="mt-1 text-base font-semibold text-cyan-100">
                  Current versus proposed authority
                </h3>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className={[
                flagshipAppearance.canonicalSurface,
                flagshipAppearance.canonicalPanelSurface,
              ].join(" ")}>
                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300/48">
                  Current canonical capsule
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-100">
                  KCAP-2025-118 · Runtime Recovery Standard v2.4
                </div>
              </div>

              <div className="flex justify-center">
                <GitCompareArrows className="h-4 w-4 text-cyan-300/70" />
              </div>

              <LuminaStandardPremiumCard>
                <div className="text-[9px] uppercase tracking-[0.14em] text-amber-300/52">
                  Proposed replacement
                </div>
                <div className="mt-1 text-sm font-semibold text-amber-100">
                  KCAP-2026-042 · Runtime Isolation Recovery Standard v3.0
                </div>
              </LuminaStandardPremiumCard>
            </div>
          </LuminaStandardPremiumPanel>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.7fr)]">
        <LuminaStandardPremiumPanel>
          <div className="flex items-center gap-3">
            <ExecutivePremiumIcon
              icon={Clock3}
              state="active"
            />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/58">
                Approval timeline
              </div>
              <h3 className="mt-1 text-base font-semibold text-cyan-100">
                Governance progression
              </h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {TIMELINE.map((item, index) => {
              const selected =
                selectedTimelineEventId ===
                item.id;

              return (
                <div
                  key={item.id}
                  className="relative"
                >
                  {index < TIMELINE.length - 1 ? (
                    <div className="absolute left-[calc(50%+18px)] top-4 hidden h-px w-[calc(100%-36px)] bg-cyan-300/18 md:block" />
                  ) : null}

                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      onTimelineEventSelect(
                        item.capsuleId,
                        item.id,
                      )
                    }
                    className={[
                      "relative z-10 flex w-full flex-col items-center rounded-[18px] px-2 py-3 text-center",
                      "transition-[border-color,box-shadow,transform] duration-200",
                      selected
                        ? "ring-1 ring-inset ring-cyan-200/80 shadow-[0_0_24px_rgba(37,99,235,0.22)]"
                        : "hover:ring-1 hover:ring-inset hover:ring-cyan-300/45",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full border",
                        item.state === "complete"
                          ? "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-200"
                          : item.state === "active"
                            ? "border-cyan-300/36 bg-cyan-300/[0.10] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,.18)]"
                            : "border-slate-300/16 bg-slate-300/[0.035] text-slate-400",
                      ].join(" ")}
                    >
                      {item.state === "complete" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : item.state === "active" ? (
                        <Clock3 className="h-4 w-4" />
                      ) : (
                        <FileClock className="h-4 w-4" />
                      )}
                    </div>

                    <div className="mt-3 text-xs font-semibold text-white">
                      {item.label}
                    </div>

                    <div className="mt-1 text-[10px] leading-4 text-sky-400/56">
                      {item.detail}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </LuminaStandardPremiumPanel>

        <LuminaStandardPremiumPanel>
          <div className="flex items-center gap-3">
            <ExecutivePremiumIcon
              icon={AlertTriangle}
              state="warning"
            />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300/58">
                Pending decisions
              </div>
              <h3 className="mt-1 text-base font-semibold text-rose-100">
                Governance attention required
              </h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className={[
              flagshipAppearance.canonicalSurface,
              flagshipAppearance.canonicalPanelSurface,
            ].join(" ")}>
              <div className="text-xs font-semibold text-white">
                Resolve constitutional interpretation
              </div>
              <div className="mt-2 text-[11px] leading-5 text-rose-200/56">
                Determine whether integrity remediation history must remain
                visible after canonical resealing.
              </div>
            </div>

            <div className={[
              flagshipAppearance.canonicalSurface,
              flagshipAppearance.canonicalPanelSurface,
            ].join(" ")}>
              <div className="text-xs font-semibold text-white">
                Confirm supersession boundary
              </div>
              <div className="mt-2 text-[11px] leading-5 text-amber-200/56">
                Decide whether the proposed capsule replaces the full runtime
                recovery standard or only isolation recovery guidance.
              </div>
            </div>
          </div>
        </LuminaStandardPremiumPanel>
      </div>
    </section>
  );
}
