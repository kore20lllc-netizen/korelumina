import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { KnowledgeExecutiveCard } from "../primitives/KnowledgeExecutiveCard";
import { ExecutionFrame } from "./ExecutionFrame";
import { ExecutionCursor } from "./ExecutionCursor";
import { getStageTelemetry } from "./ProductionNavigatorTelemetry";

import {
  glass,
  border,
  shadow,
  radius,
} from "../theme/appearance";
import {
  Archive,
  Binary,
  Boxes,
  Braces,
  CheckCheck,
  Database,
  FileSearch,
  GitBranch,
  LibraryBig,
} from "lucide-react";


type StageStatus =
  | "complete"
  | "active"
  | "waiting"
  | "blocked";

interface Stage {
  id: string;
  label: string;
  icon: LucideIcon;
  status: StageStatus;
}



const STAGES: Stage[] = [
  {
    id: "sources",
    status: "active",
    progress: 0,
    documentsProcessed: 0,
    documentsTotal: 0,
    activeAgents: 0,
    throughput: "0/min",
    label: "Sources",
    icon: Database,
  },
  {
    id: "acquisition",
    status: "waiting",
    progress: 0,
    documentsProcessed: 0,
    documentsTotal: 0,
    activeAgents: 0,
    throughput: "0/min",
    label: "Acquisition",
    icon: Archive,
  },
  {
    id: "evidence",
    status: "waiting",
    progress: 0,
    documentsProcessed: 0,
    documentsTotal: 0,
    activeAgents: 0,
    throughput: "0/min",
    label: "Evidence",
    icon: FileSearch,
  },
  {
    id: "compiler",
    status: "waiting",
    progress: 0,
    documentsProcessed: 0,
    documentsTotal: 0,
    activeAgents: 0,
    throughput: "0/min",
    label: "Knowledge Compiler",
    icon: Binary,
  },
  {
    id: "ir",
    status: "waiting",
    progress: 0,
    documentsProcessed: 0,
    documentsTotal: 0,
    activeAgents: 0,
    throughput: "0/min",
    label: "Knowledge IR",
    icon: Braces,
  },
  {
    id: "validation",
    status: "waiting",
    progress: 0,
    documentsProcessed: 0,
    documentsTotal: 0,
    activeAgents: 0,
    throughput: "0/min",
    label: "Validation",
    icon: CheckCheck,
  },
  {
    id: "canonical",
    status: "waiting",
    progress: 0,
    documentsProcessed: 0,
    documentsTotal: 0,
    activeAgents: 0,
    throughput: "0/min",
    label: "Canonical Knowledge",
    icon: LibraryBig,
  },
  {
    id: "graph",
    status: "waiting",
    progress: 0,
    documentsProcessed: 0,
    documentsTotal: 0,
    activeAgents: 0,
    throughput: "0/min",
    label: "Knowledge Graph",
    icon: GitBranch,
  },
  {
    id: "memory",
    status: "waiting",
    progress: 0,
    documentsProcessed: 0,
    documentsTotal: 0,
    activeAgents: 0,
    throughput: "0/min",
    label: "Organizational Memory",
    icon: Boxes,
  },
];


interface ProductionPipeline {
  stages: Stage[];
}

const DEFAULT_PIPELINE: ProductionPipeline = {
  stages: STAGES,
};

const STAGE_METRICS: Record<
  string,
  {
    primary: string;
    secondary: string;
    primaryValue: (stage: Stage) => string | number;
    secondaryValue: (stage: Stage) => string | number;
  }
> = {
  sources: {
    primary: "Repositories",
    secondary: "Connectors",
    primaryValue: () => 24,
    secondaryValue: () => 8,
  },
  acquisition: {
    primary: "Throughput",
    secondary: "Queue",
    primaryValue: (s) => s.throughput,
    secondaryValue: () => 187,
  },
  evidence: {
    primary: "Facts",
    secondary: "Confidence",
    primaryValue: () => "18.2K",
    secondaryValue: () => "97%",
  },
  compiler: {
    primary: "Compiled",
    secondary: "Failures",
    primaryValue: () => "4.8K",
    secondaryValue: () => 3,
  },
  ir: {
    primary: "Nodes",
    secondary: "Relations",
    primaryValue: () => "142K",
    secondaryValue: () => "918K",
  },
  validation: {
    primary: "Coverage",
    secondary: "Quality",
    primaryValue: () => "99.2%",
    secondaryValue: () => "A+",
  },
  canonical: {
    primary: "Assets",
    secondary: "Versions",
    primaryValue: () => 812,
    secondaryValue: () => 96,
  },
  graph: {
    primary: "Vertices",
    secondary: "Edges",
    primaryValue: () => "2.8M",
    secondaryValue: () => "8.4M",
  },
  memory: {
    primary: "Embeddings",
    secondary: "Index",
    primaryValue: () => "91M",
    secondaryValue: () => "2.3 TB",
  },
};




const STAGE_GRID: Record<string, { row: number; column: number }> = {
  sources: { row: 0, column: 0 },
  acquisition: { row: 0, column: 1 },
  evidence: { row: 0, column: 2 },
  compiler: { row: 1, column: 0 },
  ir: { row: 1, column: 1 },
  validation: { row: 1, column: 2 },
  canonical: { row: 2, column: 0 },
  graph: { row: 2, column: 1 },
  memory: { row: 2, column: 2 },
};





export function ProductionNavigator() {
  const [selected, setSelected] = useState("acquisition");

const cursor = STAGE_GRID[selected] ?? {
  row: 0,
  column: 0,
};


  return (
    <nav
      aria-label="Knowledge Production Pipeline"
      className={`
        ${radius.panel}
        ${glass.panel}
        border border-cyan-300/45
        ring-1 ring-inset ring-cyan-300/20
        shadow-[
          0_0_0_1px_rgba(34,211,238,0.10),
          0_0_28px_rgba(14,165,233,0.12),
          inset_0_1px_0_rgba(255,255,255,0.07)
        ]
        p-3
      `}
    >
      <ExecutionFrame>
        <div className="relative min-h-[420px]">

          <ExecutionCursor
            row={cursor.row}
            column={cursor.column}
          />

          <div
            className="
              relative
              z-10
              grid
              grid-cols-3
              gap-4
              h-full
              items-stretch
            "
          >
        {DEFAULT_PIPELINE.stages.map((stage) => {
          const Icon = stage.icon;

          const status = stage.status;


          const metrics =
            STAGE_METRICS[stage.id];

          const complete =
            status === "complete";

          const active =
            status === "active";

          const blocked =
            status === "blocked";

          const selectedStage =
            stage.id === selected;

          const stageAccent = {
            sources: "cyan",
            acquisition: "sky",
            evidence: "violet",
            compiler: "indigo",
            ir: "blue",
            validation: "emerald",
            canonical: "amber",
            graph: "fuchsia",
            memory: "slate",
          }[stage.id] ?? "cyan";

          const stageStatusLabel = {
            complete: "READY",
            active: "PROCESSING",
            blocked: "REVIEW",
            waiting: "QUEUED",
          }[stage.status] ?? stage.status.toUpperCase();


          const iconClass = {
            sources: "bg-cyan-400/15 text-cyan-100",
            acquisition: "bg-sky-400/15 text-sky-100",
            evidence: "bg-violet-400/15 text-violet-100",
            compiler: "bg-indigo-400/15 text-indigo-100",
            ir: "bg-blue-400/15 text-blue-100",
            validation: "bg-emerald-400/15 text-emerald-100",
            canonical: "bg-amber-400/15 text-amber-100",
            graph: "bg-fuchsia-400/15 text-fuchsia-100",
            memory: "bg-slate-400/15 text-slate-100",
          }[stage.id] ?? "bg-cyan-400/15 text-cyan-100";



          return (
            
<KnowledgeExecutiveCard
              data-production-stage
  key={stage.id}
  interactive
  selected={selectedStage}
  accentKey={
    selectedStage
      ? "cyan"
      : complete
        ? "emerald"
        : blocked
          ? "amber"
          : active
            ? "cyan"
            : "slate"
  }
  title={stage.label}
  description="Pipeline Stage"
  onClick={() => setSelected(stage.id)}
  className="h-full min-h-[120px]"
  header={
    <span
      className={`
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-xl
        border
        border-white/10
        ${iconClass}
      `}
    >
      <Icon className="h-5 w-5" />
    </span>
  }
  footer={
    <div className="space-y-3">
      <div className="flex">
        <span className={`rounded-full px-2.5 py-1 font-medium ${
          stage.status === "complete"
            ? "bg-emerald-500/15 text-emerald-300"
            : stage.status === "active"
              ? "bg-cyan-500/15 text-cyan-300"
              : stage.status === "blocked"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-slate-500/15 text-slate-300"
        }`}>
          {stageStatusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/8 pt-3">
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">
            Processed
          </div>
          <div className="font-semibold text-white">
            {stage.documentsProcessed}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase text-muted-foreground">
            Updated
          </div>
          <div className="font-semibold text-white">
            Just now
          </div>
        </div>
      </div>
    </div>
  }
>
  <div className="flex h-full flex-col">

    <div className="mb-4">

      <div className="text-lg font-semibold leading-tight text-white">
        {stage.label}
      </div>

      <div className="mt-1 text-[13px] text-muted-foreground">
        {stage.description}
      </div>

    </div>

    <div className="mb-5 text-center">

      <div className="text-5xl xl:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.08)]">
        {stage.documentsTotal || 24}
      </div>

      <div className="mt-2 text-[11px] uppercase tracking-[0.24em] text-cyan-200/80">
        {stage.metricLabel}
      </div>

    </div>

    <div className="flex gap-3 mb-5">

      <div className="rounded-2xl border border-white/15 bg-white/8 p-3.5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Throughput
        </div>
        <div className="mt-2 truncate text-[15px] font-semibold text-white">
          {metrics.primaryValue(stage)}
        </div>
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/8 p-3.5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Agents
        </div>
        <div className="mt-2 truncate text-[15px] font-semibold text-white">
          {metrics.secondaryValue(stage)}
        </div>
      </div>

    </div>

    <div className="mt-auto">

      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>Progress</span>
        <span>{stage.progress}%</span>
      </div>

      <div className="h-3.5 overflow-hidden rounded-full bg-white/10">

        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 shadow-[0_0_12px_rgba(56,189,248,.55)] transition-all duration-500"
          style={{
            width: `${stage.progress}%`,
          }}
        />

      </div>

    </div>

  </div>
</KnowledgeExecutiveCard>

          );
        })}
          </div>
        </div>
      </ExecutionFrame>
    </nav>
  );
}
