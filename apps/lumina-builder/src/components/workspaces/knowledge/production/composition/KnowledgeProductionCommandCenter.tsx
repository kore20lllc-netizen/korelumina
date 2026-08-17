import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BookOpenCheck,
  Boxes,
  GitBranch,
  Network,
  ShieldCheck,
  Target,
  Workflow,
} from "lucide-react";

import {
  KnowledgeCapsuleFlowEngine,
  KnowledgeCapsuleInspector,
} from "../capsules";

import {
  KnowledgeDistributionHub,
} from "../distribution";

import {
  CanonicalKnowledge,
} from "../canonical";

import {
  CanonicalReview,
} from "../governance";

import {
  OrganizationalMemory,
} from "../memory";

import {
  ConsumerIntelligence,
} from "../intelligence";

import {
  KnowledgeGenealogy,
} from "../genealogy";

import {
  OrganizationalImpact,
} from "../impact";

import {
  ProductionKnowledgeGraph,
} from "../graph";

import {
  LuminaSectionNavigator,
} from "@/components/lumina/workspace/primitives/LuminaSectionNavigator";

import {
  createOrganizationalMemoryProjection,
  emptyOrganizationalMemoryProjection,
} from "../data/organizationalMemoryProjection";

import type {
  OrganizationalMemoryProjection,
} from "../data/organizationalMemoryProjection";

import {
  createCanonicalKnowledgeProjection,
  emptyCanonicalKnowledgeProjection,
} from "../data/canonicalKnowledgeProjection";

import type {
  CanonicalKnowledgeProjection,
} from "../data/canonicalKnowledgeProjection";

import {
  createKnowledgeCapsuleProductionProjection,
  emptyKnowledgeCapsuleProductionProjection,
} from "../data/knowledgeCapsuleProjection";

import type {
  KnowledgeCapsuleProductionProjection,
} from "../data/knowledgeCapsuleProjection";

import {
  createKnowledgeDistributionProjection,
  emptyKnowledgeDistributionProjection,
} from "../data/knowledgeDistributionProjection";

import type {
  KnowledgeDistributionProjection,
} from "../data/knowledgeDistributionProjection";

import {
  createOrganizationalImpactProjection,
} from "../data/organizationalImpactProjection";

import {
  createCanonicalReviewProjection,
} from "../data/canonicalReviewProjection";

import type {
  CanonicalReviewProjection,
} from "../data/canonicalReviewProjection";

import {
  getCanonicalReviewPolicies,
  getCanonicalReviewSnapshot,
  getKnowledgeProductionLifecycleSnapshot,
} from "@/services/knowledgeOperationsService";

import type {
  CanonicalReviewPolicySnapshot,
  CanonicalReviewPolicyView,
} from "@/services/knowledgeOperationsService";

type KnowledgeSelectionKind =
  | "capsule"
  | "station"
  | "graph-node"
  | "graph-edge"
  | "timeline-event"
  | "genealogy-node"
  | "impact-outcome"
  | "distribution-consumer"
  | "distribution-event"
  | "distribution-genealogy-summary"
  | "consumer-intelligence"
  | "memory-projection"
  | "canonical-review"
  | "canonical-knowledge"
  | "canonical-review-event";

interface KnowledgeProductionSelection {
  capsuleId: string;
  kind: KnowledgeSelectionKind;
  stationId?: string;
  graphNodeId?: string;
  graphEdgeId?: string;
  timelineEventId?: string;
  genealogyNodeId?: string;
  impactOutcomeId?: string;
  consumerId?: string;
  distributionEventId?: string;
  distributionGenealogySummaryId?: string;
  intelligenceConsumerId?: string;
  memoryProjectionId?: string;
  canonicalReviewId?: string;
  canonicalKnowledgeId?: string;
  canonicalReviewEventId?: string;
}

function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches
    ? "auto"
    : "smooth";
}

const PRODUCTION_SECTIONS = [
  {
    id: "knowledge-flow-engine",
    label: "Flow Engine",
    icon: Workflow,
  },
  {
    id: "canonical-review",
    label: "Canonical Review",
    icon: ShieldCheck,
  },
  {
    id: "canonical-knowledge",
    label: "Canonical Knowledge",
    icon: BookOpenCheck,
  },
  {
    id: "knowledge-graph",
    label: "Knowledge Graph",
    icon: Network,
  },
  {
    id: "organizational-memory",
    label: "Organizational Memory",
    icon: Boxes,
  },
  {
    id: "knowledge-distribution",
    label: "Distribution",
    icon: GitBranch,
  },
  {
    id: "knowledge-genealogy",
    label: "Knowledge Genealogy",
    icon: GitBranch,
  },
  {
    id: "organizational-impact",
    label: "Organizational Impact",
    icon: Target,
  },
] as const;

export function KnowledgeProductionCommandCenter() {
  const [
    selection,
    setSelection,
  ] = useState<KnowledgeProductionSelection | null>(
    null,
  );

  const [
    organizationalMemoryProjection,
    setOrganizationalMemoryProjection,
  ] = useState<OrganizationalMemoryProjection>(
    () =>
      emptyOrganizationalMemoryProjection,
  );

  const [
    canonicalKnowledgeProjection,
    setCanonicalKnowledgeProjection,
  ] = useState<CanonicalKnowledgeProjection>(
    () =>
      emptyCanonicalKnowledgeProjection,
  );

  const [
    knowledgeCapsuleProjection,
    setKnowledgeCapsuleProjection,
  ] = useState<KnowledgeCapsuleProductionProjection>(
    () =>
      emptyKnowledgeCapsuleProductionProjection,
  );

  const [
    knowledgeDistributionProjection,
    setKnowledgeDistributionProjection,
  ] = useState<KnowledgeDistributionProjection>(
    () =>
      emptyKnowledgeDistributionProjection,
  );

  const [
    canonicalReviewPolicySnapshot,
    setCanonicalReviewPolicySnapshot,
  ] = useState<CanonicalReviewPolicySnapshot>({
    ok:
      true,

    policies:
      [],

    summary: {
      total:
        0,

      active:
        0,

      draft:
        0,

      revoked:
        0,

      superseded:
        0,
    },
  });

  const [
    canonicalReviewProjection,
    setCanonicalReviewProjection,
  ] = useState<CanonicalReviewProjection>(
    () =>
      createCanonicalReviewProjection({
        ok: true,
        packages: [],
        summary: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          remediationRequired: 0,
        },
      }),
  );

  useEffect(() => {
    let cancelled = false;

    async function refreshKnowledgeCapsules() {
      try {
        const snapshot =
          await getKnowledgeProductionLifecycleSnapshot();

        if (
          cancelled
        ) {
          return;
        }

        const capsuleProjection =
          createKnowledgeCapsuleProductionProjection(
            snapshot,
          );

        setKnowledgeCapsuleProjection(
          capsuleProjection,
        );

        setKnowledgeDistributionProjection(
          createKnowledgeDistributionProjection(
            capsuleProjection.capsules,
          ),
        );

        setCanonicalKnowledgeProjection(
          createCanonicalKnowledgeProjection(
            snapshot,
          ),
        );

        setOrganizationalMemoryProjection(
          createOrganizationalMemoryProjection(
            snapshot,
          ),
        );
      } catch {
        /*
         * Preserve the last truthful lifecycle projection.
         * Never fall back to fixture packages.
         */
      }
    }

    void refreshKnowledgeCapsules();

    const intervalId =
      window.setInterval(
        () => {
          void refreshKnowledgeCapsules();
        },
        10_000,
      );

    return () => {
      cancelled =
        true;

      window.clearInterval(
        intervalId,
      );
    };
  }, []);

  const handleCanonicalReviewPolicyPersisted =
    useCallback(
      (
        policy:
          CanonicalReviewPolicyView,
      ) => {
        setCanonicalReviewPolicySnapshot(
          (current) => {
            const nextPolicies = [
              policy,
              ...current.policies.filter(
                (existing) =>
                  !(
                    existing.id ===
                      policy.id &&
                    existing.version ===
                      policy.version
                  ),
              ),
            ];

            return {
              ok:
                true,

              policies:
                nextPolicies,

              summary: {
                total:
                  nextPolicies.length,

                active:
                  nextPolicies.filter(
                    (item) =>
                      item.status ===
                      "active",
                  ).length,

                draft:
                  nextPolicies.filter(
                    (item) =>
                      item.status ===
                      "draft",
                  ).length,

                revoked:
                  nextPolicies.filter(
                    (item) =>
                      item.status ===
                      "revoked",
                  ).length,

                superseded:
                  nextPolicies.filter(
                    (item) =>
                      item.status ===
                      "superseded",
                  ).length,
              },
            };
          },
        );
      },
      [],
    );

  const handleCanonicalReviewPolicyDeleted =
    useCallback(
      (
        policyId: string,
        version: string,
      ) => {
        setCanonicalReviewPolicySnapshot(
          (current) => {
            const policies =
              current.policies.filter(
                (policy) =>
                  !(
                    policy.id === policyId &&
                    policy.version === version
                  ),
              );

            return {
              ok:
                true,

              policies,

              summary: {
                total:
                  policies.length,

                active:
                  policies.filter(
                    (policy) =>
                      policy.status ===
                      "active",
                  ).length,

                draft:
                  policies.filter(
                    (policy) =>
                      policy.status ===
                      "draft",
                  ).length,

                revoked:
                  policies.filter(
                    (policy) =>
                      policy.status ===
                      "revoked",
                  ).length,

                superseded:
                  policies.filter(
                    (policy) =>
                      policy.status ===
                      "superseded",
                  ).length,
              },
            };
          },
        );
      },
      [],
    );

  const refreshCanonicalReviewNow =
    useCallback(
      async () => {
        const reviewRefresh =
          getCanonicalReviewSnapshot()
            .then(
              (snapshot) => {
                setCanonicalReviewProjection(
                  createCanonicalReviewProjection(
                    snapshot,
                  ),
                );
              },
            )
            .catch(
              () => {
                /*
                 * Preserve the last truthful Canonical Review
                 * projection when its read boundary fails.
                 */
              },
            );

        const policyRefresh =
          getCanonicalReviewPolicies()
            .then(
              (policySnapshot) => {
                setCanonicalReviewPolicySnapshot(
                  policySnapshot,
                );
              },
            )
            .catch(
              () => {
                /*
                 * Preserve the last truthful Policy Registry
                 * projection independently of Canonical Review.
                 */
              },
            );

        await Promise.allSettled([
          reviewRefresh,
          policyRefresh,
        ]);
      },
      [],
    );

  useEffect(() => {
    let cancelled = false;

    async function refreshCanonicalReview() {
      try {
        if (
          cancelled
        ) {
          return;
        }

        await refreshCanonicalReviewNow();
      } catch {
        /*
         * Preserve the last truthful projection.
         * Never fall back to fixture governance data.
         */
      }
    }

    void refreshCanonicalReview();

    const intervalId =
      window.setInterval(
        () => {
          void refreshCanonicalReview();
        },
        10_000,
      );

    return () => {
      cancelled = true;

      window.clearInterval(
        intervalId,
      );
    };
  }, [
    refreshCanonicalReviewNow,
  ]);

  const inspectorClosedByUserRef =
    useRef(false);
  const revealInspectorRef =
    useRef(false);

  const selectedCapsuleId =
    selection?.capsuleId ?? "";

  const organizationalImpactProjection =
    useMemo(
      () =>
        createOrganizationalImpactProjection(
          knowledgeCapsuleProjection.capsules,
          knowledgeDistributionProjection.records,
        ),
      [
        knowledgeCapsuleProjection.capsules,
        knowledgeDistributionProjection.records,
      ],
    );

  const selectedCapsule = useMemo(
    () =>
      knowledgeCapsuleProjection
        .capsules
        .find(
          (capsule) =>
            capsule.id ===
            selectedCapsuleId,
        ) ??
      null,
    [
      knowledgeCapsuleProjection
        .capsules,
      selectedCapsuleId,
    ],
  );

  useEffect(() => {
    if (
      !revealInspectorRef.current ||
      !selectedCapsuleId ||
      !selectedCapsule
    ) {
      return;
    }

    revealInspectorRef.current = false;

    const frame = requestAnimationFrame(() => {
      document
        .getElementById(
          "knowledge-capsule-inspector",
        )
        ?.scrollIntoView({
          behavior: getScrollBehavior(),
          block: "start",
        });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    selectedCapsule,
    selectedCapsuleId,
  ]);

  function handleGraphNodeSelect(
    capsuleId: string,
    graphNodeId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "graph-node",
      graphNodeId,
    });

  }

  function handleTimelineEventSelect(
    capsuleId: string,
    timelineEventId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "timeline-event",
      timelineEventId,
    });
  }

  function handleGenealogyNodeSelect(
    capsuleId: string,
    genealogyNodeId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "genealogy-node",
      genealogyNodeId,
    });

  }

  function handleImpactOutcomeSelect(
    capsuleId: string,
    impactOutcomeId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "impact-outcome",
      impactOutcomeId,
    });
  }

  function handleDistributionConsumerSelect(
    capsuleId: string,
    consumerId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "distribution-consumer",
      consumerId,
    });
  }

  function handleDistributionEventSelect(
    capsuleId: string,
    distributionEventId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "distribution-event",
      distributionEventId,
    });
  }

  function handleDistributionGenealogySummarySelect(
    capsuleId: string,
    distributionGenealogySummaryId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "distribution-genealogy-summary",
      distributionGenealogySummaryId,
    });
  }

  function handleConsumerIntelligenceSelect(
    capsuleId: string,
    intelligenceConsumerId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "consumer-intelligence",
      intelligenceConsumerId,
    });
  }

  function handleMemoryProjectionSelect(
    capsuleId: string,
    memoryProjectionId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "memory-projection",
      memoryProjectionId,
    });
  }

  function handleCanonicalReviewSelect(
    capsuleId: string,
    canonicalReviewId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "canonical-review",
      canonicalReviewId,
    });
  }

  function handleCanonicalKnowledgeSelect(
    capsuleId: string,
    canonicalKnowledgeId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "canonical-knowledge",
      canonicalKnowledgeId,
    });
  }

  function handleCanonicalReviewEventSelect(
    capsuleId: string,
    canonicalReviewEventId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    setSelection({
      capsuleId,
      kind: "canonical-review-event",
      canonicalReviewEventId,
    });
  }

  function handleStationSelect(
    stationId: string,
    capsuleId: string | null,
  ) {
    if (!capsuleId) {
      return;
    }

    inspectorClosedByUserRef.current =
      false;
    revealInspectorRef.current = true;

    setSelection({
      capsuleId,
      kind: "station",
      stationId,
    });
  }

  function handleCapsuleSelect(
    capsuleId: string,
  ) {
    inspectorClosedByUserRef.current =
      false;

    if (
      selection?.capsuleId === capsuleId &&
      selection.kind === "capsule"
    ) {
      document
        .getElementById(
          "knowledge-capsule-inspector",
        )
        ?.scrollIntoView({
          behavior: getScrollBehavior(),
          block: "start",
        });

      return;
    }

    revealInspectorRef.current = true;

    setSelection({
      capsuleId,
      kind: "capsule",
    });
  }

  const handleVisibleCapsuleChange = useCallback(
    (
      capsuleId: string | null,
    ) => {
      if (
        inspectorClosedByUserRef.current
      ) {
        return;
      }

      setSelection((current) => {
        if (!capsuleId) {
          return null;
        }

        if (
          current?.capsuleId === capsuleId
        ) {
          return current;
        }

        return {
          capsuleId,
          kind: "capsule",
        };
      });
    },
    [],
  );

  const handleVisibleStationChange = useCallback(
    (
      stationId: string | null,
    ) => {
      if (
        inspectorClosedByUserRef.current
      ) {
        return;
      }

      if (stationId) {
        return;
      }

      setSelection((current) => {
        if (current?.kind !== "station") {
          return current;
        }

        return current.capsuleId
          ? {
              capsuleId: current.capsuleId,
              kind: "capsule",
            }
          : null;
      });
    },
    [],
  );

  return (
    <div
      id="knowledge-production-top"
      className="grid scroll-mt-6 gap-6"
    >
      <LuminaSectionNavigator
        items={PRODUCTION_SECTIONS}
        ariaLabel="Knowledge production sections"
        topTargetId="knowledge-production-top"
        minWidthClassName="min-w-[1040px]"
        gridColumnsClassName="grid-cols-8"
      />

      <section
        id="knowledge-flow-engine"
        tabIndex={-1}
        className="scroll-mt-24 focus:outline-none"
      >
        <KnowledgeCapsuleFlowEngine
          capsules={knowledgeCapsuleProjection.capsules}
          positions={knowledgeCapsuleProjection.positions}
          selectedCapsuleId={selectedCapsuleId}
          selectedStationId={
            selection?.kind === "station"
              ? selection.stationId
              : undefined
          }
          onCapsuleSelect={handleCapsuleSelect}
          onStationSelect={handleStationSelect}
          onVisibleCapsuleChange={
            handleVisibleCapsuleChange
          }
          onVisibleStationChange={
            handleVisibleStationChange
          }
        />
      </section>

      {selectedCapsule ? (
        <div
          id="knowledge-capsule-inspector"
          className="scroll-mt-24"
        >
          <KnowledgeCapsuleInspector
            capsule={selectedCapsule}
            selectedTimelineEventId={
              selection?.kind === "timeline-event"
                ? selection.timelineEventId
                : undefined
            }
            onTimelineEventSelect={
              handleTimelineEventSelect
            }
            onClose={() => {
              inspectorClosedByUserRef.current =
                true;
              setSelection(null);

              requestAnimationFrame(() => {
                document
                  .getElementById(
                    "knowledge-flow-engine",
                  )
                  ?.focus({
                    preventScroll: true,
                  });
              });
            }}
          />
        </div>
      ) : null}

      <section
        id="canonical-review"
        className="scroll-mt-24"
      >
        <CanonicalReview
          projection={canonicalReviewProjection}
          policySnapshot={
            canonicalReviewPolicySnapshot
          }
          selectedReviewId={
            selection?.kind === "canonical-review"
              ? selection.canonicalReviewId
              : undefined
          }
          selectedTimelineEventId={
            selection?.kind === "canonical-review-event"
              ? selection.canonicalReviewEventId
              : undefined
          }
          onReviewSelect={
            handleCanonicalReviewSelect
          }
          onTimelineEventSelect={
            handleCanonicalReviewEventSelect
          }
          onDecisionComplete={
            refreshCanonicalReviewNow
          }
          onPolicyPersisted={
            handleCanonicalReviewPolicyPersisted
          }
          onPolicyDeleted={
            handleCanonicalReviewPolicyDeleted
          }
        />
      </section>

      <section
        id="canonical-knowledge"
        className="scroll-mt-24"
      >
        <CanonicalKnowledge
          projection={canonicalKnowledgeProjection}
          selectedCanonicalId={
            selection?.kind === "canonical-knowledge"
              ? selection.canonicalKnowledgeId
              : undefined
          }
          onCanonicalSelect={
            handleCanonicalKnowledgeSelect
          }
        />
      </section>

      <section
        id="knowledge-graph"
        className="scroll-mt-24"
        aria-label="Knowledge Graph"
      >
        <ProductionKnowledgeGraph
          capsules={knowledgeCapsuleProjection.capsules}
          selectedCapsuleId={selectedCapsuleId}
          onCapsuleSelect={handleGraphNodeSelect}
        />
      </section>

      <section
        id="organizational-memory"
        className="scroll-mt-24"
      >
        <OrganizationalMemory
          projection={organizationalMemoryProjection}
          selectedProjectionId={
            selection?.kind === "memory-projection"
              ? selection.memoryProjectionId
              : undefined
          }
          onProjectionSelect={
            handleMemoryProjectionSelect
          }
        />
      </section>

      <section
        id="knowledge-distribution"
        className="scroll-mt-24"
      >
        <KnowledgeDistributionHub
          capsules={knowledgeCapsuleProjection.capsules}
          records={knowledgeDistributionProjection.records}
          selectedCapsuleId={selectedCapsuleId}
          selectedConsumerId={
            selection?.kind === "distribution-consumer"
              ? selection.consumerId
              : undefined
          }
          selectedHistoryEventId={
            selection?.kind === "distribution-event"
              ? selection.distributionEventId
              : undefined
          }
          selectedGenealogySummaryId={
            selection?.kind ===
            "distribution-genealogy-summary"
              ? selection.distributionGenealogySummaryId
              : undefined
          }
          onCapsuleSelect={handleCapsuleSelect}
          onConsumerSelect={
            handleDistributionConsumerSelect
          }
          onHistoryEventSelect={
            handleDistributionEventSelect
          }
          onGenealogySummarySelect={
            handleDistributionGenealogySummarySelect
          }
        />
      </section>

      <ConsumerIntelligence
        records={knowledgeDistributionProjection.records}
        selectedConsumerId={
          selection?.kind === "consumer-intelligence"
            ? selection.intelligenceConsumerId
            : undefined
        }
        selectedHistoryEventId={
          selection?.kind === "distribution-event"
            ? selection.distributionEventId
            : undefined
        }
        onConsumerSelect={
          handleConsumerIntelligenceSelect
        }
        onHistoryEventSelect={
          handleDistributionEventSelect
        }
      />

      <section
        id="knowledge-genealogy"
        className="scroll-mt-24"
      >
        <KnowledgeGenealogy
        capsules={knowledgeCapsuleProjection.capsules}
        selectedCapsuleId={selectedCapsuleId}
        selectedGenealogyNodeId={
          selection?.kind === "genealogy-node"
            ? selection.genealogyNodeId
            : undefined
        }
        onCapsuleSelect={handleCapsuleSelect}
        onGenealogyNodeSelect={
          handleGenealogyNodeSelect
        }
        />
      </section>

      <section
        id="organizational-impact"
        className="scroll-mt-24"
      >
        <OrganizationalImpact
          projection={organizationalImpactProjection}
          selectedImpactOutcomeId={
            selection?.kind === "impact-outcome"
              ? selection.impactOutcomeId
              : undefined
          }
          onImpactOutcomeSelect={
            handleImpactOutcomeSelect
          }
        />
      </section>
    </div>
  );
}
