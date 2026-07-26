import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  Boxes,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  Database,
  FileCheck2,
  GitBranch,
  Layers3,
  Network,
  RadioTower,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

interface KnowledgeOperationsV2WorkspaceProps {
  setView(view: string): void;
}

type NavigationItemId =
  | "command"
  | "sources"
  | "evidence"
  | "compiler"
  | "knowledge"
  | "graph"
  | "governance"
  | "certification";

interface NavigationItem {
  id: NavigationItemId;
  label: string;
  description: string;
  icon: LucideIcon;
  count?: number;
}

interface MetricDefinition {
  label: string;
  value: string;
  change: string;
  detail: string;
  icon: LucideIcon;
}

interface PipelineStage {
  id: string;
  label: string;
  description: string;
  value: string;
  state: "healthy" | "active" | "attention";
  icon: LucideIcon;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "published" | "compiled" | "review" | "source";
  icon: LucideIcon;
}

const NAVIGATION: NavigationItem[] = [
  {
    id: "command",
    label: "Command Center",
    description:
      "Executive posture and active operations",
    icon: Activity,
  },
  {
    id: "sources",
    label: "Sources",
    description:
      "Authoritative knowledge inputs",
    icon: RadioTower,
    count: 8,
  },
  {
    id: "evidence",
    label: "Evidence",
    description:
      "Captured facts and provenance",
    icon: Database,
    count: 1842,
  },
  {
    id: "compiler",
    label: "Compiler",
    description:
      "Knowledge processing pipeline",
    icon: Workflow,
    count: 14,
  },
  {
    id: "knowledge",
    label: "Knowledge",
    description:
      "Governed knowledge products",
    icon: BookOpenCheck,
    count: 426,
  },
  {
    id: "graph",
    label: "Graph",
    description:
      "Relationships and lineage",
    icon: Network,
  },
  {
    id: "governance",
    label: "Governance",
    description:
      "Policies, reviews, and authority",
    icon: ShieldCheck,
    count: 3,
  },
  {
    id: "certification",
    label: "Certification",
    description:
      "Operational assurance",
    icon: BadgeCheck,
    count: 96,
  },
];

const METRICS: MetricDefinition[] = [
  {
    label: "Knowledge health",
    value: "94.8%",
    change: "+2.4%",
    detail:
      "Across governed knowledge products",
    icon: Activity,
  },
  {
    label: "Evidence coverage",
    value: "87.2%",
    change: "+5.1%",
    detail:
      "Authoritative sources represented",
    icon: Database,
  },
  {
    label: "Compiler throughput",
    value: "148/h",
    change: "+18",
    detail:
      "Validated items published per hour",
    icon: Workflow,
  },
  {
    label: "Certified knowledge",
    value: "96.4%",
    change: "+1.8%",
    detail:
      "Passing active assurance policies",
    icon: BadgeCheck,
  },
];

const PIPELINE: PipelineStage[] = [
  {
    id: "source",
    label: "Source acquisition",
    description:
      "Repositories, conversations, runtime, and delivery systems",
    value: "8 connected",
    state: "healthy",
    icon: RadioTower,
  },
  {
    id: "evidence",
    label: "Evidence extraction",
    description:
      "Facts normalized with identity, provenance, and confidence",
    value: "1,842 items",
    state: "healthy",
    icon: Database,
  },
  {
    id: "compiler",
    label: "Knowledge compiler",
    description:
      "Evidence transformed into structured knowledge candidates",
    value: "14 active",
    state: "active",
    icon: Workflow,
  },
  {
    id: "validation",
    label: "Validation gates",
    description:
      "Quality, conflict, policy, and authority verification",
    value: "3 reviews",
    state: "attention",
    icon: FileCheck2,
  },
  {
    id: "publication",
    label: "Canonical publication",
    description:
      "Approved knowledge promoted as governed products",
    value: "426 published",
    state: "healthy",
    icon: BookOpenCheck,
  },
];

const ACTIVITY: ActivityItem[] = [
  {
    id: "activity-1",
    title:
      "Runtime lifecycle contract published",
    description:
      "Architecture knowledge · Version 12",
    time: "2 min ago",
    type: "published",
    icon: BookOpenCheck,
  },
  {
    id: "activity-2",
    title:
      "Repository evidence compilation completed",
    description:
      "KoreLumina platform · 84 evidence items",
    time: "8 min ago",
    type: "compiled",
    icon: Workflow,
  },
  {
    id: "activity-3",
    title:
      "Conflicting preview ownership rule detected",
    description:
      "Governance review required",
    time: "17 min ago",
    type: "review",
    icon: AlertTriangle,
  },
  {
    id: "activity-4",
    title:
      "Runtime event journal synchronized",
    description:
      "Live runtime source · 236 events",
    time: "24 min ago",
    type: "source",
    icon: RadioTower,
  },
];

function stateClass(
  state: PipelineStage["state"],
) {
  switch (state) {
    case "healthy":
      return [
        "border-emerald-400/20",
        "bg-emerald-400/10",
        "text-emerald-300",
      ].join(" ");

    case "active":
      return [
        "border-cyan-400/20",
        "bg-cyan-400/10",
        "text-cyan-300",
      ].join(" ");

    case "attention":
      return [
        "border-amber-400/20",
        "bg-amber-400/10",
        "text-amber-300",
      ].join(" ");
  }
}

function stateLabel(
  state: PipelineStage["state"],
) {
  switch (state) {
    case "healthy":
      return "Healthy";

    case "active":
      return "Processing";

    case "attention":
      return "Attention";
  }
}

export default function KnowledgeOperationsV2Workspace({
  setView,
}: KnowledgeOperationsV2WorkspaceProps) {
  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[18%] top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-cyan-500/[0.07] blur-[140px]" />
        <div className="absolute right-[-10rem] top-[12rem] h-[34rem] w-[34rem] rounded-full bg-violet-500/[0.08] blur-[150px]" />
        <div className="absolute bottom-[-16rem] left-[40%] h-[32rem] w-[32rem] rounded-full bg-blue-500/[0.06] blur-[140px]" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col border-r border-white/[0.08] bg-[#090b12]/95 backdrop-blur-2xl">
          <div className="border-b border-white/[0.08] px-5 py-5">
            <button
              type="button"
              onClick={() => {
                setView("dashboard");
              }}
              className="flex items-center gap-2 text-xs font-medium text-white/50 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Platform
            </button>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
                <Sparkles className="h-5 w-5 text-cyan-300" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-tight">
                  Knowledge Operations
                </div>

                <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
                  Flagship workspace
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="px-3 pb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
              Operating domains
            </div>

            <nav
              aria-label="Knowledge Operations"
              className="space-y-1"
            >
              {NAVIGATION.map((item, index) => {
                const Icon = item.icon;
                const active = index === 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={[
                      "group relative flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
                      active
                        ? "border-cyan-300/15 bg-cyan-300/[0.08] shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
                        : "border-transparent hover:border-white/[0.07] hover:bg-white/[0.035]",
                    ].join(" ")}
                  >
                    {active && (
                      <span className="absolute inset-y-3 left-0 w-[2px] rounded-full bg-cyan-300" />
                    )}

                    <span
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                        active
                          ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-300"
                          : "border-white/[0.07] bg-white/[0.025] text-white/45 group-hover:text-white/75",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={[
                          "block truncate text-xs font-semibold",
                          active
                            ? "text-white"
                            : "text-white/70",
                        ].join(" ")}
                      >
                        {item.label}
                      </span>

                      <span className="mt-0.5 block truncate text-[9px] text-white/30">
                        {item.description}
                      </span>
                    </span>

                    {item.count !== undefined && (
                      <span className="rounded-md border border-white/[0.06] bg-black/20 px-1.5 py-1 text-[9px] font-semibold tabular-nums text-white/40">
                        {item.count.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/[0.08] p-4">
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300">
                <CircleDot className="h-3.5 w-3.5" />
                System operational
              </div>

              <div className="mt-2 text-[10px] leading-5 text-white/40">
                All authoritative knowledge services are available.
              </div>
            </div>
          </div>
        </aside>

        <main className="ml-[264px] min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#07090f]/80 backdrop-blur-2xl">
            <div className="flex h-[72px] items-center justify-between gap-6 px-7">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Knowledge Operations
                  <ChevronRight className="h-3 w-3" />
                  Command Center
                </div>

                <h1 className="mt-1 truncate text-lg font-semibold tracking-tight">
                  Enterprise Knowledge Command Center
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-xs font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Search className="h-3.5 w-3.5" />
                  Search knowledge
                  <span className="ml-4 flex items-center gap-1 rounded border border-white/[0.08] bg-black/20 px-1.5 py-0.5 text-[9px] text-white/30">
                    <Command className="h-2.5 w-2.5" />
                    K
                  </span>
                </button>

                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-xs font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>

                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 text-xs font-semibold text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.08)] transition hover:bg-cyan-300/15"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  New operation
                </button>
              </div>
            </div>
          </header>

          <div className="px-7 py-6">
            <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
              <div className="relative px-6 py-6">
                <div className="pointer-events-none absolute right-[-5rem] top-[-7rem] h-64 w-64 rounded-full bg-cyan-400/[0.08] blur-[90px]" />

                <div className="relative flex items-start justify-between gap-8">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.19em] text-cyan-300/80">
                      <Layers3 className="h-3.5 w-3.5" />
                      Enterprise knowledge system
                    </div>

                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">
                      Govern the complete lifecycle of organizational knowledge.
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                      Acquire authoritative evidence, compile structured knowledge,
                      resolve conflicts, certify quality, and publish trusted
                      knowledge products for every KoreLumina system.
                    </p>
                  </div>

                  <div className="shrink-0 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                      <CircleDot className="h-3.5 w-3.5" />
                      Live
                    </div>

                    <div className="mt-1 text-xs font-medium text-white/65">
                      Last synchronized 32s ago
                    </div>
                  </div>
                </div>

                <div className="relative mt-6 grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07]">
                  {METRICS.map((metric) => {
                    const Icon = metric.icon;

                    return (
                      <article
                        key={metric.label}
                        className="bg-[#0b0e16] px-5 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
                            {metric.label}
                          </div>

                          <Icon className="h-4 w-4 text-cyan-300/65" />
                        </div>

                        <div className="mt-3 flex items-end gap-2">
                          <div className="text-2xl font-semibold tracking-tight tabular-nums">
                            {metric.value}
                          </div>

                          <div className="pb-1 text-[10px] font-semibold text-emerald-300">
                            {metric.change}
                          </div>
                        </div>

                        <div className="mt-2 text-[10px] leading-5 text-white/30">
                          {metric.detail}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_320px] gap-6">
              <div className="min-w-0 space-y-6">
                <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                    <div>
                      <div className="text-sm font-semibold">
                        Knowledge production pipeline
                      </div>

                      <div className="mt-1 text-[10px] text-white/35">
                        Live operational state across the governed lifecycle
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70 transition hover:text-cyan-200"
                    >
                      Open pipeline
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="space-y-2">
                      {PIPELINE.map((stage, index) => {
                        const Icon = stage.icon;

                        return (
                          <article
                            key={stage.id}
                            className="group relative flex items-center gap-4 rounded-xl border border-white/[0.07] bg-black/10 px-4 py-3 transition hover:border-white/[0.12] hover:bg-white/[0.025]"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-white/65">
                              <Icon className="h-4.5 w-4.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">
                                  {stage.label}
                                </span>

                                <span
                                  className={[
                                    "rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.13em]",
                                    stateClass(stage.state),
                                  ].join(" ")}
                                >
                                  {stateLabel(stage.state)}
                                </span>
                              </div>

                              <div className="mt-1 truncate text-[10px] text-white/35">
                                {stage.description}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs font-semibold tabular-nums text-white/70">
                                {stage.value}
                              </div>

                              <div className="mt-1 text-[9px] text-white/25">
                                Stage {index + 1} of {PIPELINE.length}
                              </div>
                            </div>

                            <ChevronRight className="h-4 w-4 text-white/20 transition group-hover:text-white/45" />
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-6">
                  <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                    <div className="border-b border-white/[0.07] px-5 py-4">
                      <div className="text-sm font-semibold">
                        Knowledge composition
                      </div>

                      <div className="mt-1 text-[10px] text-white/35">
                        Published product distribution
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-6">
                        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-[12px] border-cyan-300/15">
                          <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-r-cyan-300 border-t-cyan-300" />

                          <div className="text-center">
                            <div className="text-2xl font-semibold tabular-nums">
                              426
                            </div>

                            <div className="text-[9px] uppercase tracking-[0.14em] text-white/30">
                              Products
                            </div>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                          {[
                            ["Architecture", "148", "34.7%"],
                            ["Engineering", "121", "28.4%"],
                            ["Operations", "94", "22.1%"],
                            ["Governance", "63", "14.8%"],
                          ].map(([label, value, percent]) => (
                            <div
                              key={label}
                              className="flex items-center gap-3"
                            >
                              <span className="h-2 w-2 rounded-full bg-cyan-300/70" />

                              <span className="min-w-0 flex-1 truncate text-[10px] text-white/45">
                                {label}
                              </span>

                              <span className="text-[10px] font-semibold tabular-nums text-white/70">
                                {value}
                              </span>

                              <span className="w-10 text-right text-[9px] tabular-nums text-white/25">
                                {percent}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>

                  <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                    <div className="border-b border-white/[0.07] px-5 py-4">
                      <div className="text-sm font-semibold">
                        Knowledge graph
                      </div>

                      <div className="mt-1 text-[10px] text-white/35">
                        Structural integrity and lineage
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            label: "Nodes",
                            value: "2,486",
                            icon: Boxes,
                          },
                          {
                            label: "Relations",
                            value: "6,928",
                            icon: GitBranch,
                          },
                          {
                            label: "Orphans",
                            value: "4",
                            icon: AlertTriangle,
                          },
                          {
                            label: "Integrity",
                            value: "99.2%",
                            icon: Network,
                          },
                        ].map((item) => {
                          const Icon = item.icon;

                          return (
                            <div
                              key={item.label}
                              className="rounded-xl border border-white/[0.07] bg-black/10 p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] uppercase tracking-[0.14em] text-white/30">
                                  {item.label}
                                </span>

                                <Icon className="h-3.5 w-3.5 text-cyan-300/55" />
                              </div>

                              <div className="mt-2 text-lg font-semibold tabular-nums">
                                {item.value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                    <div>
                      <div className="text-sm font-semibold">
                        Active attention
                      </div>

                      <div className="mt-1 text-[10px] text-white/35">
                        Actions requiring authority
                      </div>
                    </div>

                    <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[9px] font-semibold text-amber-300">
                      3
                    </span>
                  </div>

                  <div className="space-y-2 p-4">
                    {[
                      {
                        title:
                          "Resolve preview ownership conflict",
                        detail:
                          "Two canonical rules disagree",
                        urgency:
                          "High",
                      },
                      {
                        title:
                          "Approve runtime lifecycle contract",
                        detail:
                          "Awaiting architecture authority",
                        urgency:
                          "Review",
                      },
                      {
                        title:
                          "Certify workspace access model",
                        detail:
                          "Functional evidence complete",
                        urgency:
                          "Ready",
                      },
                    ].map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        className="group w-full rounded-xl border border-white/[0.07] bg-black/10 p-3 text-left transition hover:border-white/[0.12] hover:bg-white/[0.025]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-[11px] font-semibold leading-5 text-white/75">
                            {item.title}
                          </div>

                          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20 group-hover:text-white/50" />
                        </div>

                        <div className="mt-1 text-[9px] leading-4 text-white/30">
                          {item.detail}
                        </div>

                        <div className="mt-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-amber-300/70">
                          {item.urgency}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                  <div className="border-b border-white/[0.07] px-5 py-4">
                    <div className="text-sm font-semibold">
                      Recent activity
                    </div>

                    <div className="mt-1 text-[10px] text-white/35">
                      Authoritative operational journal
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.06] px-4">
                    {ACTIVITY.map((item) => {
                      const Icon = item.icon;

                      return (
                        <article
                          key={item.id}
                          className="flex gap-3 py-4"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-cyan-300/60">
                            <Icon className="h-3.5 w-3.5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-semibold leading-4 text-white/70">
                              {item.title}
                            </div>

                            <div className="mt-1 text-[9px] leading-4 text-white/30">
                              {item.description}
                            </div>

                            <div className="mt-2 flex items-center gap-1.5 text-[8px] uppercase tracking-[0.12em] text-white/20">
                              <Clock3 className="h-2.5 w-2.5" />
                              {item.time}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
