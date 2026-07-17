import {
  Activity,
  Database,
  ShieldCheck,
  Sparkles,
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

export interface KnowledgeExecutiveMetricsProps {
  snapshot: KnowledgeOperationsSnapshot | null;
}

function formatNumber(
  value: number | undefined,
): string {
  return value === undefined
    ? "—"
    : value.toLocaleString();
}

function formatHealth(
  value: number | undefined,
): string {
  return value === undefined
    ? "—"
    : `${Math.round(value)}%`;
}

function formatRate(
  value: number | undefined,
): string {
  return value === undefined
    ? "—"
    : `${Math.round(value * 100)}%`;
}

export function KnowledgeExecutiveMetrics({
  snapshot,
}: KnowledgeExecutiveMetricsProps) {
  return (
    <section
      aria-labelledby="knowledge-executive-metrics"
      className="space-y-3"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div
            id="knowledge-executive-metrics"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
          >
            Executive intelligence
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            Authoritative health, evidence, memory, and governance outcomes.
          </div>
        </div>

        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Tier 1
        </div>
      </div>

      <LuminaMetricGrid>
        <KnowledgeMetricTile
          label="Knowledge Health"
          value={formatHealth(
            snapshot?.summary.healthScore,
          )}
          hint={
            snapshot
              ? "Authoritative organizational knowledge score"
              : "Awaiting authoritative snapshot"
          }
          icon={Activity}
          accent="violet"
        />

        <KnowledgeMetricTile
          label="Evidence"
          value={formatNumber(
            snapshot?.summary.totalEvidence,
          )}
          hint={
            snapshot
              ? `${formatNumber(
                  snapshot.acquisition.evidenceExtracted,
                )} extracted in current acquisition`
              : "Awaiting authoritative snapshot"
          }
          icon={Database}
          accent="cyan"
        />

        <KnowledgeMetricTile
          label="Canonical Memory"
          value={formatNumber(
            snapshot?.knowledge.canonicalItems,
          )}
          hint={
            snapshot
              ? `${formatNumber(
                  snapshot.knowledge.candidateItems,
                )} candidates awaiting governance`
              : "Awaiting authoritative snapshot"
          }
          icon={Sparkles}
          accent="gold"
        />

        <KnowledgeMetricTile
          label="Promotion Rate"
          value={formatRate(
            snapshot?.knowledge.promotionRate,
          )}
          hint={
            snapshot
              ? "Candidate-to-canonical conversion"
              : "Awaiting authoritative snapshot"
          }
          icon={ShieldCheck}
          accent="magenta"
        />
      </LuminaMetricGrid>
    </section>
  );
}

export default KnowledgeExecutiveMetrics;
