import {
  useEffect,
  useMemo,
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
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaSegmentedControl,
} from "@/components/lumina/LuminaSegmentedControl";

import {
  getKnowledgeOverview,
} from "@/services/knowledgeOperationsService";

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
}> = [
  { value: "overview", label: "Overview" },
  { value: "acquisition", label: "Acquisition" },
  { value: "evidence", label: "Evidence" },
  { value: "ir", label: "IR" },
  { value: "canonical", label: "Canonical" },
  { value: "graph", label: "Graph" },
  { value: "learning", label: "Learning" },
  { value: "reasoning", label: "Reasoning" },
  { value: "automation", label: "Automation" },
  { value: "settings", label: "Settings" },
];

function num(value: number | undefined) {
  return (value ?? 0).toLocaleString();
}

function pct(value: number | undefined) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function fallback(value: string | number | undefined) {
  return value ?? "—";
}

export default function KnowledgeOperationsWorkspace({
  setView,
}: Props) {
  const [
    snapshot,
    setSnapshot,
  ] = useState<KnowledgeOperationsSnapshot | null>(null);

  const [
    activeTab,
    setActiveTab,
  ] = useState<KnowledgeTab>("overview");

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

  const metrics = useMemo(
    () => [
      {
        label: "Evidence",
        value: num(snapshot?.evidence.total),
        hint: "Immutable source records",
        icon: Database,
        accent: "violet" as const,
      },
      {
        label: "Candidate IR",
        value: num(snapshot?.knowledge.candidateItems),
        hint: "Compiled knowledge candidates",
        icon: Workflow,
        accent: "cyan" as const,
      },
      {
        label: "Canonical",
        value: num(snapshot?.knowledge.canonicalItems),
        hint: "Promoted platform knowledge",
        icon: Sparkles,
        accent: "gold" as const,
      },
      {
        label: "Promotion",
        value: pct(snapshot?.knowledge.promotionRate),
        hint: "Candidate to canonical ratio",
        icon: Activity,
        accent: "magenta" as const,
      },
    ],
    [snapshot],
  );

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
            <div className="min-w-0">
              <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Master OS · Internal
              </div>

              <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
                Knowledge Operations
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Evidence acquisition, Knowledge IR, canonical memory, learning,
                reasoning, automation, and Chief Agent growth in one governed
                operating console.
              </p>
            </div>

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

              <LuminaButton
                variant="glow"
                size="sm"
              >
                <Database className="h-3.5 w-3.5" />
                Providers
              </LuminaButton>

              <LuminaButton
                variant="primary"
                size="sm"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Settings
              </LuminaButton>
            </div>
          </div>
        </GlowCard>

        <div className="overflow-x-auto pb-1">
          <LuminaSegmentedControl
            aria-label="Knowledge operations sections"
            value={activeTab}
            onValueChange={setActiveTab}
            options={TABS.map((tab) => ({
              ...tab,
              dotClassName:
                tab.value === "overview"
                  ? "bg-violet text-violet"
                  : tab.value === "acquisition"
                    ? "bg-cyan text-cyan"
                    : tab.value === "graph"
                      ? "bg-gold text-gold"
                      : "bg-white/60 text-white/60",
            }))}
          />
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <GlowCard
                key={metric.label}
                accent={metric.accent}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl"
                interactive
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                      {metric.label}
                    </div>
                    <div className="mt-2 font-display text-3xl font-semibold tracking-tight tabular-nums">
                      {metric.value}
                    </div>
                    <div className="mt-2 truncate text-[11px] text-muted-foreground">
                      {metric.hint}
                    </div>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </GlowCard>
            );
          })}
        </section>

        <section className="grid min-h-[560px] grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <GlowCard className="glass-runtime p-0">
            <div className="border-b border-white/8 bg-white/[0.025] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {activeTab}
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                    {sectionTitle(activeTab)}
                  </h2>
                </div>

                <LuminaButton variant="ghost" size="icon" aria-label="Search knowledge">
                  <Search className="h-4 w-4" />
                </LuminaButton>
              </div>
            </div>

            <div className="p-5">
              <KnowledgeSection tab={activeTab} snapshot={snapshot} />
            </div>
          </GlowCard>

          <GlowCard className="glass-runtime p-0">
            <div className="border-b border-white/8 bg-white/[0.025] px-5 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Inspector
              </div>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                Acquisition State
              </h2>
            </div>

            <div className="space-y-3 p-5">
              <InspectorRow label="Status" value={fallback(acquisition?.status)} />
              <InspectorRow label="Repository" value={fallback(acquisition?.repository)} />
              <InspectorRow label="Stage" value={fallback(acquisition?.stage)} />
              <InspectorRow label="Files Scanned" value={fallback(acquisition?.filesScanned)} />
              <InspectorRow label="Evidence" value={fallback(acquisition?.evidenceExtracted)} />
              <InspectorRow label="Elapsed" value={fallback(acquisition?.elapsed)} />
            </div>
          </GlowCard>
        </section>
      </div>
    </div>
  );
}

function sectionTitle(tab: KnowledgeTab) {
  switch (tab) {
    case "overview":
      return "Platform knowledge health";
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
      <div className="grid gap-4 lg:grid-cols-2">
        <PipelineCard />
        <SystemCard
          icon={Brain}
          title="Chief Agent Readiness"
          description="Every evidence item, engineering decision, implementation session, and important conversation must be preserved before it can improve Chief Agent maturity."
        />
      </div>
    );
  }

  if (tab === "acquisition") {
    return (
      <div className="space-y-4">
        <PipelineCard />
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

function PipelineCard() {
  const steps = [
    "Source",
    "Evidence",
    "Compiler",
    "Knowledge IR",
    "Validation",
    "Canonical",
    "Learning",
    "Reasoning",
    "Memory",
    "Chief Agent",
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Canonical Pipeline
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {steps.map((step, index) => (
          <div
            key={step}
            className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3"
          >
            <div className="text-[10px] tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[12px] font-semibold tracking-tight">
              {step}
            </div>
          </div>
        ))}
      </div>
    </div>
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
