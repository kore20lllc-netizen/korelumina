import {
  Brain,
  GitBranch,
  Network,
  Workflow,
} from "lucide-react";

import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  LuminaMetricGrid,
} from "@/components/lumina/workspace";

import {
  KnowledgeMetricTile,
} from "../overview/KnowledgeMetricTile";

export interface KnowledgeOperationalMetricsProps {
  snapshot: KnowledgeOperationsSnapshot | null;
}

function unavailableHint(
  snapshot: KnowledgeOperationsSnapshot | null,
  contract: string,
): string {
  return snapshot
    ? `${contract} is not exposed by the current authoritative snapshot`
    : "Awaiting authoritative snapshot";
}

export function KnowledgeOperationalMetrics({
  snapshot,
}: KnowledgeOperationalMetricsProps) {
  return (
    <section
      aria-labelledby="knowledge-operational-metrics"
      className="space-y-3"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div
            id="knowledge-operational-metrics"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
          >
            Operational intelligence
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            Learning, memory, reasoning, and governed improvement readiness.
          </div>
        </div>

        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Tier 2
        </div>
      </div>

      <LuminaMetricGrid>
        <KnowledgeMetricTile
          label="Learning"
          value="—"
          hint={unavailableHint(
            snapshot,
            "Learning telemetry",
          )}
          icon={Brain}
          accent="violet"
        />

        <KnowledgeMetricTile
          label="Organizational Memory"
          value="—"
          hint={unavailableHint(
            snapshot,
            "Memory synchronization telemetry",
          )}
          icon={Network}
          accent="cyan"
        />

        <KnowledgeMetricTile
          label="Reasoning"
          value="—"
          hint={unavailableHint(
            snapshot,
            "Reasoning queue telemetry",
          )}
          icon={GitBranch}
          accent="gold"
        />

        <KnowledgeMetricTile
          label="Improvement"
          value="—"
          hint={unavailableHint(
            snapshot,
            "Governed improvement telemetry",
          )}
          icon={Workflow}
          accent="magenta"
        />
      </LuminaMetricGrid>
    </section>
  );
}

export default KnowledgeOperationalMetrics;
