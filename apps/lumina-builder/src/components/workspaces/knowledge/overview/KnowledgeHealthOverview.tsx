import {
  Brain,
  Database,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import { KnowledgeMetricTile } from "./KnowledgeMetricTile";

function num(value: number | undefined) {
  return (value ?? 0).toLocaleString();
}

function pct(value: number | undefined) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

export function KnowledgeHealthOverview({
  snapshot,
}: {
  snapshot: KnowledgeOperationsSnapshot | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KnowledgeMetricTile
        label="Evidence"
        value={num(snapshot?.evidence.total)}
        hint="Immutable source records"
        icon={Database}
        accent="violet"
      />

      <KnowledgeMetricTile
        label="Knowledge IR"
        value={num(snapshot?.knowledge.candidateItems)}
        hint="Candidate knowledge awaiting validation"
        icon={Workflow}
        accent="cyan"
      />

      <KnowledgeMetricTile
        label="Canonical"
        value={num(snapshot?.knowledge.canonicalItems)}
        hint="Promoted institutional memory"
        icon={Sparkles}
        accent="gold"
      />

      <KnowledgeMetricTile
        label="Promotion"
        value={pct(snapshot?.knowledge.promotionRate)}
        hint="Candidate to canonical conversion"
        icon={ShieldCheck}
        accent="magenta"
      />

      <KnowledgeMetricTile
        label="Learning"
        value="Active"
        hint="Pattern discovery scaffolded"
        icon={Brain}
        accent="violet"
      />

      <KnowledgeMetricTile
        label="Memory"
        value="Synced"
        hint="Organizational memory target"
        icon={Network}
        accent="cyan"
      />

      <KnowledgeMetricTile
        label="Reasoning"
        value="Queued"
        hint="Findings and recommendations"
        icon={Brain}
        accent="gold"
      />

      <KnowledgeMetricTile
        label="Improvement"
        value="Governed"
        hint="Human approval required"
        icon={ShieldCheck}
        accent="magenta"
      />
    </div>
  );
}
