import {
  useMemo,
  useState,
} from "react";

import {
  BookOpenCheck,
  Boxes,
  GitBranch,
  Network,
  ShieldCheck,
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
  | "genealogy-node"
  | "distribution-consumer";

interface KnowledgeProductionSelection {
  capsuleId: string;
  kind: KnowledgeSelectionKind;
  stationId?: string;
  graphNodeId?: string;
  graphEdgeId?: string;
  genealogyNodeId?: string;
  consumerId?: string;
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
      <div className="grid min-w-[1120px] grid-cols-6 items-center gap-2 xl:min-w-0">
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

export function KnowledgeProductionCommandCenter() {
  const [
    selection,
    setSelection,
  ] = useState<KnowledgeProductionSelection | null>(
    null,
  );

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

  function revealInspector() {
    requestAnimationFrame(() => {
      document
        .getElementById(
          "knowledge-capsule-inspector",
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  function handleGraphNodeSelect(
    capsuleId: string,
    graphNodeId: string,
  ) {
    setSelection({
      capsuleId,
      kind: "graph-node",
      graphNodeId,
    });

    revealInspector();
  }

  function handleCapsuleSelect(
    capsuleId: string,
  ) {
    setSelection((current) =>
      current?.capsuleId === capsuleId &&
      current.kind === "capsule"
        ? current
        : {
            capsuleId,
            kind: "capsule",
          },
    );

    revealInspector();
  }

  return (
    <div className="grid gap-6">
      <ProductionSectionNavigator />

      <section
        id="knowledge-flow-engine"
        className="scroll-mt-24"
      >
        <KnowledgeCapsuleFlowEngine
        capsules={knowledgeCapsules}
        selectedCapsuleId={selectedCapsuleId}
        onCapsuleSelect={handleCapsuleSelect}
      />
      </section>

      {selectedCapsule ? (
        <div
          id="knowledge-capsule-inspector"
          className="scroll-mt-6"
        >
          <KnowledgeCapsuleInspector
            capsule={selectedCapsule}
            onClose={() =>
              setSelection(null)
            }
          />
        </div>
      ) : null}

      <section
        id="canonical-review"
        className="scroll-mt-24"
      >
        <CanonicalReview />
      </section>

      <section
        id="canonical-knowledge"
        className="scroll-mt-24"
      >
        <CanonicalKnowledge />
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
        <OrganizationalMemory />
      </section>

      <section
        id="knowledge-distribution"
        className="scroll-mt-24"
      >
        <KnowledgeDistributionHub
          capsules={knowledgeCapsules}
          records={knowledgeDistributionRecords}
          selectedCapsuleId={selectedCapsuleId}
          onCapsuleSelect={handleCapsuleSelect}
        />
      </section>

      <ConsumerIntelligence
        records={knowledgeDistributionRecords}
      />

      <KnowledgeGenealogy
        capsules={knowledgeCapsules}
        selectedCapsuleId={selectedCapsuleId}
        onCapsuleSelect={handleCapsuleSelect}
      />

      <OrganizationalImpact
        capsules={knowledgeCapsules}
        records={knowledgeDistributionRecords}
      />
    </div>
  );
}
