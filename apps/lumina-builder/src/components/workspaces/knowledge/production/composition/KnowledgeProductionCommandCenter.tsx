import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowUp,
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

function ProductionSectionNavigator() {
  function handleNavigate(sectionId: string) {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <nav
      aria-label="Knowledge production sections"
      className={[
        "sticky top-4 z-40 overflow-x-auto rounded-2xl border p-2",
        "border-cyan-300/70 ring-1 ring-inset ring-blue-400/35",
        "bg-slate-950/88",
        "shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_0_30px_rgba(37,99,235,0.22),0_20px_60px_rgba(2,6,23,0.48)]",
        "backdrop-blur-2xl",
      ].join(" ")}
    >
      <div className="grid min-w-[1040px] grid-cols-8 items-center gap-2 xl:min-w-0">
        {PRODUCTION_SECTIONS.map((section) => {
          const Icon = section.icon;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => handleNavigate(section.id)}
              className={[
                "inline-flex h-9 w-full min-w-0 items-center justify-center gap-2 rounded-xl border px-3",
                "text-[10px] font-semibold uppercase tracking-[0.12em]",
                "border-cyan-300/62 ring-1 ring-inset ring-blue-400/28",
                "bg-[linear-gradient(180deg,rgba(146,64,14,0.96),rgba(92,36,5,0.96))] text-amber-100",
                "shadow-[inset_0_1px_0_rgba(251,191,36,0.16),0_0_18px_rgba(37,99,235,0.16)]",
                "transition-[border-color,background-color,color,box-shadow,transform] duration-200",
                "hover:border-cyan-200/90 hover:bg-[linear-gradient(180deg,rgba(146,64,14,0.98),rgba(92,36,5,0.98))] hover:text-amber-50",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_24px_rgba(37,99,235,0.24)]",
                "active:translate-y-px",
                "focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-amber-300/90",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-cyan">
                {section.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function BackToTopButton() {
  function handleBackToTop() {
    document
      .getElementById(
        "knowledge-production-top",
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={handleBackToTop}
      className={[
        "fixed bottom-6 right-6 z-50",
        "inline-flex h-12 items-center gap-2 rounded-2xl border px-4",
        "border-cyan-300/72 ring-1 ring-inset ring-blue-400/38",
        "bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))]",
        "text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100",
        "shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_0_28px_rgba(37,99,235,0.28),0_18px_48px_rgba(2,6,23,0.52)]",
        "backdrop-blur-2xl",
        "transition-[border-color,color,box-shadow,transform] duration-200",
        "hover:border-cyan-200/95 hover:text-white",
        "hover:shadow-[0_0_0_1px_rgba(34,211,238,0.22),0_0_34px_rgba(37,99,235,0.36),0_20px_54px_rgba(2,6,23,0.58)]",
        "active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80",
      ].join(" ")}
    >
      <ArrowUp className="h-4 w-4" />
      <span>Back to top</span>
    </button>
  );
}

export function KnowledgeProductionCommandCenter() {
  const [
    selection,
    setSelection,
  ] = useState<KnowledgeProductionSelection | null>(
    null,
  );

  const inspectorClosedByUserRef =
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
    if (!selectedCapsuleId || !selectedCapsule) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      document
        .getElementById(
          "knowledge-capsule-inspector",
        )
        ?.scrollIntoView({
          behavior: "smooth",
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

    setSelection((current) =>
      current?.capsuleId === capsuleId &&
      current.kind === "capsule"
        ? current
        : {
            capsuleId,
            kind: "capsule",
          },
    );

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
      <ProductionSectionNavigator />
      <BackToTopButton />

      <section
        id="knowledge-flow-engine"
        className="scroll-mt-24"
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
          className="scroll-mt-6"
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
