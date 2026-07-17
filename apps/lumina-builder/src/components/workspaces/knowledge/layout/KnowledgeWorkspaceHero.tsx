import {
  Activity,
  BookOpenCheck,
  Database,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaMetricCard,
  LuminaMetricGrid,
  LuminaWorkspaceBrand,
  LuminaWorkspaceHero,
} from "@/components/lumina/workspace";

export interface KnowledgeWorkspaceHeroProps {
  snapshot: KnowledgeOperationsSnapshot | null;
  onBack(): void;
  onRefresh(): void | Promise<void>;
}

function formatPercent(
  value: number | undefined,
) {
  if (value === undefined) {
    return "—";
  }

  return `${Math.round(value)}%`;
}

function formatNumber(
  value: number | undefined,
) {
  if (value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat().format(
    value,
  );
}

function formatUpdatedAt(
  generatedAt: number | undefined,
) {
  if (generatedAt === undefined) {
    return "Awaiting authoritative snapshot";
  }

  return `Updated ${new Date(
    generatedAt,
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function KnowledgeWorkspaceHero({
  snapshot,
  onBack,
  onRefresh,
}: KnowledgeWorkspaceHeroProps) {
  const summary =
    snapshot?.summary;

  const knowledge =
    snapshot?.knowledge;

  const acquisition =
    snapshot?.acquisition;

  const updatedLabel =
    formatUpdatedAt(
      snapshot?.generatedAt,
    );

  return (
    <LuminaWorkspaceHero
      eyebrow="Master OS · Internal"
      title={
        <LuminaWorkspaceBrand
          workspace="Knowledge Operations"
          tagline="Evidence • Learn • Reason • Govern"
          className="min-w-0 max-w-2xl"
        />
      }
      subtitle="Acquire evidence, govern institutional knowledge, reason over organizational intelligence, and continuously evolve the Chief Agent."
      metrics={
        <LuminaMetricGrid className="grid-cols-2 lg:grid-cols-2 w-full lg:min-w-[42rem]">
          <LuminaMetricCard
            label="Knowledge Health"
            value={formatPercent(summary?.healthScore)}
            footer={updatedLabel}
            icon={
              <Activity className="h-5 w-5 text-emerald-300"/>
            }
          />

          <LuminaMetricCard
            label="Evidence"
            value={formatNumber(summary?.totalEvidence)}
            footer={`Stage: ${acquisition?.stage ?? "Idle"}`}
            icon={
              <Database className="h-5 w-5 text-cyan-300"/>
            }
          />

          <LuminaMetricCard
            label="Canonical Memory"
            value={formatNumber(knowledge?.canonicalItems)}
            footer={`${formatNumber(knowledge?.candidateItems)} awaiting governance`}
            icon={
              <BookOpenCheck className="h-5 w-5 text-violet-300"/>
            }
          />

          <LuminaMetricCard
            label="Promotion Rate"
            value={formatPercent(knowledge?.promotionRate)}
            footer="Institutional promotion"
            icon={
              <ShieldCheck className="h-5 w-5 text-amber-300"/>
            }
          />
        </LuminaMetricGrid>
      }

      actions={
        <>
          <LuminaButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
          >
            Back
          </LuminaButton>

          <LuminaButton
            type="button"
            variant="glow"
            size="sm"
            onClick={() => {
              void onRefresh();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </LuminaButton>

          <LuminaButton
            type="button"
            variant="glow"
            size="sm"
          >
            <Database className="h-3.5 w-3.5" />
            Providers
          </LuminaButton>

          <LuminaButton
            type="button"
            variant="primary"
            size="sm"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Settings
          </LuminaButton>
        </>
      }
    >
    </LuminaWorkspaceHero>
  );
}

export default KnowledgeWorkspaceHero;
