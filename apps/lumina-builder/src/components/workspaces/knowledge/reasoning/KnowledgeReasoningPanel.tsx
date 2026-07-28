import {
  ArrowDown,
  CheckCircle2,
  Database,
  FileSearch,
  Filter,
  GitMerge,
  Scale,
} from "lucide-react";

import type { KnowledgeOperationsSnapshot } from "../../types";

interface Props {
  snapshot: KnowledgeOperationsSnapshot | null;
}

const STAGES = [
  {
    title: "Acquisition",
    subtitle: "Evidence ingestion",
    icon: Database,
    queue: 28,
    throughput: "142/hr",
    health: 98,
  },
  {
    title: "Knowledge IR",
    subtitle: "Normalization",
    icon: FileSearch,
    queue: 18,
    throughput: "118/hr",
    health: 96,
  },
  {
    title: "Reduction",
    subtitle: "Deduplication",
    icon: Filter,
    queue: 11,
    throughput: "96/hr",
    health: 95,
  },
  {
    title: "Compilation",
    subtitle: "Knowledge synthesis",
    icon: GitMerge,
    queue: 7,
    throughput: "81/hr",
    health: 97,
  },
  {
    title: "Validation",
    subtitle: "Governance",
    icon: Scale,
    queue: 3,
    throughput: "79/hr",
    health: 99,
  },
  {
    title: "Canonicalization",
    subtitle: "Institutional memory",
    icon: CheckCircle2,
    queue: 0,
    throughput: "76/hr",
    health: 100,
  },
];

export function KnowledgeReasoningPanel({
  snapshot,
}: Props) {
  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
        Loading knowledge…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Knowledge Processing
        </div>

        <h2 className="mt-2 text-xl font-semibold">
          Preservation Pipeline
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Operational flow from organizational evidence to canonical knowledge.
        </p>
      </div>

      <div className="mt-6 flex-1 space-y-3">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;

          return (
            <div key={stage.title}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {stage.title}
                      </div>

                      <div className="text-xs font-medium text-emerald-400">
                        {stage.health}%
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {stage.subtitle}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-white/10 p-2">
                        <div className="text-lg font-semibold">
                          {stage.queue}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Queue
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 p-2">
                        <div className="text-lg font-semibold">
                          {stage.throughput}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Throughput
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {index < STAGES.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
