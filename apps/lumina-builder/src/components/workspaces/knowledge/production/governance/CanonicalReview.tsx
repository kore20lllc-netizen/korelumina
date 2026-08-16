import {
  useMemo,
  useState,
} from "react";

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
  LuminaExecutiveCard,
  LuminaExecutiveMetricGrid,
} from "@/components/design-system/lumina";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  createCanonicalReviewBatch,
  submitCanonicalReviewBatchDecision,
  submitCanonicalReviewDecision,
} from "@/services/knowledgeOperationsService";

import type {
  CanonicalReviewDecision,
} from "@/services/knowledgeOperationsService";

import type {
  CanonicalReviewProjection,
} from "../data/canonicalReviewProjection";

type CanonicalReviewProps = {
  projection: CanonicalReviewProjection;
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

  onDecisionComplete?: () => void | Promise<void>;
};

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

export function CanonicalReview({
  projection,
  selectedReviewId,
  selectedTimelineEventId,
  onReviewSelect,
  onTimelineEventSelect,
  onDecisionComplete,
}: CanonicalReviewProps) {
  const [
    reviewerId,
    setReviewerId,
  ] = useState(
    "human:knowledge-governance",
  );

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    decisionBusy,
    setDecisionBusy,
  ] = useState<
    CanonicalReviewDecision | null
  >(null);

  const [
    decisionError,
    setDecisionError,
  ] = useState<string | null>(
    null,
  );

  const [
    queueMode,
    setQueueMode,
  ] = useState<
    | "all"
    | "individual"
    | "batch_candidate"
    | "policy_candidate"
    | "blocked"
  >(
    "all",
  );

  const [
    activeBatchId,
    setActiveBatchId,
  ] = useState<string | null>(
    null,
  );

  const [
    batchBusy,
    setBatchBusy,
  ] = useState(false);

  const [
    batchError,
    setBatchError,
  ] = useState<string | null>(
    null,
  );


  const queueCounts =
    useMemo(
      () => ({
        all:
          projection.reviewQueue.filter(
            (item) =>
              item.capsuleId !== null,
          ).length,

        individual:
          projection.reviewQueue.filter(
            (item) =>
              item.reviewMode ===
              "individual",
          ).length,

        batch_candidate:
          projection.reviewQueue.filter(
            (item) =>
              item.reviewMode ===
              "batch_candidate",
          ).length,

        policy_candidate:
          projection.reviewQueue.filter(
            (item) =>
              item.reviewMode ===
              "policy_candidate",
          ).length,

        blocked:
          projection.reviewQueue.filter(
            (item) =>
              item.reviewMode ===
              "blocked",
          ).length,
      }),
      [
        projection.reviewQueue,
      ],
    );

  const visibleReviewQueue =
    useMemo(
      () =>
        projection.reviewQueue.filter(
          (item) =>
            queueMode ===
              "all" ||
            item.reviewMode ===
              queueMode,
        ),
      [
        projection.reviewQueue,
        queueMode,
      ],
    );

  const batchGroups =
    useMemo(
      () => {
        const groups =
          new Map<
            string,
            typeof projection.reviewQueue
          >();

        for (
          const item
          of projection.reviewQueue
        ) {
          if (
            item.reviewMode !==
              "batch_candidate" ||
            !item.capsuleId
          ) {
            continue;
          }

          const key =
            `${item.authority}::${item.domain}`;

          const current =
            groups.get(
              key,
            ) ?? [];

          groups.set(
            key,
            [
              ...current,
              item,
            ],
          );
        }

        return [
          ...groups.entries(),
        ].map(
          (
            [
              key,
              items,
            ],
          ) => ({
            key,

            authority:
              items[0]
                ?.authority ??
              "Authority unavailable",

            domain:
              items[0]
                ?.domain ??
              "Scope unavailable",

            packageIds:
              items
                .map(
                  (item) =>
                    item.capsuleId,
                )
                .filter(
                  (
                    value,
                  ): value is string =>
                    value !==
                    null,
                ),

            count:
              items.length,
          }),
        );
      },
      [
        projection.reviewQueue,
      ],
    );

  const selectedReview =
    useMemo(
      () =>
        projection.reviewQueue.find(
          (item) =>
            item.id ===
            selectedReviewId,
        ) ?? null,
      [
        projection.reviewQueue,
        selectedReviewId,
      ],
    );

  const canDecideIndividually =
    selectedReview?.reviewMode ===
    "individual";

  async function submitDecision(
    decision:
      CanonicalReviewDecision,
  ) {
    if (
      !selectedReview ||
      !selectedReview.capsuleId ||
      !canDecideIndividually ||
      decisionBusy
    ) {
      return;
    }

    const normalizedReviewer =
      reviewerId.trim();

    if (
      !normalizedReviewer
    ) {
      setDecisionError(
        "Reviewer identity is required.",
      );

      return;
    }

    try {
      setDecisionBusy(
        decision,
      );

      setDecisionError(
        null,
      );

      await submitCanonicalReviewDecision(
        selectedReview.capsuleId,
        decision,
        {
          reviewerId:
            normalizedReviewer,

          reason:
            reason.trim() ||
            undefined,
        },
      );

      setReason("");

      await onDecisionComplete?.();
    } catch (
      error
    ) {
      setDecisionError(
        error instanceof Error
          ? error.message
          : String(
              error,
            ),
      );
    } finally {
      setDecisionBusy(
        null,
      );
    }
  }

  async function createBatch(
    packageIds:
      string[],
  ) {
    if (
      packageIds.length ===
        0 ||
      batchBusy
    ) {
      return;
    }

    try {
      setBatchBusy(
        true,
      );

      setBatchError(
        null,
      );

      const result =
        await createCanonicalReviewBatch(
          packageIds,
        );

      setActiveBatchId(
        result.batch.id,
      );
    } catch (
      error
    ) {
      setBatchError(
        error instanceof Error
          ? error.message
          : String(
              error,
            ),
      );
    } finally {
      setBatchBusy(
        false,
      );
    }
  }

  async function submitBatchDecision(
    decision:
      CanonicalReviewDecision,
  ) {
    if (
      !activeBatchId ||
      batchBusy
    ) {
      return;
    }

    const normalizedReviewer =
      reviewerId.trim();

    if (
      !normalizedReviewer
    ) {
      setBatchError(
        "Reviewer identity is required.",
      );

      return;
    }

    try {
      setBatchBusy(
        true,
      );

      setBatchError(
        null,
      );

      await submitCanonicalReviewBatchDecision(
        activeBatchId,
        decision,
        {
          reviewerId:
            normalizedReviewer,

          reason:
            reason.trim() ||
            undefined,
        },
      );

      setActiveBatchId(
        null,
      );

      setReason("");

      await onDecisionComplete?.();
    } catch (
      error
    ) {
      setBatchError(
        error instanceof Error
          ? error.message
          : String(
              error,
            ),
      );
    } finally {
      setBatchBusy(
        false,
      );
    }
  }

  return (
    <section
      aria-labelledby="canonical-review-title"
      className="grid gap-5"
    >
      <LuminaExecutiveTitleMetricsComposition
        variant="balanced"
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
                  {projection.summary.awaitingReview}
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
                  {projection.summary.conflicts}
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
                  {projection.summary.reviewersActive}
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
                  {projection.summary.readyToPublish}
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
          value={projection.metrics.reviewQueue}
          description="Knowledge Packages awaiting governance."
          accentKey="amber"
          icon={<FileClock className="h-4 w-4 text-amber-300" />}
        />

        <LuminaExecutiveCard
          title="Required reviewers"
          value={projection.metrics.requiredReviewers}
          description="Assigned authorities across active reviews."
          accentKey="cyan"
          icon={<Users className="h-4 w-4 text-cyan-300" />}
        />

        <LuminaExecutiveCard
          title="Pending decisions"
          value={projection.metrics.pendingDecisions}
          description="Authority decisions required before promotion."
          accentKey="violet"
          icon={<Clock3 className="h-4 w-4 text-violet-300" />}
        />

        <LuminaExecutiveCard
          title="Publication readiness"
          value={projection.metrics.publicationReadiness}
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
                {projection.metrics.priorityReviews}
              </div>
            }
          />

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              {
                id: "all" as const,
                label: "All",
                count: queueCounts.all,
              },
              {
                id: "individual" as const,
                label: "Individual",
                count: queueCounts.individual,
              },
              {
                id: "batch_candidate" as const,
                label: "Batch",
                count: queueCounts.batch_candidate,
              },
              {
                id: "policy_candidate" as const,
                label: "Policy",
                count: queueCounts.policy_candidate,
              },
              {
                id: "blocked" as const,
                label: "Blocked",
                count: queueCounts.blocked,
              },
            ].map(
              (mode) => {
                const active =
                  queueMode ===
                  mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setQueueMode(
                        mode.id,
                      );

                      setActiveBatchId(
                        null,
                      );
                    }}
                    className={[
                      "rounded-full border px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition",
                      active
                        ? "border-cyan-200/42 bg-cyan-300/[0.11] text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.12)]"
                        : "border-sky-300/12 bg-slate-950/22 text-sky-300/62 hover:border-cyan-300/28 hover:text-cyan-100",
                    ].join(
                      " ",
                    )}
                  >
                    {mode.label}
                    <span className="ml-2 text-[9px] opacity-70">
                      {mode.count}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          {queueMode ===
          "batch_candidate" ? (
            <div className="mt-4 grid gap-3">
              {batchGroups.length >
              0 ? (
                batchGroups.map(
                  (group) => (
                    <LuminaFlagshipCard
                      key={
                        group.key
                      }
                      as="article"
                      className="rounded-[18px] p-4"
                    >
                      <div className="relative z-10">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-300/58">
                              Governed batch candidate
                            </div>

                            <div className="mt-1 text-sm font-semibold text-white">
                              {group.authority}
                            </div>

                            <div className="mt-1 text-xs text-sky-300/60">
                              {group.domain}
                              {" · "}
                              {group.count}
                              {" packages"}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={
                              batchBusy
                            }
                            onClick={() =>
                              void createBatch(
                                group.packageIds,
                              )
                            }
                            className="rounded-full border border-cyan-300/28 bg-cyan-300/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-300/[0.13] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {batchBusy
                              ? "Preparing…"
                              : `Review ${group.count} as batch`}
                          </button>
                        </div>
                      </div>
                    </LuminaFlagshipCard>
                  ),
                )
              ) : (
                <div className="rounded-[16px] border border-sky-300/10 bg-slate-950/18 px-4 py-4 text-xs text-sky-300/58">
                  No packages are currently eligible for governed batch review.
                </div>
              )}

              {activeBatchId ? (
                <LuminaFlagshipCard
                  as="article"
                  className="rounded-[18px] p-4"
                >
                  <div className="relative z-10">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/64">
                      Batch decision
                    </div>

                    <div className="mt-1 text-sm font-semibold text-white">
                      {activeBatchId}
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,.38fr)_minmax(0,1fr)]">
                      <input
                        value={
                          reviewerId
                        }
                        onChange={(
                          event,
                        ) =>
                          setReviewerId(
                            event.target.value,
                          )
                        }
                        className="h-10 rounded-[14px] border border-cyan-300/14 bg-slate-950/42 px-3 text-xs text-sky-100 outline-none focus:border-cyan-300/42"
                        placeholder="Reviewer identity"
                      />

                      <textarea
                        value={
                          reason
                        }
                        onChange={(
                          event,
                        ) =>
                          setReason(
                            event.target.value,
                          )
                        }
                        rows={2}
                        className="min-h-[64px] resize-y rounded-[14px] border border-violet-300/14 bg-slate-950/42 px-3 py-2.5 text-xs text-sky-100 outline-none focus:border-violet-300/42"
                        placeholder="Batch governance rationale"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={
                          batchBusy
                        }
                        onClick={() =>
                          void submitBatchDecision(
                            "approved",
                          )
                        }
                        className="rounded-full border border-emerald-300/28 bg-emerald-300/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 disabled:opacity-45"
                      >
                        Approve batch
                      </button>

                      <button
                        type="button"
                        disabled={
                          batchBusy
                        }
                        onClick={() =>
                          void submitBatchDecision(
                            "remediation_required",
                          )
                        }
                        className="rounded-full border border-amber-300/28 bg-amber-300/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100 disabled:opacity-45"
                      >
                        Require remediation
                      </button>

                      <button
                        type="button"
                        disabled={
                          batchBusy
                        }
                        onClick={() =>
                          void submitBatchDecision(
                            "rejected",
                          )
                        }
                        className="rounded-full border border-rose-300/28 bg-rose-300/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100 disabled:opacity-45"
                      >
                        Reject batch
                      </button>
                    </div>
                  </div>
                </LuminaFlagshipCard>
              ) : null}

              {batchError ? (
                <div className="rounded-[14px] border border-rose-300/18 bg-rose-300/[0.05] px-3 py-2 text-xs text-rose-100">
                  {batchError}
                </div>
              ) : null}
            </div>
          ) : null}

          {queueMode ===
          "policy_candidate" ? (
            <div className="mt-4 rounded-[18px] border border-violet-300/14 bg-violet-300/[0.04] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/68">
                Policy-governed review
              </div>

              <div className="mt-2 text-sm font-semibold text-white">
                {queueCounts.policy_candidate} policy-eligible packages
              </div>

              <p className="mt-2 text-xs leading-5 text-violet-100/64">
                Policy candidates are visible here, but policy execution remains disabled until the persisted policy-authority and policy-version governance model is activated.
              </p>
            </div>
          ) : null}

          {queueMode ===
          "blocked" ? (
            <div className="mt-4 rounded-[18px] border border-rose-300/16 bg-rose-300/[0.04] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200/68">
                Remediation queue
              </div>

              <div className="mt-2 text-sm font-semibold text-white">
                {queueCounts.blocked} blocked packages
              </div>

              <p className="mt-2 text-xs leading-5 text-rose-100/64">
                Blocked packages cannot be approved. They must be remediated, revalidated, and resealed before returning to Canonical Review.
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4">
            {visibleReviewQueue.map((item) => {
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
                    <LuminaFlagshipCard
                      as="article"
                      className="rounded-[16px] p-3"
                    >
                      <div className="relative z-10">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                          Required reviewers
                        </div>
                        <div className="mt-1 text-xs font-semibold text-cyan-100">
                          {item.reviewers}
                        </div>
                      </div>
                    </LuminaFlagshipCard>

                    <LuminaFlagshipCard
                      as="article"
                      className="rounded-[16px] p-3"
                    >
                      <div className="relative z-10">
                        <div className="text-[9px] uppercase tracking-[0.14em] text-rose-300/52">
                          Conflict posture
                        </div>
                        <div className="mt-1 text-xs font-semibold text-rose-100">
                          {item.conflict}
                        </div>
                      </div>
                    </LuminaFlagshipCard>
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

          {selectedReview ? (
            <LuminaFlagshipCard
              as="article"
              className="mt-5 rounded-[18px] p-4"
            >
              <div className="relative z-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/64">
                      Approval console
                    </div>

                    <h4 className="mt-1 text-base font-semibold text-white">
                      {selectedReview.id}
                    </h4>

                    <div className="mt-1 text-xs text-sky-300/62">
                      {selectedReview.state}
                    </div>
                  </div>

                  <div className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.05] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                    {selectedReview.reviewMode ?? "classification unavailable"}
                  </div>
                </div>

                {canDecideIndividually ? (
                  <>
                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,.38fr)_minmax(0,1fr)]">
                      <label className="grid gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/58">
                          Reviewer identity
                        </span>

                        <input
                          value={reviewerId}
                          onChange={(event) =>
                            setReviewerId(
                              event.target.value,
                            )
                          }
                          className="h-10 rounded-[14px] border border-cyan-300/14 bg-slate-950/42 px-3 text-xs text-sky-100 outline-none transition focus:border-cyan-300/42"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-300/58">
                          Decision rationale
                        </span>

                        <textarea
                          value={reason}
                          onChange={(event) =>
                            setReason(
                              event.target.value,
                            )
                          }
                          rows={3}
                          placeholder="Record the human governance rationale."
                          className="min-h-[76px] resize-y rounded-[14px] border border-violet-300/14 bg-slate-950/42 px-3 py-2.5 text-xs leading-5 text-sky-100 outline-none transition placeholder:text-slate-500 focus:border-violet-300/42"
                        />
                      </label>
                    </div>

                    {decisionError ? (
                      <div className="mt-3 rounded-[14px] border border-rose-300/18 bg-rose-300/[0.05] px-3 py-2 text-xs text-rose-100">
                        {decisionError}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={decisionBusy !== null}
                        onClick={() =>
                          void submitDecision(
                            "approved",
                          )
                        }
                        className="rounded-full border border-emerald-300/28 bg-emerald-300/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 transition hover:bg-emerald-300/[0.14] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {decisionBusy ===
                        "approved"
                          ? "Approving…"
                          : "Approve"}
                      </button>

                      <button
                        type="button"
                        disabled={decisionBusy !== null}
                        onClick={() =>
                          void submitDecision(
                            "remediation_required",
                          )
                        }
                        className="rounded-full border border-amber-300/28 bg-amber-300/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100 transition hover:bg-amber-300/[0.13] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {decisionBusy ===
                        "remediation_required"
                          ? "Routing…"
                          : "Require remediation"}
                      </button>

                      <button
                        type="button"
                        disabled={decisionBusy !== null}
                        onClick={() =>
                          void submitDecision(
                            "rejected",
                          )
                        }
                        className="rounded-full border border-rose-300/28 bg-rose-300/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100 transition hover:bg-rose-300/[0.13] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {decisionBusy ===
                        "rejected"
                          ? "Rejecting…"
                          : "Reject"}
                      </button>
                    </div>

                    <div className="mt-3 text-[10px] leading-5 text-sky-400/52">
                      This decision records Canonical Review only. It does not promote Canonical Knowledge.
                    </div>
                  </>
                ) : selectedReview.reviewMode ===
                  "batch_candidate" ? (
                  <div className="mt-4 rounded-[14px] border border-cyan-300/14 bg-cyan-300/[0.04] px-3 py-3 text-xs leading-5 text-cyan-100/72">
                    This package is eligible for governed batch review. Batch decision controls are the next activation milestone.
                  </div>
                ) : selectedReview.reviewMode ===
                  "policy_candidate" ? (
                  <div className="mt-4 rounded-[14px] border border-violet-300/14 bg-violet-300/[0.04] px-3 py-3 text-xs leading-5 text-violet-100/72">
                    This package is policy-eligible. Policy execution remains disabled until the governed policy authority model is activated.
                  </div>
                ) : selectedReview.reviewMode ===
                  "blocked" ? (
                  <div className="mt-4 rounded-[14px] border border-rose-300/18 bg-rose-300/[0.05] px-3 py-3 text-xs leading-5 text-rose-100/76">
                    This package is blocked and cannot be approved. Complete remediation and revalidation first.
                  </div>
                ) : (
                  <div className="mt-4 rounded-[14px] border border-slate-300/12 bg-slate-300/[0.03] px-3 py-3 text-xs leading-5 text-slate-300/68">
                    No actionable governed review mode is available for this package.
                  </div>
                )}
              </div>
            </LuminaFlagshipCard>
          ) : null}
            </div>
          </LuminaFlagshipPanel>
        }
        secondaryRegion={
          <div className="grid h-full gap-5 xl:grid-rows-2">
          <LuminaFlagshipPanel
            title={null}
            className="h-full [&>div:nth-of-type(3)]:hidden"
          >
            <div className="p-5 sm:p-6">
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
              {projection.authorities.map((authority, index) => (
                <LuminaFlagshipCard
                  key={authority.title}
                  as="article"
                  className="relative rounded-[16px] p-3"
                >
                  <div className="relative z-10">
                    {index < projection.authorities.length - 1 ? (
                      <div className="absolute left-4 top-full h-3 w-px bg-violet-300/24" />
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
                </LuminaFlagshipCard>
              ))}
            </div>
            </div>
          </LuminaFlagshipPanel>

          <LuminaFlagshipPanel
            title={null}
            className="h-full [&>div:nth-of-type(3)]:hidden"
          >
            <div className="p-5 sm:p-6">
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
              <LuminaFlagshipCard
                as="article"
                className="rounded-[16px] p-3"
              >
                <div className="relative z-10">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300/48">
                    Current canonical capsule
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    KCAP-2025-118 · Runtime Recovery Standard v2.4
                  </div>
                </div>
              </LuminaFlagshipCard>

              <div className="flex justify-center">
                <GitCompareArrows className="h-4 w-4 text-cyan-300/70" />
              </div>

              <LuminaFlagshipCard
                as="article"
                className="rounded-[16px] p-3"
              >
                <div className="relative z-10">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-amber-300/52">
                    Proposed replacement
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-100">
                    KCAP-2026-042 · Runtime Isolation Recovery Standard v3.0
                  </div>
                </div>
              </LuminaFlagshipCard>
            </div>
            </div>
          </LuminaFlagshipPanel>
          </div>
        }
      />

      <div className="grid items-stretch gap-5 xl:grid-cols-2">
        <LuminaFlagshipPanel
          title={null}
          className="[&>div:nth-of-type(3)]:hidden"
        >
          <div className="p-5 sm:p-6">
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

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {projection.timeline.map((item, index) => {
              const selected =
                selectedTimelineEventId ===
                item.id;

              return (
                <div
                  key={item.id}
                  className="relative"
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      onTimelineEventSelect(
                        item.capsuleId,
                        item.id,
                      )
                    }
                    className="block w-full text-left"
                  >
                    <LuminaFlagshipCard
                      as="article"
                      className={[
                        "rounded-[18px] px-2 py-3 text-center",
                        "transition-[border-color,box-shadow,transform] duration-200",
                        selected
                          ? "ring-1 ring-inset ring-cyan-200/80 shadow-[0_0_24px_rgba(37,99,235,0.22)]"
                          : "hover:ring-1 hover:ring-inset hover:ring-cyan-300/45",
                      ].join(" ")}
                    >
                      <div className="relative z-10 flex w-full flex-col items-center">
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
                      </div>
                    </LuminaFlagshipCard>
                  </button>
                </div>
              );
            })}
          </div>
          </div>
        </LuminaFlagshipPanel>

        <LuminaFlagshipPanel
          title={null}
          className="[&>div:nth-of-type(3)]:hidden"
        >
          <div className="p-5 sm:p-6">
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
            <LuminaFlagshipCard
              as="article"
              className="rounded-[16px] p-3"
            >
              <div className="relative z-10">
                <div className="text-xs font-semibold text-white">
                  Resolve constitutional interpretation
                </div>
                <div className="mt-2 text-[11px] leading-5 text-rose-200/56">
                  Determine whether integrity remediation history must remain
                  visible after canonical resealing.
                </div>
              </div>
            </LuminaFlagshipCard>

            <LuminaFlagshipCard
              as="article"
              className="rounded-[16px] p-3"
            >
              <div className="relative z-10">
                <div className="text-xs font-semibold text-white">
                  Confirm supersession boundary
                </div>
                <div className="mt-2 text-[11px] leading-5 text-amber-200/56">
                  Decide whether the proposed capsule replaces the full runtime
                  recovery standard or only isolation recovery guidance.
                </div>
              </div>
            </LuminaFlagshipCard>
          </div>
          </div>
        </LuminaFlagshipPanel>
      </div>
    </section>
  );
}
