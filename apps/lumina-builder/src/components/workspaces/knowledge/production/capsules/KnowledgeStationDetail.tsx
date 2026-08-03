import {
  Activity,
  Archive,
  BookOpenCheck,
  BrainCircuit,
  Boxes,
  CheckCircle2,
  FileCode2,
  FileSearch,
  GitBranch,
  GraduationCap,
  MemoryStick,
  MessageSquareText,
  PackageCheck,
  Scale,
  ShieldCheck,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

type KnowledgeStationDetailProps = {
  station: string;
};

const genericStationDetails: Record<
  string,
  {
    summary: string;
    authority: string;
    output: string;
    posture: string;
    icon: typeof Activity;
  }
> = {
  "Evidence Intake": {
    summary:
      "Evidence sources are registered, classified, attributed and prepared for governed compilation.",
    authority:
      "Source ownership, evidence class and admissibility remain visible.",
    output:
      "Governed evidence record",
    posture:
      "Active intake",
    icon: FileSearch,
  },
  "Git Compiler": {
    summary:
      "Repository changes are interpreted as durable implementation knowledge with commit lineage preserved.",
    authority:
      "Repository authority and branch provenance retained.",
    output:
      "Code knowledge candidate",
    posture:
      "Processing",
    icon: GitBranch,
  },
  "Runtime Compiler": {
    summary:
      "Runtime events and operational behavior are transformed into inspectable knowledge candidates.",
    authority:
      "Runtime source, project context and event lineage retained.",
    output:
      "Operational knowledge candidate",
    posture:
      "Observing",
    icon: Activity,
  },
  "Mission Compiler": {
    summary:
      "Mission intent, constraints, outcomes and execution boundaries are compiled into durable knowledge.",
    authority:
      "Mission ownership and authorization boundaries retained.",
    output:
      "Mission knowledge candidate",
    posture:
      "Active",
    icon: ShieldCheck,
  },
  "Execution Compiler": {
    summary:
      "Completed execution patterns, corrections and outcomes are converted into reusable operating knowledge.",
    authority:
      "Execution actor, approval and result lineage retained.",
    output:
      "Execution knowledge candidate",
    posture:
      "Processing",
    icon: Boxes,
  },
  "Knowledge IR": {
    summary:
      "Concepts, relationships, authority and provenance are represented in a governed intermediate form.",
    authority:
      "Every concept remains traceable to source evidence.",
    output:
      "Knowledge IR candidate",
    posture:
      "Structured",
    icon: FileCode2,
  },
  Validation: {
    summary:
      "Completeness, authority, provenance, conflict and policy requirements are evaluated before sealing.",
    authority:
      "Human review remains required for unresolved authority or conflict.",
    output:
      "Validated or remediated capsule",
    posture:
      "Governed review",
    icon: Scale,
  },
  "Knowledge Package Assembly": {
    summary:
      "Validated knowledge is assembled into a persistent package with stable identity and governed metadata.",
    authority:
      "Package authority, dependencies and approval posture retained.",
    output:
      "Knowledge Package",
    posture:
      "Assembly",
    icon: PackageCheck,
  },
  "Canonical Review": {
    summary:
      "Package candidates are reviewed for canonical authority, supersession and organizational applicability.",
    authority:
      "Canonical approval remains explicit and auditable.",
    output:
      "Canonical candidate",
    posture:
      "Review",
    icon: CheckCircle2,
  },
  "Canonical Knowledge": {
    summary:
      "Approved packages become authoritative organizational knowledge with durable lineage.",
    authority:
      "Canonical owner and supersession history retained.",
    output:
      "Canonical knowledge",
    posture:
      "Approved",
    icon: BookOpenCheck,
  },
  "Organizational Memory": {
    summary:
      "Canonical knowledge is indexed into organizational memory for discovery, continuity and reuse.",
    authority:
      "Memory placement preserves source and canonical lineage.",
    output:
      "Organizational memory entry",
    posture:
      "Published",
    icon: MemoryStick,
  },
  "Chief Agent Education": {
    summary:
      "Approved knowledge is adapted into governed educational material for Chief Agent readiness.",
    authority:
      "Educational adaptation remains traceable to canonical knowledge.",
    output:
      "Educational contribution",
    posture:
      "Adapted",
    icon: GraduationCap,
  },
  "Mission Consumption": {
    summary:
      "Governed knowledge is consumed by authorized missions with impact and usage recorded.",
    authority:
      "Consumer, mission and authorization context retained.",
    output:
      "Mission contribution",
    posture:
      "Consumed",
    icon: BrainCircuit,
  },
  Archive: {
    summary:
      "Superseded or retired knowledge remains permanently inspectable without remaining active.",
    authority:
      "Supersession reason and replacement lineage retained.",
    output:
      "Archived knowledge package",
    posture:
      "Archived",
    icon: Archive,
  },
};

function DocumentationStationDetail() {
  const stages = [
    "Source Intake",
    "Authority Classification",
    "Concept Extraction",
    "Relationship Modeling",
    "Knowledge IR",
    "Validation",
    "Package Candidate",
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage, index) => (
          <article
            key={stage}
            className="rounded-[18px] border border-cyan-300/22 bg-cyan-300/[0.035] p-4"
          >
            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/62">
              Stage {index + 1}
            </div>
            <div className="mt-2 text-sm font-semibold text-amber-400">
              {stage}
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[18px] border border-cyan-300/24 bg-cyan-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/66">
            Current candidate
          </div>
          <div className="mt-2 text-sm font-semibold text-sky-200">
            Knowledge Constitution v1
          </div>
          <div className="mt-1 text-xs text-sky-500/72">
            14 concepts · 23 relationships · 96% confidence
          </div>
        </div>

        <div className="rounded-[18px] border border-violet-300/24 bg-violet-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-violet-300/66">
            Educational mapping
          </div>
          <div className="mt-2 text-sm font-semibold text-violet-200">
            Governance Foundations
          </div>
          <div className="mt-1 text-xs text-sky-500/72">
            Authority, approval, provenance and activation boundaries
          </div>
        </div>

        <div className="rounded-[18px] border border-amber-300/24 bg-amber-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-amber-300/66">
            Manual review
          </div>
          <div className="mt-2 text-sm font-semibold text-amber-300">
            2 unresolved fragments
          </div>
          <div className="mt-1 text-xs text-sky-500/72">
            Source authority and supersession require confirmation
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationStationDetail() {
  const stages = [
    "Conversation Intake",
    "Educational Relevance",
    "Architectural Impact",
    "Decision Extraction",
    "Knowledge IR",
    "Validation",
    "Package Candidate",
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage, index) => (
          <article
            key={stage}
            className="rounded-[18px] border border-violet-300/22 bg-violet-300/[0.035] p-4"
          >
            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-300/62">
              Stage {index + 1}
            </div>
            <div className="mt-2 text-sm font-semibold text-amber-400">
              {stage}
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-cyan-300/24 bg-cyan-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-cyan-300/66">
            Selected conversation
          </div>
          <div className="mt-2 text-sm font-semibold text-sky-200">
            Phase 1A certification thread
          </div>
        </div>

        <div className="rounded-[18px] border border-violet-300/24 bg-violet-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-violet-300/66">
            Educational relevance
          </div>
          <div className="mt-2 text-sm font-semibold text-violet-200">
            High · 94%
          </div>
        </div>

        <div className="rounded-[18px] border border-amber-300/24 bg-amber-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-amber-300/66">
            Decisions extracted
          </div>
          <div className="mt-2 text-sm font-semibold text-amber-300">
            7 durable decisions
          </div>
        </div>

        <div className="rounded-[18px] border border-emerald-300/24 bg-emerald-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-emerald-300/66">
            Package posture
          </div>
          <div className="mt-2 text-sm font-semibold text-emerald-300">
            Candidate
          </div>
        </div>
      </div>
    </div>
  );
}

export function KnowledgeStationDetail({
  station,
}: KnowledgeStationDetailProps) {
  if (station === "Documentation Compiler") {
    return <DocumentationStationDetail />;
  }

  if (station === "Conversation Compiler") {
    return <ConversationStationDetail />;
  }

  const detail =
    genericStationDetails[station] ??
    genericStationDetails["Evidence Intake"];

  const Icon = detail.icon;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,.6fr)]">
      <article className="rounded-[20px] border border-cyan-300/22 bg-cyan-300/[0.035] p-5">
        <div className="flex items-start gap-4">
          <ExecutivePremiumIcon
            icon={Icon}
            state="active"
          />

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/66">
              Station context
            </div>

            <h3 className="mt-2 text-base font-semibold text-amber-400">
              {station}
            </h3>

            <p className="mt-2 text-sm leading-6 text-sky-300/76">
              {detail.summary}
            </p>
          </div>
        </div>
      </article>

      <div className="grid gap-3">
        <div className="rounded-[18px] border border-violet-300/22 bg-violet-300/[0.04] p-4">
          <div className="text-[9px] uppercase tracking-[0.14em] text-violet-300/62">
            Authority
          </div>
          <div className="mt-2 text-xs leading-5 text-violet-100/82">
            {detail.authority}
          </div>
        </div>

        <div className="rounded-[18px] border border-amber-300/22 bg-amber-300/[0.04] p-4">
          <div className="text-[9px] uppercase tracking-[0.14em] text-amber-300/62">
            Output
          </div>
          <div className="mt-2 text-sm font-semibold text-amber-200">
            {detail.output}
          </div>
          <div className="mt-1 text-xs text-sky-500/72">
            {detail.posture}
          </div>
        </div>
      </div>
    </div>
  );
}
