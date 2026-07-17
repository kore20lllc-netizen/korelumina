import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  KnowledgeExecutiveMetrics,
} from "./KnowledgeExecutiveMetrics";

import {
  KnowledgeOperationalMetrics,
} from "./KnowledgeOperationalMetrics";

export interface KnowledgeMetricsOverviewProps {
  snapshot: KnowledgeOperationsSnapshot | null;
}

export function KnowledgeMetricsOverview({
  snapshot,
}: KnowledgeMetricsOverviewProps) {
  return (
    <div className="grid gap-6">
      <KnowledgeExecutiveMetrics
        snapshot={snapshot}
      />

      <KnowledgeOperationalMetrics
        snapshot={snapshot}
      />
    </div>
  );
}

export default KnowledgeMetricsOverview;
