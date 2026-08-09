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
  knowledgeCapsules,
  knowledgeDistributionRecords,
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

  const inspectorClosedByUserRef =
    useRef(false);
  const revealInspectorRef =
    useRef(false);

  const selectedCapsuleId =
    selection?.capsuleId ?? "";

  const selectedCapsule = useMemo(
    () =>
      knowledgeCapsules.find(
        (capsule) =>
          capsule.id === selectedCapsuleId,
      ) ?? null,
    [selectedCapsuleId],
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
          capsules={knowledgeCapsules}
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
        />
      </section>

      <section
        id="canonical-knowledge"
        className="scroll-mt-24"
      >
        <CanonicalKnowledge
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
          capsules={knowledgeCapsules}
          selectedCapsuleId={selectedCapsuleId}
          onCapsuleSelect={handleGraphNodeSelect}
        />
      </section>

      <section
        id="organizational-memory"
        className="scroll-mt-24"
      >
        <OrganizationalMemory
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
          capsules={knowledgeCapsules}
          records={knowledgeDistributionRecords}
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
        records={knowledgeDistributionRecords}
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
        capsules={knowledgeCapsules}
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
          capsules={knowledgeCapsules}
          records={knowledgeDistributionRecords}
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
