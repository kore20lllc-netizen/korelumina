import {
  useEffect,
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
  activateCanonicalReviewPolicy,
  createCanonicalReviewBatch,
  createCanonicalReviewPolicyDraft,
  deleteCanonicalReviewPolicyDraft,
  executeCanonicalReviewPolicy,
  getCanonicalReviewPolicyExecution,
  revokeCanonicalReviewPolicy,
  supersedeCanonicalReviewPolicy,
  submitCanonicalReviewBatchDecision,
  submitCanonicalReviewDecision,
} from "@/services/knowledgeOperationsService";

import type {
  CanonicalReviewDecision,
  CanonicalReviewPolicyExecutionSnapshot,
  CanonicalReviewPolicySnapshot,
  CanonicalReviewPolicyView,
} from "@/services/knowledgeOperationsService";

import type {
  CanonicalReviewProjection,
} from "../data/canonicalReviewProjection";

type CanonicalReviewProps = {
  projection: CanonicalReviewProjection;

  policySnapshot:
    CanonicalReviewPolicySnapshot;
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

  onPolicyPersisted?: (
    policy:
      CanonicalReviewPolicyView,
  ) => void;

  onPolicyDeleted?: (
    policyId: string,
    version: string,
  ) => void;
};

function nextPolicyVersion(
  version: string,
): string {
  const match =
    version.match(
      /^(\d+)\.(\d+)\.(\d+)$/,
    );

  if (!match) {
    return "";
  }

  return `${Number(match[1]) + 1}.0.0`;
}

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
  policySnapshot,
  selectedReviewId,
  selectedTimelineEventId,
  onReviewSelect,
  onTimelineEventSelect,
  onDecisionComplete,
  onPolicyPersisted,
  onPolicyDeleted,
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

  const [
    policyDraftOpen,
    setPolicyDraftOpen,
  ] = useState(false);

  const [
    policyDraftBusy,
    setPolicyDraftBusy,
  ] = useState(false);

  const [
    policyDraftError,
    setPolicyDraftError,
  ] = useState<string | null>(
    null,
  );

  const [
    policyActivationBusy,
    setPolicyActivationBusy,
  ] = useState<string | null>(
    null,
  );

  const [
    policyActivationError,
    setPolicyActivationError,
  ] = useState<string | null>(
    null,
  );

  const [
    policyRevocationTarget,
    setPolicyRevocationTarget,
  ] = useState<string | null>(
    null,
  );

  const [
    policyRevocationBusy,
    setPolicyRevocationBusy,
  ] = useState<string | null>(
    null,
  );

  const [
    policyRevocationError,
    setPolicyRevocationError,
  ] = useState<string | null>(
    null,
  );

  const [
    policySupersessionTarget,
    setPolicySupersessionTarget,
  ] = useState<CanonicalReviewPolicyView | null>(
    null,
  );

  const [
    policySupersessionBusy,
    setPolicySupersessionBusy,
  ] = useState(false);

  const [
    policySupersessionError,
    setPolicySupersessionError,
  ] = useState<string | null>(
    null,
  );

  const [
    policySupersessionDraft,
    setPolicySupersessionDraft,
  ] = useState({
    version:
      "",

    title:
      "",

    authority:
      "",

    scope:
      "",

    owner:
      "",

    requireCompleteGovernanceIdentity:
      true,

    requireProvenance:
      true,

    requireValidationPassed:
      true,

    excludedAuthorities:
      "",
  });

  const [
    policyDeletionTarget,
    setPolicyDeletionTarget,
  ] = useState<{
    id: string;
    version: string;
  } | null>(null);

  const [
    policyDeletionActorId,
    setPolicyDeletionActorId,
  ] = useState(
    "human:knowledge-governance",
  );

  const [
    policyDeletionBusy,
    setPolicyDeletionBusy,
  ] = useState(false);

  const [
    policyDeletionError,
    setPolicyDeletionError,
  ] = useState<string | null>(
    null,
  );





  const [
    policyExecutionSnapshots,
    setPolicyExecutionSnapshots,
  ] = useState<
    Record<
      string,
      CanonicalReviewPolicyExecutionSnapshot
    >
  >({});

  const [
    policyExecutionLoading,
    setPolicyExecutionLoading,
  ] = useState<Record<string, boolean>>(
    {},
  );

  const [
    policyExecutionErrors,
    setPolicyExecutionErrors,
  ] = useState<Record<string, string>>(
    {},
  );

  const [
    policyExecutionDetail,
    setPolicyExecutionDetail,
  ] = useState<{
    key: string;
    mode:
      | "eligible"
      | "exceptions";
  } | null>(null);

  const [
    policyExecutionConfirmTarget,
    setPolicyExecutionConfirmTarget,
  ] = useState<string | null>(
    null,
  );

  const [
    policyExecutionBusy,
    setPolicyExecutionBusy,
  ] = useState<string | null>(
    null,
  );

  const [
    policyExecutionError,
    setPolicyExecutionError,
  ] = useState<string | null>(
    null,
  );


  const [
    policyDraft,
    setPolicyDraft,
  ] = useState({
    id:
      "",

    version:
      "",

    title:
      "",

    authority:
      "",

    scope:
      "",

    owner:
      "",

    requireCompleteGovernanceIdentity:
      true,

    requireProvenance:
      true,

    requireValidationPassed:
      true,

    excludedAuthorities:
      "constitutional",
  });



  useEffect(
    () => {
      let cancelled =
        false;

      const activePolicies =
        policySnapshot.policies.filter(
          (policy) =>
            policy.status ===
            "active",
        );

      for (
        const policy
        of activePolicies
      ) {
        const key =
          `${policy.id}@${policy.version}`;

        setPolicyExecutionLoading(
          (current) => ({
            ...current,
            [key]:
              true,
          }),
        );

        void getCanonicalReviewPolicyExecution(
          policy.id,
          policy.version,
        )
          .then(
            (snapshot) => {
              if (cancelled) {
                return;
              }

              setPolicyExecutionSnapshots(
                (current) => ({
                  ...current,
                  [key]:
                    snapshot,
                }),
              );

              setPolicyExecutionErrors(
                (current) => {
                  const next = {
                    ...current,
                  };

                  delete next[key];

                  return next;
                },
              );
            },
          )
          .catch(
            (error) => {
              if (cancelled) {
                return;
              }

              setPolicyExecutionErrors(
                (current) => ({
                  ...current,
                  [key]:
                    error instanceof Error
                      ? error.message
                      : String(error),
                }),
              );
            },
          )
          .finally(
            () => {
              if (cancelled) {
                return;
              }

              setPolicyExecutionLoading(
                (current) => ({
                  ...current,
                  [key]:
                    false,
                }),
              );
            },
          );
      }

      return () => {
        cancelled =
          true;
      };
    },
    [
      policySnapshot.policies,
    ],
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

  async function revokePolicy(
    policyId:
      string,

    version:
      string,
  ) {
    const key =
      `${policyId}@${version}`;

    if (
      policyRevocationBusy
    ) {
      return;
    }

    const actorId =
      reviewerId.trim();

    if (
      !actorId
    ) {
      setPolicyRevocationError(
        "Human authority identity is required to revoke a review policy.",
      );

      return;
    }

    try {
      setPolicyRevocationBusy(
        key,
      );

      setPolicyRevocationError(
        null,
      );

      const result =
        await revokeCanonicalReviewPolicy(
          policyId,
          version,
          {
            actorId,
          },
        );

      onPolicyPersisted?.(
        result.policy,
      );

      setPolicyRevocationTarget(
        null,
      );
    } catch (
      error
    ) {
      setPolicyRevocationError(
        error instanceof Error
          ? error.message
          : String(
              error,
            ),
      );
    } finally {
      setPolicyRevocationBusy(
        null,
      );
    }
  }

  async function activatePolicy(
    policyId:
      string,

    version:
      string,
  ) {
    const key =
      `${policyId}@${version}`;

    if (
      policyActivationBusy
    ) {
      return;
    }

    const actorId =
      reviewerId.trim();

    if (
      !actorId
    ) {
      setPolicyActivationError(
        "Human authority identity is required to activate a review policy.",
      );

      return;
    }

    try {
      setPolicyActivationBusy(
        key,
      );

      setPolicyActivationError(
        null,
      );

      const result =
        await activateCanonicalReviewPolicy(
          policyId,
          version,
          {
            actorId,
          },
        );

      onPolicyPersisted?.(
        result.policy,
      );

      /*
       * Activation response is persisted authoritative state.
       * The polling read model will reconcile in the background.
       */
    } catch (
      error
    ) {
      setPolicyActivationError(
        error instanceof Error
          ? error.message
          : String(
              error,
            ),
      );
    } finally {
      setPolicyActivationBusy(
        null,
      );
    }
  }

  async function createPolicyDraft() {
    if (
      policyDraftBusy
    ) {
      return;
    }

    const id =
      policyDraft.id.trim();

    const version =
      policyDraft.version.trim();

    const title =
      policyDraft.title.trim();

    const authority =
      policyDraft.authority.trim();

    const scope =
      policyDraft.scope.trim();

    const owner =
      policyDraft.owner.trim();

    const missingFields = [
      !id
        ? "Policy ID"
        : null,

      !version
        ? "Version"
        : null,

      !title
        ? "Policy title"
        : null,

      !authority
        ? "Authority"
        : null,

      !scope
        ? "Scope"
        : null,

      !owner
        ? "Owner"
        : null,
    ].filter(
      (
        value,
      ): value is string =>
        value !== null,
    );

    if (
      missingFields.length >
      0
    ) {
      setPolicyDraftError(
        `Required: ${missingFields.join(", ")}.`,
      );

      return;
    }

    try {
      setPolicyDraftBusy(
        true,
      );

      setPolicyDraftError(
        null,
      );

      const result =
        await createCanonicalReviewPolicyDraft({
          id,

          version,

          title,

          authority,

          scope,

          owner,

          rules: {
            requireCompleteGovernanceIdentity:
              policyDraft
                .requireCompleteGovernanceIdentity,

            requireProvenance:
              policyDraft
                .requireProvenance,

            requireValidationPassed:
              policyDraft
                .requireValidationPassed,

            excludedAuthorities:
              policyDraft
                .excludedAuthorities
                .split(",")
                .map(
                  (value) =>
                    value.trim(),
                )
                .filter(
                  Boolean,
                ),
          },
        });

      onPolicyPersisted?.(
        result.policy,
      );

      setPolicyDraft({
        id:
          "",

        version:
          "",

        title:
          "",

        authority:
          "",

        scope:
          "",

        owner:
          "",

        requireCompleteGovernanceIdentity:
          true,

        requireProvenance:
          true,

        requireValidationPassed:
          true,

        excludedAuthorities:
          "constitutional",
      });

      setPolicyDraftOpen(
        false,
      );

      /*
       * The successful POST response is already persisted runtime state.
       * onPolicyPersisted() updates the visible registry immediately.
       *
       * Do not synchronously refetch here: a stale/read-lagging response
       * can overwrite the just-persisted draft before React paints it.
       * The normal Canonical Review polling loop will reconcile shortly.
       */
    } catch (
      error
    ) {
      setPolicyDraftError(
        error instanceof Error
          ? error.message
          : String(
              error,
            ),
      );
    } finally {
      setPolicyDraftBusy(
        false,
      );
    }
  }

  async function supersedePolicy() {
    if (
      !policySupersessionTarget ||
      policySupersessionBusy
    ) {
      return;
    }

    const actorId =
      reviewerId.trim();

    const version =
      policySupersessionDraft
        .version
        .trim();

    const title =
      policySupersessionDraft
        .title
        .trim();

    const authority =
      policySupersessionDraft
        .authority
        .trim();

    const scope =
      policySupersessionDraft
        .scope
        .trim();

    const owner =
      policySupersessionDraft
        .owner
        .trim();

    if (!actorId) {
      setPolicySupersessionError(
        "Human authority identity is required to supersede a review policy.",
      );
      return;
    }

    if (
      !version ||
      !title ||
      !authority ||
      !scope ||
      !owner
    ) {
      setPolicySupersessionError(
        "Version, title, authority, scope, and owner are required.",
      );
      return;
    }

    if (
      version ===
      policySupersessionTarget.version
    ) {
      setPolicySupersessionError(
        "Replacement version must differ from the active policy version.",
      );
      return;
    }

    try {
      setPolicySupersessionBusy(
        true,
      );

      setPolicySupersessionError(
        null,
      );

      const result =
        await supersedeCanonicalReviewPolicy(
          policySupersessionTarget.id,
          policySupersessionTarget.version,
          {
            id:
              policySupersessionTarget.id,

            version,

            title,

            authority,

            scope,

            owner,

            rules: {
              requireCompleteGovernanceIdentity:
                policySupersessionDraft
                  .requireCompleteGovernanceIdentity,

              requireProvenance:
                policySupersessionDraft
                  .requireProvenance,

              requireValidationPassed:
                policySupersessionDraft
                  .requireValidationPassed,

              excludedAuthorities:
                policySupersessionDraft
                  .excludedAuthorities
                  .split(",")
                  .map(
                    (value) =>
                      value.trim(),
                  )
                  .filter(
                    Boolean,
                  ),
            },
          },
          {
            actorId,
          },
        );

      /*
       * Supersession response is already persisted authoritative
       * state. Update both policy versions immediately; normal
       * polling reconciles afterward.
       */
      onPolicyPersisted?.(
        result.previous,
      );

      onPolicyPersisted?.(
        result.replacement,
      );

      setPolicySupersessionTarget(
        null,
      );
    } catch (error) {
      setPolicySupersessionError(
        error instanceof Error
          ? error.message
          : String(error),
      );
    } finally {
      setPolicySupersessionBusy(
        false,
      );
    }
  }

  async function deletePolicyDraft() {
    if (
      !policyDeletionTarget ||
      policyDeletionBusy
    ) {
      return;
    }

    const actorId =
      policyDeletionActorId.trim();

    if (!actorId) {
      setPolicyDeletionError(
        "Deleting human identity is required.",
      );
      return;
    }

    try {
      setPolicyDeletionBusy(
        true,
      );

      setPolicyDeletionError(
        null,
      );

      const target = {
        ...policyDeletionTarget,
      };

      await deleteCanonicalReviewPolicyDraft(
        target.id,
        target.version,
        {
          actorId,
        },
      );

      /*
       * The successful DELETE response is authoritative for
       * this mutation. Remove the persisted draft locally now;
       * normal polling reconciles afterward.
       *
       * Do not synchronously GET and overwrite this mutation.
       */
      onPolicyDeleted?.(
        target.id,
        target.version,
      );

      setPolicyDeletionTarget(
        null,
      );
    } catch (error) {
      setPolicyDeletionError(
        error instanceof Error
          ? error.message
          : String(error),
      );
    } finally {
      setPolicyDeletionBusy(
        false,
      );
    }
  }



  async function executePolicy(
    policy:
      CanonicalReviewPolicyView,
  ) {
    const key =
      `${policy.id}@${policy.version}`;

    if (
      policyExecutionBusy
    ) {
      return;
    }

    const actorId =
      reviewerId.trim();

    if (!actorId) {
      setPolicyExecutionError(
        "Executing human identity is required.",
      );
      return;
    }

    try {
      setPolicyExecutionBusy(
        key,
      );

      setPolicyExecutionError(
        null,
      );

      const result =
        await executeCanonicalReviewPolicy(
          policy.id,
          policy.version,
          {
            actorId,
          },
        );

      if (
        result.promotion !==
        null
      ) {
        throw new Error(
          "policy_execution_illegal_promotion_boundary",
        );
      }

      await onDecisionComplete?.();

      const refreshed =
        await getCanonicalReviewPolicyExecution(
          policy.id,
          policy.version,
        );

      setPolicyExecutionSnapshots(
        (current) => ({
          ...current,
          [key]:
            refreshed,
        }),
      );

      setPolicyExecutionConfirmTarget(
        null,
      );

      setPolicyExecutionDetail(
        null,
      );
    } catch (error) {
      setPolicyExecutionError(
        error instanceof Error
          ? error.message
          : String(error),
      );
    } finally {
      setPolicyExecutionBusy(
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

          <div
            className="relative z-20 mt-4 max-h-[620px] min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-3 pointer-events-auto [scrollbar-gutter:stable] [touch-action:pan-y]"
            aria-label="Governance queue capsules awaiting canonical decision"
            tabIndex={0}
            onWheel={(event) => {
              event.stopPropagation();
            }}
          >
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
            <div className="mt-4 grid gap-3">
              <LuminaFlagshipCard
                as="article"
                className="rounded-[18px] p-4"
              >
                <div className="relative z-10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/68">
                        Policy-governed review
                      </div>

                      <div className="mt-2 text-sm font-semibold text-white">
                        {queueCounts.policy_candidate} policy-eligible packages
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-300/18 bg-emerald-300/[0.05] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-100">
                        {policySnapshot.summary.active} active
                      </span>

                      <span className="rounded-full border border-sky-300/14 bg-sky-300/[0.04] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-sky-100">
                        {policySnapshot.summary.total} total
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-violet-100/64">
                    Policy eligibility requires a separately persisted, active, versioned authority. Eligibility does not itself approve a package or promote Canonical Knowledge.
                  </p>
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard
                as="article"
                className="rounded-[18px] p-4 relative z-20 pointer-events-auto [&_button]:relative [&_button]:z-30 [&_button]:pointer-events-auto [&_input]:relative [&_input]:z-30 [&_input]:pointer-events-auto [&_input]:!bg-slate-950/90 [&_input]:!text-sky-50 [&_input]:!caret-cyan-200 [&_input]:placeholder:!text-slate-500 [&_textarea]:relative [&_textarea]:z-30 [&_textarea]:pointer-events-auto [&_textarea]:!bg-slate-950/90 [&_textarea]:!text-sky-50 [&_textarea]:!caret-cyan-200 [&_textarea]:placeholder:!text-slate-500 [&_label]:relative [&_label]:z-20 [&_label]:pointer-events-auto"
              >
                <div className="relative z-30 pointer-events-auto">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/62">
                        Policy administration
                      </div>

                      <div className="mt-1 text-sm font-semibold text-white">
                        Define governed review authority
                      </div>

                      <p className="mt-1 max-w-2xl text-xs leading-5 text-sky-300/58">
                        New policies are created as drafts only. Draft creation does not authorize review decisions.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPolicyDraftOpen(
                          (current) =>
                            !current,
                        );

                        setPolicyDraftError(
                          null,
                        );
                      }}
                      className="rounded-full border border-cyan-300/28 bg-cyan-300/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-300/[0.13]"
                    >
                      {policyDraftOpen
                        ? "Close draft editor"
                        : "Create draft policy"}
                    </button>
                  </div>

                  {policyDraftOpen ? (
                    <div className="mt-5 grid gap-4">
                      <div className="grid gap-3 lg:grid-cols-3">
                        <label className="grid gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/56">
                            Policy ID
                          </span>

                          <input
                            value={
                              policyDraft.id
                            }
                            onChange={(event) =>
                              setPolicyDraft(
                                (current) => ({
                                  ...current,
                                  id:
                                    event.target.value,
                                }),
                              )
                            }
                            placeholder="POLICY-DOC-LOW-RISK"
                            style={{
                              backgroundColor:
                                "rgba(2, 6, 23, 0.90)",

                              color:
                                "rgb(240, 249, 255)",

                              caretColor:
                                "rgb(165, 243, 252)",

                              WebkitTextFillColor:
                                "rgb(240, 249, 255)",
                            }}
                            className="h-10 rounded-[14px] border border-cyan-300/14 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none placeholder:text-slate-500 focus:border-cyan-300/42"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/56">
                            Version
                          </span>

                          <input
                            value={
                              policyDraft.version
                            }
                            onChange={(event) =>
                              setPolicyDraft(
                                (current) => ({
                                  ...current,
                                  version:
                                    event.target.value,
                                }),
                              )
                            }
                            placeholder="1.0.0"
                            style={{
                              backgroundColor:
                                "rgba(2, 6, 23, 0.90)",

                              color:
                                "rgb(240, 249, 255)",

                              caretColor:
                                "rgb(165, 243, 252)",

                              WebkitTextFillColor:
                                "rgb(240, 249, 255)",
                            }}
                            className="h-10 rounded-[14px] border border-cyan-300/14 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none placeholder:text-slate-500 focus:border-cyan-300/42"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/56">
                            Owner
                          </span>

                          <input
                            value={
                              policyDraft.owner
                            }
                            onChange={(event) =>
                              setPolicyDraft(
                                (current) => ({
                                  ...current,
                                  owner:
                                    event.target.value,
                                }),
                              )
                            }
                            placeholder="Knowledge Governance"
                            style={{
                              backgroundColor:
                                "rgba(2, 6, 23, 0.90)",

                              color:
                                "rgb(240, 249, 255)",

                              caretColor:
                                "rgb(165, 243, 252)",

                              WebkitTextFillColor:
                                "rgb(240, 249, 255)",
                            }}
                            className="h-10 rounded-[14px] border border-cyan-300/14 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none placeholder:text-slate-500 focus:border-cyan-300/42"
                          />
                        </label>
                      </div>

                      <label className="grid gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-300/56">
                          Policy title
                        </span>

                        <input
                          value={
                            policyDraft.title
                          }
                          onChange={(event) =>
                            setPolicyDraft(
                              (current) => ({
                                ...current,
                                title:
                                  event.target.value,
                              }),
                            )
                          }
                          placeholder="Governed documentation review policy"
                          style={{
                            backgroundColor:
                              "rgba(2, 6, 23, 0.90)",

                            color:
                              "rgb(240, 249, 255)",

                            caretColor:
                              "rgb(165, 243, 252)",

                            WebkitTextFillColor:
                              "rgb(240, 249, 255)",
                          }}
                          className="h-10 rounded-[14px] border border-violet-300/14 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none placeholder:text-slate-500 focus:border-violet-300/42"
                        />
                      </label>

                      <div className="grid gap-3 lg:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-300/56">
                            Authority
                          </span>

                          <input
                            value={
                              policyDraft.authority
                            }
                            onChange={(event) =>
                              setPolicyDraft(
                                (current) => ({
                                  ...current,
                                  authority:
                                    event.target.value,
                                }),
                              )
                            }
                            placeholder="architecture-specification"
                            style={{
                              backgroundColor:
                                "rgba(2, 6, 23, 0.90)",

                              color:
                                "rgb(240, 249, 255)",

                              caretColor:
                                "rgb(165, 243, 252)",

                              WebkitTextFillColor:
                                "rgb(240, 249, 255)",
                            }}
                            className="h-10 rounded-[14px] border border-amber-300/14 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none placeholder:text-slate-500 focus:border-amber-300/42"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-300/56">
                            Scope
                          </span>

                          <input
                            value={
                              policyDraft.scope
                            }
                            onChange={(event) =>
                              setPolicyDraft(
                                (current) => ({
                                  ...current,
                                  scope:
                                    event.target.value,
                                }),
                              )
                            }
                            placeholder="platform"
                            style={{
                              backgroundColor:
                                "rgba(2, 6, 23, 0.90)",

                              color:
                                "rgb(240, 249, 255)",

                              caretColor:
                                "rgb(165, 243, 252)",

                              WebkitTextFillColor:
                                "rgb(240, 249, 255)",
                            }}
                            className="h-10 rounded-[14px] border border-amber-300/14 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none placeholder:text-slate-500 focus:border-amber-300/42"
                          />
                        </label>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-3">
                        {[
                          {
                            key:
                              "requireCompleteGovernanceIdentity" as const,

                            label:
                              "Governance identity",
                          },
                          {
                            key:
                              "requireProvenance" as const,

                            label:
                              "Provenance",
                          },
                          {
                            key:
                              "requireValidationPassed" as const,

                            label:
                              "Validation passed",
                          },
                        ].map(
                          (rule) => (
                            <label
                              key={
                                rule.key
                              }
                              className="flex items-center gap-3 rounded-[14px] border border-sky-300/10 bg-slate-950/24 px-3 py-3"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  policyDraft[
                                    rule.key
                                  ]
                                }
                                onChange={(event) =>
                                  setPolicyDraft(
                                    (current) => ({
                                      ...current,
                                      [rule.key]:
                                        event.target.checked,
                                    }),
                                  )
                                }
                                className="h-4 w-4"
                              />

                              <span className="text-xs font-medium text-sky-100/76">
                                Require {rule.label}
                              </span>
                            </label>
                          ),
                        )}
                      </div>

                      <label className="grid gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-rose-300/56">
                          Excluded authorities
                        </span>

                        <input
                          value={
                            policyDraft
                              .excludedAuthorities
                          }
                          onChange={(event) =>
                            setPolicyDraft(
                              (current) => ({
                                ...current,
                                excludedAuthorities:
                                  event.target.value,
                              }),
                            )
                          }
                          placeholder="constitutional"
                          style={{
                            backgroundColor:
                              "rgba(2, 6, 23, 0.90)",

                            color:
                              "rgb(240, 249, 255)",

                            caretColor:
                              "rgb(165, 243, 252)",

                            WebkitTextFillColor:
                              "rgb(240, 249, 255)",
                          }}
                          className="h-10 rounded-[14px] border border-rose-300/14 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none placeholder:text-slate-500 focus:border-rose-300/42"
                        />

                        <span className="text-[10px] text-sky-400/48">
                          Comma-separated authority classes that this policy can never govern.
                        </span>
                      </label>

                      {policyDraftError ? (
                        <div className="rounded-[14px] border border-rose-300/18 bg-rose-300/[0.05] px-3 py-2 text-xs text-rose-100">
                          {policyDraftError}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-[10px] leading-5 text-amber-200/56">
                          Creation persists a draft only. Human activation is a separate governance decision.
                        </div>

                        <button
                          type="button"
                          disabled={
                            policyDraftBusy
                          }
                          onClick={() =>
                            void createPolicyDraft()
                          }
                          className="rounded-full border border-violet-300/28 bg-violet-300/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-100 transition hover:bg-violet-300/[0.14] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {policyDraftBusy
                            ? "Creating draft…"
                            : "Create draft"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </LuminaFlagshipCard>

              {policyActivationError ? (
                <div className="rounded-[14px] border border-rose-300/18 bg-rose-300/[0.05] px-3 py-2 text-xs text-rose-100">
                  {policyActivationError}
                </div>
              ) : null}

              <div
                className="relative z-30 min-h-0 pointer-events-auto"
                aria-label="Persisted review policies"
              >
              {policySnapshot.policies.length >
              0 ? (
                <div className="grid gap-3">
                  {policySnapshot.policies.map(
                  (policy) => {
                    const eligibleCount =
                      projection.reviewQueue.filter(
                        (item) =>
                          item.reviewMode ===
                            "policy_candidate" &&
                          item.policyId ===
                            policy.id,
                      ).length;

                    const policyKey =
                      `${policy.id}@${policy.version}`;

                    const executionSnapshot =
                      policyExecutionSnapshots[
                        policyKey
                      ];

                    const executionLoading =
                      policyExecutionLoading[
                        policyKey
                      ] === true;

                    const executionError =
                      policyExecutionErrors[
                        policyKey
                      ];

                    return (
                      <LuminaFlagshipCard
                        key={`${policy.id}@${policy.version}`}
                        as="article"
                        className="rounded-[18px] p-4"
                      >
                        <div className="relative z-10">
                          <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.35fr)] xl:items-start">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="min-w-0 break-words text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/68 [overflow-wrap:anywhere]">
                                  {policy.id}
                                </span>

                                <span
                                  className={[
                                    "rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]",
                                    policy.status ===
                                    "active"
                                      ? "border-emerald-300/24 bg-emerald-300/[0.07] text-emerald-100"
                                      : policy.status ===
                                          "draft"
                                        ? "border-amber-300/24 bg-amber-300/[0.07] text-amber-100"
                                        : "border-slate-300/18 bg-slate-300/[0.05] text-slate-200",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  {policy.status}
                                </span>
                              </div>

                              <h4 className="mt-2 max-w-[34rem] break-words text-base font-semibold leading-6 text-white [overflow-wrap:anywhere]">
                                {policy.title}
                              </h4>

                              <div className="mt-2 text-xs text-sky-300/62">
                                Version {policy.version}
                                {" · "}
                                {executionSnapshot
                                  ? executionSnapshot
                                      .eligiblePackages
                                  : eligibleCount} eligible packages
                              </div>

                              {policy.supersededBy ? (
                                <div className="mt-1 text-[10px] font-medium text-slate-300/68">
                                  Superseded by {policy.supersededBy}
                                </div>
                              ) : null}

                              {policy.supersedes.length > 0 ? (
                                <div className="mt-1 text-[10px] font-medium text-violet-200/68">
                                  Supersedes {policy.supersedes.join(", ")}
                                </div>
                              ) : null}
                            </div>

                            <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                              <LuminaFlagshipCard
                                as="article"
                                className="rounded-[16px] p-3"
                              >
                                <div className="relative z-10">
                                  <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                                    Authority
                                  </div>

                                  <div className="mt-1 text-xs font-semibold text-cyan-100">
                                    {policy.authority}
                                  </div>
                                </div>
                              </LuminaFlagshipCard>

                              <LuminaFlagshipCard
                                as="article"
                                className="rounded-[16px] p-3"
                              >
                                <div className="relative z-10">
                                  <div className="text-[9px] uppercase tracking-[0.14em] text-violet-300/52">
                                    Scope
                                  </div>

                                  <div className="mt-1 text-xs font-semibold text-violet-100">
                                    {policy.scope}
                                  </div>
                                </div>
                              </LuminaFlagshipCard>

                              <LuminaFlagshipCard
                                as="article"
                                className="rounded-[16px] p-3"
                              >
                                <div className="relative z-10">
                                  <div className="text-[9px] uppercase tracking-[0.14em] text-amber-300/52">
                                    Policy owner
                                  </div>

                                  <div className="mt-1 text-xs font-semibold text-amber-100">
                                    {policy.owner}
                                  </div>
                                </div>
                              </LuminaFlagshipCard>

                              <LuminaFlagshipCard
                                as="article"
                                className="rounded-[16px] p-3"
                              >
                                <div className="relative z-10">
                                  <div className="text-[9px] uppercase tracking-[0.14em] text-emerald-300/52">
                                    Authorized by
                                  </div>

                                  <div className="mt-1 text-xs font-semibold text-emerald-100">
                                    {policy.authorizedBy}
                                  </div>
                                </div>
                              </LuminaFlagshipCard>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 lg:grid-cols-3">
                            <div className="rounded-[14px] border border-sky-300/10 bg-slate-950/24 px-3 py-3">
                              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-300/52">
                                Governance identity
                              </div>

                              <div className="mt-1 text-xs text-sky-100/72">
                                {policy.rules.requireCompleteGovernanceIdentity
                                  ? "Required"
                                  : "Not required"}
                              </div>
                            </div>

                            <div className="rounded-[14px] border border-sky-300/10 bg-slate-950/24 px-3 py-3">
                              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-300/52">
                                Provenance
                              </div>

                              <div className="mt-1 text-xs text-sky-100/72">
                                {policy.rules.requireProvenance
                                  ? "Required"
                                  : "Not required"}
                              </div>
                            </div>

                            <div className="rounded-[14px] border border-sky-300/10 bg-slate-950/24 px-3 py-3">
                              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-300/52">
                                Validation
                              </div>

                              <div className="mt-1 text-xs text-sky-100/72">
                                {policy.rules.requireValidationPassed
                                  ? "Must pass"
                                  : "Not required"}
                              </div>
                            </div>
                          </div>

                          {policy.status ===
                          "draft" ? (
                            <div className="mt-4 rounded-[16px] border border-amber-300/16 bg-amber-300/[0.045] p-4">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-amber-200/64">
                                    Human authorization required
                                  </div>

                                  <div className="mt-1 text-xs leading-5 text-amber-100/68">
                                    This policy is a draft and has no approval authority. Activation is an explicit human governance decision.
                                  </div>

                                  <label className="mt-3 grid max-w-md gap-2">
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/56">
                                      Authorizing human
                                    </span>

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
                                      placeholder="human:knowledge-governance"
                                      style={{
                                        backgroundColor:
                                          "rgba(2, 6, 23, 0.90)",

                                        color:
                                          "rgb(240, 249, 255)",

                                        caretColor:
                                          "rgb(165, 243, 252)",

                                        WebkitTextFillColor:
                                          "rgb(240, 249, 255)",
                                      }}
                                      className="h-10 rounded-[14px] border border-cyan-300/20 bg-slate-950/90 px-3 text-xs font-medium text-sky-50 outline-none placeholder:text-slate-500 focus:border-cyan-300/52 focus:ring-1 focus:ring-cyan-300/20"
                                    />
                                  </label>
                                </div>

                                <button
                                  type="button"
                                  disabled={
                                    policyActivationBusy !==
                                    null
                                  }
                                  onClick={() =>
                                    void activatePolicy(
                                      policy.id,
                                      policy.version,
                                    )
                                  }
                                  className="shrink-0 rounded-full border border-emerald-300/28 bg-emerald-300/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 transition hover:bg-emerald-300/[0.14] disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                  {policyActivationBusy ===
                                  `${policy.id}@${policy.version}`
                                    ? "Activating…"
                                    : "Activate policy"}
                                </button>
                              </div>
                            </div>
                          ) : policy.status ===
                            "active" ? (
                            <div className="mt-4 grid gap-3">
                              <div className="flex flex-wrap items-center gap-2 text-[10px] leading-5 text-emerald-200/58">
                                <span>
                                  Authorized by
                                </span>

                                <span className="font-semibold text-emerald-100">
                                  {policy.authorizedBy}
                                </span>

                                <span className="text-emerald-300/36">
                                  ·
                                </span>

                                <span>
                                  {policy.authorizedAt >
                                  0
                                    ? new Date(
                                        policy.authorizedAt,
                                      ).toLocaleString()
                                    : "authorization timestamp unavailable"}
                                </span>
                              </div>

                              <div className="rounded-[16px] border border-cyan-300/14 bg-cyan-300/[0.035] p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-200/70">
                                      Governed policy execution
                                    </div>

                                    <p className="mt-1 max-w-2xl text-xs leading-5 text-sky-100/62">
                                      Apply this authorized policy only to its exact eligible package set. Execution records explicit package review decisions and cannot promote Canonical Knowledge.
                                    </p>
                                  </div>

                                  {executionLoading ? (
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-200/56">
                                      Evaluating…
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                  {[
                                    {
                                      label:
                                        "Eligible packages",
                                      value:
                                        executionSnapshot
                                          ?.eligiblePackages ??
                                        0,
                                    },
                                    {
                                      label:
                                        "Compliant packages",
                                      value:
                                        executionSnapshot
                                          ?.compliantPackages ??
                                        0,
                                    },
                                    {
                                      label:
                                        "Exceptions",
                                      value:
                                        executionSnapshot
                                          ?.exceptions ??
                                        0,
                                    },
                                    {
                                      label:
                                        "Blocked",
                                      value:
                                        executionSnapshot
                                          ?.blocked ??
                                        0,
                                    },
                                  ].map(
                                    (metric) => (
                                      <div
                                        key={metric.label}
                                        className="rounded-[14px] border border-sky-300/10 bg-slate-950/28 px-3 py-3"
                                      >
                                        <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-sky-300/52">
                                          {metric.label}
                                        </div>

                                        <div className="mt-1 text-lg font-semibold text-sky-50">
                                          {metric.value}
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>

                                {executionError ? (
                                  <div className="mt-3 rounded-[12px] border border-rose-300/18 bg-rose-300/[0.05] px-3 py-2 text-xs text-rose-100">
                                    {executionError}
                                  </div>
                                ) : null}

                                {policyExecutionDetail?.key ===
                                  policyKey ? (
                                  <div className="mt-3 rounded-[14px] border border-sky-300/12 bg-slate-950/32 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-200/66">
                                        {policyExecutionDetail.mode ===
                                        "eligible"
                                          ? "Eligible package set"
                                          : "Policy exceptions"}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPolicyExecutionDetail(
                                            null,
                                          )
                                        }
                                        className="text-[9px] font-semibold uppercase tracking-[0.12em] text-sky-300/54 transition hover:text-sky-100"
                                      >
                                        Close
                                      </button>
                                    </div>

                                    <div className="mt-3 grid gap-2">
                                      {(
                                        executionSnapshot
                                          ?.evaluations ??
                                        []
                                      )
                                        .filter(
                                          (evaluation) =>
                                            policyExecutionDetail.mode ===
                                            "eligible"
                                              ? evaluation.eligible
                                              : evaluation
                                                  .exceptions
                                                  .length >
                                                0,
                                        )
                                        .map(
                                          (
                                            evaluation,
                                          ) => (
                                            <div
                                              key={
                                                evaluation.packageId
                                              }
                                              className="rounded-[12px] border border-sky-300/10 bg-slate-950/24 px-3 py-2"
                                            >
                                              <div className="break-words text-xs font-semibold text-sky-50 [overflow-wrap:anywhere]">
                                                {
                                                  evaluation.packageId
                                                }
                                              </div>

                                              <div className="mt-1 text-[10px] text-sky-300/58">
                                                {
                                                  evaluation.compliant
                                                    ? "Compliant"
                                                    : evaluation.blocked
                                                      ? "Blocked"
                                                      : "Exception"
                                                }
                                              </div>

                                              {evaluation
                                                .exceptions
                                                .length >
                                              0 ? (
                                                <div className="mt-1 text-[10px] leading-5 text-amber-200/64">
                                                  {evaluation.exceptions.join(
                                                    " · ",
                                                  )}
                                                </div>
                                              ) : null}
                                            </div>
                                          ),
                                        )}

                                      {(
                                        executionSnapshot
                                          ?.evaluations ??
                                        []
                                      ).filter(
                                        (evaluation) =>
                                          policyExecutionDetail.mode ===
                                          "eligible"
                                            ? evaluation.eligible
                                            : evaluation
                                                .exceptions
                                                .length >
                                              0,
                                      ).length ===
                                      0 ? (
                                        <div className="text-xs text-sky-300/48">
                                          No packages in this set.
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : null}

                                {policyExecutionConfirmTarget ===
                                policyKey ? (
                                  <div className="mt-3 rounded-[16px] border border-emerald-300/18 bg-emerald-300/[0.045] p-4">
                                    <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-200/72">
                                      Execute governed policy
                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-emerald-100/68">
                                      This creates explicit Canonical Review approval decisions for the compliant package set. It does not create or promote Canonical Knowledge.
                                    </p>

                                    <label className="mt-3 grid max-w-md gap-2">
                                      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/56">
                                        Executing human
                                      </span>

                                      <input
                                        value={reviewerId}
                                        onChange={(
                                          event,
                                        ) =>
                                          setReviewerId(
                                            event.target.value,
                                          )
                                        }
                                        placeholder="human:knowledge-governance"
                                        style={{
                                          backgroundColor:
                                            "rgba(2, 6, 23, 0.90)",
                                          color:
                                            "rgb(240, 249, 255)",
                                          caretColor:
                                            "rgb(165, 243, 252)",
                                          WebkitTextFillColor:
                                            "rgb(240, 249, 255)",
                                        }}
                                        className="h-10 rounded-[14px] border border-cyan-300/20 bg-slate-950/90 px-3 text-xs font-medium text-sky-50 outline-none placeholder:text-slate-500 focus:border-cyan-300/52 focus:ring-1 focus:ring-cyan-300/20"
                                      />
                                    </label>

                                    {policyExecutionError ? (
                                      <div className="mt-3 rounded-[12px] border border-rose-300/18 bg-rose-300/[0.05] px-3 py-2 text-xs text-rose-100">
                                        {policyExecutionError}
                                      </div>
                                    ) : null}

                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        disabled={
                                          policyExecutionBusy !==
                                          null
                                        }
                                        onClick={() =>
                                          void executePolicy(
                                            policy,
                                          )
                                        }
                                        className="rounded-full border border-emerald-300/30 bg-emerald-300/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 transition hover:bg-emerald-300/[0.15] disabled:cursor-not-allowed disabled:opacity-45"
                                      >
                                        {policyExecutionBusy ===
                                        policyKey
                                          ? "Executing…"
                                          : "Confirm execution"}
                                      </button>

                                      <button
                                        type="button"
                                        disabled={
                                          policyExecutionBusy !==
                                          null
                                        }
                                        onClick={() => {
                                          setPolicyExecutionConfirmTarget(
                                            null,
                                          );

                                          setPolicyExecutionError(
                                            null,
                                          );
                                        }}
                                        className="rounded-full border border-sky-300/16 bg-slate-950/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200/72 transition hover:border-sky-300/30"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={
                                        !executionSnapshot ||
                                        executionSnapshot
                                          .eligiblePackages ===
                                          0
                                      }
                                      onClick={() =>
                                        setPolicyExecutionDetail({
                                          key:
                                            policyKey,

                                          mode:
                                            "eligible",
                                        })
                                      }
                                      className="rounded-full border border-cyan-300/22 bg-cyan-300/[0.055] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100/82 transition hover:border-cyan-300/38 hover:bg-cyan-300/[0.09] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Inspect eligible set
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        !executionSnapshot ||
                                        executionSnapshot
                                          .exceptions ===
                                          0
                                      }
                                      onClick={() =>
                                        setPolicyExecutionDetail({
                                          key:
                                            policyKey,

                                          mode:
                                            "exceptions",
                                        })
                                      }
                                      className="rounded-full border border-amber-300/22 bg-amber-300/[0.055] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100/82 transition hover:border-amber-300/38 hover:bg-amber-300/[0.09] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Review exceptions
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        !executionSnapshot ||
                                        executionSnapshot
                                          .compliantPackages ===
                                          0
                                      }
                                      onClick={() => {
                                        setPolicyExecutionError(
                                          null,
                                        );

                                        setPolicyExecutionConfirmTarget(
                                          policyKey,
                                        );
                                      }}
                                      className="rounded-full border border-emerald-300/26 bg-emerald-300/[0.07] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 transition hover:border-emerald-300/42 hover:bg-emerald-300/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Execute governed policy
                                    </button>
                                  </div>
                                )}
                              </div>

                              {policySupersessionTarget?.id ===
                                policy.id &&
                              policySupersessionTarget?.version ===
                                policy.version ? (
                                <div className="rounded-[16px] border border-violet-300/18 bg-violet-300/[0.045] p-4">
                                  <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-violet-200/70">
                                    Supersede active policy
                                  </div>

                                  <p className="mt-2 text-xs leading-5 text-violet-100/68">
                                    Create and authorize a replacement version without mutating the active version. The current policy becomes superseded and remains permanent governance history.
                                  </p>

                                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                                    <label className="grid gap-2">
                                      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-300/58">
                                        New version
                                      </span>

                                      <input
                                        value={policySupersessionDraft.version}
                                        onChange={(event) =>
                                          setPolicySupersessionDraft(
                                            (current) => ({
                                              ...current,
                                              version:
                                                event.target.value,
                                            }),
                                          )
                                        }
                                        style={{
                                          backgroundColor:
                                            "rgba(2, 6, 23, 0.90)",
                                          color:
                                            "rgb(240, 249, 255)",
                                          caretColor:
                                            "rgb(165, 243, 252)",
                                          WebkitTextFillColor:
                                            "rgb(240, 249, 255)",
                                        }}
                                        className="h-10 rounded-[14px] border border-violet-300/20 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none focus:border-violet-300/52"
                                      />
                                    </label>

                                    <label className="grid gap-2 lg:col-span-2">
                                      <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-300/58">
                                        Policy title
                                      </span>

                                      <input
                                        value={policySupersessionDraft.title}
                                        onChange={(event) =>
                                          setPolicySupersessionDraft(
                                            (current) => ({
                                              ...current,
                                              title:
                                                event.target.value,
                                            }),
                                          )
                                        }
                                        style={{
                                          backgroundColor:
                                            "rgba(2, 6, 23, 0.90)",
                                          color:
                                            "rgb(240, 249, 255)",
                                          caretColor:
                                            "rgb(165, 243, 252)",
                                          WebkitTextFillColor:
                                            "rgb(240, 249, 255)",
                                        }}
                                        className="h-10 rounded-[14px] border border-violet-300/20 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none focus:border-violet-300/52"
                                      />
                                    </label>
                                  </div>

                                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                                    {[
                                      ["authority", "Authority"],
                                      ["scope", "Scope"],
                                      ["owner", "Owner"],
                                    ].map(([key, label]) => (
                                      <label
                                        key={key}
                                        className="grid gap-2"
                                      >
                                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/56">
                                          {label}
                                        </span>

                                        <input
                                          value={
                                            policySupersessionDraft[
                                              key as
                                                | "authority"
                                                | "scope"
                                                | "owner"
                                            ]
                                          }
                                          onChange={(event) =>
                                            setPolicySupersessionDraft(
                                              (current) => ({
                                                ...current,
                                                [key]:
                                                  event.target.value,
                                              }),
                                            )
                                          }
                                          style={{
                                            backgroundColor:
                                              "rgba(2, 6, 23, 0.90)",
                                            color:
                                              "rgb(240, 249, 255)",
                                            caretColor:
                                              "rgb(165, 243, 252)",
                                            WebkitTextFillColor:
                                              "rgb(240, 249, 255)",
                                          }}
                                          className="h-10 rounded-[14px] border border-cyan-300/20 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none focus:border-cyan-300/52"
                                        />
                                      </label>
                                    ))}
                                  </div>

                                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                                    {[
                                      {
                                        key:
                                          "requireCompleteGovernanceIdentity" as const,
                                        label:
                                          "Governance identity",
                                      },
                                      {
                                        key:
                                          "requireProvenance" as const,
                                        label:
                                          "Provenance",
                                      },
                                      {
                                        key:
                                          "requireValidationPassed" as const,
                                        label:
                                          "Validation passed",
                                      },
                                    ].map((rule) => (
                                      <label
                                        key={rule.key}
                                        className="flex items-center gap-3 rounded-[14px] border border-sky-300/10 bg-slate-950/24 px-3 py-3"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            policySupersessionDraft[
                                              rule.key
                                            ]
                                          }
                                          onChange={(event) =>
                                            setPolicySupersessionDraft(
                                              (current) => ({
                                                ...current,
                                                [rule.key]:
                                                  event.target.checked,
                                              }),
                                            )
                                          }
                                          className="h-4 w-4"
                                        />

                                        <span className="text-xs font-medium text-sky-100/76">
                                          Require {rule.label}
                                        </span>
                                      </label>
                                    ))}
                                  </div>

                                  <label className="mt-3 grid gap-2">
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-rose-300/58">
                                      Excluded authorities
                                    </span>

                                    <input
                                      value={
                                        policySupersessionDraft
                                          .excludedAuthorities
                                      }
                                      onChange={(event) =>
                                        setPolicySupersessionDraft(
                                          (current) => ({
                                            ...current,
                                            excludedAuthorities:
                                              event.target.value,
                                          }),
                                        )
                                      }
                                      style={{
                                        backgroundColor:
                                          "rgba(2, 6, 23, 0.90)",
                                        color:
                                          "rgb(240, 249, 255)",
                                        caretColor:
                                          "rgb(165, 243, 252)",
                                        WebkitTextFillColor:
                                          "rgb(240, 249, 255)",
                                      }}
                                      className="h-10 rounded-[14px] border border-rose-300/20 bg-slate-950/90 px-3 text-xs text-sky-50 outline-none focus:border-rose-300/52"
                                    />
                                  </label>

                                  <label className="mt-3 grid max-w-md gap-2">
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/56">
                                      Authorizing human
                                    </span>

                                    <input
                                      value={reviewerId}
                                      onChange={(event) =>
                                        setReviewerId(
                                          event.target.value,
                                        )
                                      }
                                      placeholder="human:knowledge-governance"
                                      style={{
                                        backgroundColor:
                                          "rgba(2, 6, 23, 0.90)",
                                        color:
                                          "rgb(240, 249, 255)",
                                        caretColor:
                                          "rgb(165, 243, 252)",
                                        WebkitTextFillColor:
                                          "rgb(240, 249, 255)",
                                      }}
                                      className="h-10 rounded-[14px] border border-cyan-300/20 bg-slate-950/90 px-3 text-xs font-medium text-sky-50 outline-none placeholder:text-slate-500 focus:border-cyan-300/52 focus:ring-1 focus:ring-cyan-300/20"
                                    />
                                  </label>

                                  {policySupersessionError ? (
                                    <div className="mt-3 rounded-[14px] border border-rose-300/18 bg-rose-300/[0.05] px-3 py-2 text-xs text-rose-100">
                                      {policySupersessionError}
                                    </div>
                                  ) : null}

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={policySupersessionBusy}
                                      onClick={() =>
                                        void supersedePolicy()
                                      }
                                      className="rounded-full border border-violet-300/30 bg-violet-300/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-100 transition hover:bg-violet-300/[0.15] disabled:cursor-not-allowed disabled:opacity-45"
                                    >
                                      {policySupersessionBusy
                                        ? "Superseding…"
                                        : "Authorize replacement"}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={policySupersessionBusy}
                                      onClick={() => {
                                        setPolicySupersessionTarget(
                                          null,
                                        );
                                        setPolicySupersessionError(
                                          null,
                                        );
                                      }}
                                      className="rounded-full border border-sky-300/16 bg-slate-950/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200/72 transition hover:border-sky-300/30"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPolicyRevocationTarget(
                                      null,
                                    );

                                    setPolicySupersessionError(
                                      null,
                                    );

                                    setPolicySupersessionTarget(
                                      policy,
                                    );

                                    setPolicySupersessionDraft({
                                      version:
                                        nextPolicyVersion(
                                          policy.version,
                                        ),

                                      title:
                                        policy.title,

                                      authority:
                                        policy.authority,

                                      scope:
                                        policy.scope,

                                      owner:
                                        policy.owner,

                                      requireCompleteGovernanceIdentity:
                                        policy.rules
                                          .requireCompleteGovernanceIdentity,

                                      requireProvenance:
                                        policy.rules
                                          .requireProvenance,

                                      requireValidationPassed:
                                        policy.rules
                                          .requireValidationPassed,

                                      excludedAuthorities:
                                        policy.rules
                                          .excludedAuthorities
                                          .join(", "),
                                    });
                                  }}
                                  className="rounded-full border border-violet-300/24 bg-violet-300/[0.06] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-100/84 transition hover:border-violet-300/40 hover:bg-violet-300/[0.1]"
                                >
                                  Supersede policy
                                </button>
                              )}

                              {policyRevocationTarget ===
                              `${policy.id}@${policy.version}` ? (
                                <div className="rounded-[16px] border border-rose-300/18 bg-rose-300/[0.045] p-4">
                                  <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-rose-200/70">
                                    Revoke active policy
                                  </div>

                                  <p className="mt-2 text-xs leading-5 text-rose-100/68">
                                    Revocation removes this policy from active review authority. It does not revoke previously recorded package decisions or mutate Canonical Knowledge.
                                  </p>

                                  <label className="mt-3 grid max-w-md gap-2">
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/56">
                                      Revoking human
                                    </span>

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
                                      placeholder="human:knowledge-governance"
                                      style={{
                                        backgroundColor:
                                          "rgba(2, 6, 23, 0.90)",

                                        color:
                                          "rgb(240, 249, 255)",

                                        caretColor:
                                          "rgb(165, 243, 252)",

                                        WebkitTextFillColor:
                                          "rgb(240, 249, 255)",
                                      }}
                                      className="h-10 rounded-[14px] border border-cyan-300/20 bg-slate-950/90 px-3 text-xs font-medium text-sky-50 outline-none placeholder:text-slate-500 focus:border-cyan-300/52 focus:ring-1 focus:ring-cyan-300/20"
                                    />
                                  </label>

                                  {policyRevocationError ? (
                                    <div className="mt-3 rounded-[14px] border border-rose-300/18 bg-rose-300/[0.05] px-3 py-2 text-xs text-rose-100">
                                      {policyRevocationError}
                                    </div>
                                  ) : null}

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      disabled={
                                        policyRevocationBusy !==
                                        null
                                      }
                                      onClick={() =>
                                        void revokePolicy(
                                          policy.id,
                                          policy.version,
                                        )
                                      }
                                      className="rounded-full border border-rose-300/30 bg-rose-300/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100 transition hover:bg-rose-300/[0.15] disabled:cursor-not-allowed disabled:opacity-45"
                                    >
                                      {policyRevocationBusy ===
                                      `${policy.id}@${policy.version}`
                                        ? "Revoking…"
                                        : "Confirm revocation"}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        policyRevocationBusy !==
                                        null
                                      }
                                      onClick={() => {
                                        setPolicyRevocationTarget(
                                          null,
                                        );

                                        setPolicyRevocationError(
                                          null,
                                        );
                                      }}
                                      className="rounded-full border border-sky-300/16 bg-slate-950/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200/72 transition hover:border-sky-300/30"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPolicyRevocationTarget(
                                        `${policy.id}@${policy.version}`,
                                      );

                                      setPolicyRevocationError(
                                        null,
                                      );
                                    }}
                                    className="rounded-full border border-rose-300/22 bg-rose-300/[0.055] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100/82 transition hover:border-rose-300/38 hover:bg-rose-300/[0.09]"
                                  >
                                    Revoke policy
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : null}

                        </div>

                        {policy.status === "draft" ? (
                          <div className="mt-4 border-t border-sky-300/10 pt-4">
                            {policyDeletionTarget?.id ===
                              policy.id &&
                            policyDeletionTarget?.version ===
                              policy.version ? (
                              <div className="rounded-[16px] border border-rose-300/18 bg-rose-300/[0.05] p-4">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200/72">
                                  Delete draft policy
                                </div>

                                <p className="mt-2 text-xs leading-5 text-rose-100/68">
                                  This permanently removes{" "}
                                  <span className="font-semibold text-rose-100">
                                    {policy.id}@{policy.version}
                                  </span>
                                  . Only unused, never-authorized drafts can be deleted.
                                </p>

                                <label className="mt-4 grid gap-2">
                                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-rose-300/58">
                                    Deleting human
                                  </span>

                                  <input
                                    value={
                                      policyDeletionActorId
                                    }
                                    onChange={(event) =>
                                      setPolicyDeletionActorId(
                                        event.target.value,
                                      )
                                    }
                                    placeholder="human:knowledge-governance"
                                    style={{
                                      backgroundColor:
                                        "rgba(2, 6, 23, 0.90)",

                                      color:
                                        "rgb(240, 249, 255)",

                                      caretColor:
                                        "rgb(165, 243, 252)",

                                      WebkitTextFillColor:
                                        "rgb(240, 249, 255)",
                                    }}
                                    className="h-10 rounded-[14px] border border-rose-300/20 bg-slate-950/90 px-3 text-xs font-medium text-sky-50 outline-none placeholder:text-slate-500 focus:border-rose-300/52 focus:ring-1 focus:ring-rose-300/20"
                                  />
                                </label>

                                {policyDeletionError ? (
                                  <div className="mt-3 rounded-[12px] border border-rose-300/18 bg-rose-300/[0.05] px-3 py-2 text-xs text-rose-100">
                                    {policyDeletionError}
                                  </div>
                                ) : null}

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={
                                      policyDeletionBusy
                                    }
                                    onClick={() =>
                                      void deletePolicyDraft()
                                    }
                                    className="rounded-full border border-rose-300/32 bg-rose-300/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100 transition hover:bg-rose-300/[0.15] disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    {policyDeletionBusy
                                      ? "Deleting…"
                                      : "Permanently delete"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      policyDeletionBusy
                                    }
                                    onClick={() => {
                                      setPolicyDeletionTarget(
                                        null,
                                      );

                                      setPolicyDeletionError(
                                        null,
                                      );
                                    }}
                                    className="rounded-full border border-sky-300/14 bg-slate-950/24 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200/72 transition hover:border-sky-300/28 hover:text-sky-100 disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setPolicyDeletionTarget({
                                    id:
                                      policy.id,

                                    version:
                                      policy.version,
                                  });

                                  setPolicyDeletionError(
                                    null,
                                  );
                                }}
                                className="rounded-full border border-rose-300/22 bg-rose-300/[0.05] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100/84 transition hover:border-rose-300/38 hover:bg-rose-300/[0.1]"
                              >
                                Delete policy
                              </button>
                            )}
                          </div>
                        ) : null}

</LuminaFlagshipCard>
                    );
                  },
                )}
                </div>
              ) : (
                <div className="rounded-[18px] border border-violet-300/12 bg-violet-300/[0.035] px-4 py-5">
                  <div className="text-sm font-semibold text-violet-100">
                    No governed review policies exist
                  </div>

                  <p className="mt-2 max-w-3xl text-xs leading-5 text-violet-100/58">
                    The policy registry is empty. No package can obtain policy-governed approval authority until a versioned policy is explicitly created and authorized.
                  </p>
                </div>
              )}
              </div>
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
                <div className="grid min-w-0 gap-4">
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

                  <div className="grid min-w-0 w-full gap-2 sm:grid-cols-2">
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
                  className="block min-w-0 w-full overflow-hidden text-left"
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
