import {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  Brain,
  Database,
  GitBranch,
  Network,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  GlowCard,
} from "@/components/lumina/GlowCard";

import {
  LuminaSurface,
} from "@/components/lumina/surface";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaWorkspaceBrand,
} from "@/components/lumina/workspace";

import {
  getKnowledgeOverview,
} from "@/services/knowledgeOperationsService";

import {
  KnowledgeActivityFeed,
  KnowledgeCoveragePanel,
  KnowledgeExecutiveSummary,
  KnowledgeHealthOverview,
  KnowledgePipelineOverview,
  KnowledgeSystemStatus,
} from "./knowledge/overview";



import {
  KnowledgeGraphPanel,
} from "./knowledge/graph";

import {
  KnowledgeAcquisitionPanel,
} from "./knowledge/acquisition";

import {
  KnowledgeReasoningPanel,
} from "./knowledge/reasoning";
interface Props {
  setView(view: string): void;
}

type KnowledgeTab =
  | "overview"
  | "acquisition"
  | "evidence"
  | "ir"
  | "canonical"
  | "graph"
  | "learning"
  | "reasoning"
  | "automation"
  | "settings";

const TABS: Array<{
  value: KnowledgeTab;
  label: string;
  description: string;
  icon: typeof Database;
}> = [
  { value: "overview", label: "Overview", description: "Engineering intelligence health", icon: Activity },
  { value: "acquisition", label: "Acquisition", description: "Source ingestion and evidence flow", icon: Database },
  { value: "evidence", label: "Evidence", description: "Immutable source records", icon: Search },
  { value: "ir", label: "Knowledge IR", description: "Candidate knowledge review", icon: Workflow },
  { value: "canonical", label: "Canonical", description: "Promoted institutional memory", icon: Sparkles },
  { value: "graph", label: "Graph", description: "Relationships and lineage", icon: Network },
  { value: "learning", label: "Learning", description: "Patterns and insight generation", icon: Brain },
  { value: "reasoning", label: "Reasoning", description: "Findings and recommendations", icon: GitBranch },
  { value: "automation", label: "Automation", description: "Improvement and recovery loops", icon: ShieldCheck },
  { value: "settings", label: "Settings", description: "Policies, scopes, and providers", icon: Settings2 },
];

function fallback(value: string | number | undefined) {
  return value ?? "—";
}

export default function KnowledgeOperationsWorkspace({
  setView,
}: Props) {
  const [snapshot, setSnapshot] =
    useState<KnowledgeOperationsSnapshot | null>(null);

  const [activeTab, setActiveTab] =
    useState<KnowledgeTab>("overview");

  async function refresh() {
    try {
      setSnapshot(await getKnowledgeOverview());
    } catch {
      setSnapshot(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const acquisition = snapshot?.acquisition;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-7 px-4 py-8 md:px-10 md:py-12">
        <GlowCard className="relative overflow-hidden p-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet/20 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-cyan/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <LuminaWorkspaceBrand
              workspace="Knowledge Operations"
              family="Master OS · Internal"
              tagline="Evidence • Learn • Reason"
              className="min-w-0"
            />

            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Evidence acquisition, Knowledge IR, canonical memory, learning,
              reasoning, automation, and Chief Agent growth in one governed
              operating console.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <LuminaButton
                variant="ghost"
                size="sm"
                onClick={() => setView("dashboard")}
              >
                Back
              </LuminaButton>

              <LuminaButton
                variant="glow"
                size="sm"
                onClick={() => void refresh()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </LuminaButton>

              <LuminaButton variant="glow" size="sm">
                <Database className="h-3.5 w-3.5" />
                Providers
              </LuminaButton>

              <LuminaButton variant="primary" size="sm">
                <Settings2 className="h-3.5 w-3.5" />
                Settings
              </LuminaButton>
            </div>
          </div>
        </GlowCard>

        <LuminaSurface variant="panel">
        <section className="grid gap-6">

          <div className="grid grid-cols-12 gap-6">

            <div className="col-span-12 xl:col-span-3 flex flex-col gap-6">

              <KnowledgeExecutiveSummary
                snapshot={snapshot}
              />

              <KnowledgeCoveragePanel
                snapshot={snapshot}
              />

            </div>

            <div className="col-span-12 xl:col-span-6">

              <GlowCard className="glass-runtime h-full min-h-[720px] rounded-[32px] overflow-hidden">
                <KnowledgeGraphPanel
                  snapshot={snapshot}
                />
              </GlowCard>

            </div>

            <div className="col-span-12 xl:col-span-3 flex flex-col gap-6">

              <KnowledgeActivityFeed
                snapshot={snapshot}
              />

              <KnowledgeHealthOverview
                snapshot={snapshot}
              />

            </div>

          </div>

          <div className="grid grid-cols-12 gap-6">

            <div className="col-span-12 xl:col-span-8">

              <GlowCard className="glass-runtime rounded-[28px]">
                <KnowledgeAcquisitionPanel
                  acquisition={acquisition}
                />
              </GlowCard>

            </div>

            <div className="col-span-12 xl:col-span-4">

              <GlowCard className="glass-runtime rounded-[28px]">
                <KnowledgeReasoningPanel
                  snapshot={snapshot}
                />
              </GlowCard>

            </div>

          </div>

        </section>
      </LuminaSurface>
      </div>
    </div>
  );
}

function sectionTitle(tab: KnowledgeTab) {
  switch (tab) {
    case "overview":
      return "Executive knowledge overview";
    case "acquisition":
      return "Evidence acquisition pipeline";
    case "evidence":
      return "Evidence explorer";
    case "ir":
      return "Knowledge IR review queue";
    case "canonical":
      return "Canonical knowledge memory";
    case "graph":
      return "Knowledge graph";
    case "learning":
      return "Learning signals";
    case "reasoning":
      return "Reasoning findings";
    case "automation":
      return "Autonomous improvement";
    case "settings":
      return "Knowledge platform settings";
  }
}

function KnowledgeSection({
  tab,
  snapshot,
}: {
  tab: KnowledgeTab;
  snapshot: KnowledgeOperationsSnapshot | null;
}) {
  const acquisition = snapshot?.acquisition;

  if (tab === "overview") {
    return (
      <div className="space-y-5">
        <KnowledgeExecutiveSummary />
        <KnowledgeHealthOverview snapshot={snapshot} />
        <KnowledgePipelineOverview />

        <div className="grid gap-5 lg:grid-cols-2">
          <KnowledgeCoveragePanel />
          <KnowledgeActivityFeed />
        </div>

        <KnowledgeSystemStatus />
      </div>
    );
  }

  if (tab === "acquisition") {
    return (
      <div className="space-y-4">
        <KnowledgePipelineOverview />
        <SystemCard
          icon={GitBranch}
          title={String(fallback(acquisition?.repository))}
          description={`Current stage: ${fallback(acquisition?.stage)} · Evidence extracted: ${fallback(acquisition?.evidenceExtracted)}`}
        />
      </div>
    );
  }

  if (tab === "graph") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <SystemCard
          icon={Network}
          title="Graph Explorer"
          description="Future graph workspace for repositories, evidence, Knowledge IR, canonical memory, relationships, decisions, constraints, risks, and learning links."
        />
        <SystemCard
          icon={Activity}
          title="Relationship Health"
          description="Broken references, missing provenance, scope violations, and stale knowledge relationships will surface here."
        />
      </div>
    );
  }

  return (
    <SystemCard
      icon={Sparkles}
      title={sectionTitle(tab)}
      description="Premium UI shell is ready. Backend wiring will follow stable frontend contracts without changing the workspace experience."
    />
  );
}

function SystemCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Brain;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      <h3 className="font-display text-xl font-semibold tracking-tight">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function InspectorRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>

      <div className="max-w-[220px] truncate text-right text-[12px] font-medium tabular-nums">
        {value}
      </div>
    </div>
  );
}
