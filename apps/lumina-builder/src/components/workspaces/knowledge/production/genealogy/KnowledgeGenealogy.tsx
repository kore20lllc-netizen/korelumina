import {
  BookOpenCheck,
  BrainCircuit,
  GitBranch,
  GraduationCap,
  Network,
  Route,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import {
  LuminaBalancedSplitPanelComposition,
} from "@/components/design-system/compositions/LuminaBalancedSplitPanelComposition";

import {
  LuminaExecutiveTitleMetricsComposition,
} from "@/components/design-system/compositions/LuminaExecutiveTitleMetricsComposition";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  electricContour,
  LuminaExecutiveCard,
  LuminaExecutiveMetricGrid,
  premiumSurfaces,
} from "@/components/design-system/lumina";

import {
  LuminaProminentPremiumPanel,
} from "@/components/design-system/surfaces/LuminaProminentPremiumPanel";

import {
  LuminaStandardPremiumCard,
} from "@/components/design-system/surfaces/LuminaStandardPremiumCard";

import {
  LuminaStandardPremiumPanel,
} from "@/components/design-system/surfaces/LuminaStandardPremiumPanel";

import type {
  KnowledgeCapsuleModel,
} from "../capsules";

type KnowledgeGenealogyProps = {
  capsules: KnowledgeCapsuleModel[];
  selectedCapsuleId: string;
  onCapsuleSelect: (capsuleId: string) => void;
};

export function KnowledgeGenealogy({
  capsules,
  selectedCapsuleId,
  onCapsuleSelect,
}: KnowledgeGenealogyProps) {
  const capsule =
    capsules.find(
      (item) => item.id === selectedCapsuleId,
    ) ??
    capsules.find(
      (item) => item.stage === "Canonical Knowledge",
    ) ??
    capsules[0];

  if (!capsule) {
    return null;
  }

  const healthyLayers = capsule.layers.filter(
    (layer) => layer.status === "healthy",
  ).length;

  const guardedLayers = capsule.layers.filter(
    (layer) => layer.status !== "failed",
  ).length;

  const lineageSteps = [
    {
      label: "Knowledge identity",
      value: capsule.identity,
      detail: capsule.id,
      icon: GitBranch,
      state: "active" as const,
    },
    {
      label: "Compiler generation",
      value: capsule.compiler,
      detail: capsule.packageType,
      icon: Workflow,
      state: "active" as const,
    },
    {
      label: "Mission lineage",
      value: capsule.mission,
      detail: capsule.summary,
      icon: Route,
      state: "healthy" as const,
    },
    {
      label: "Governance authority",
      value: capsule.authority,
      detail: capsule.approval,
      icon: ShieldCheck,
      state: "healthy" as const,
    },
    {
      label: "Educational mapping",
      value: capsule.educationalModule,
      detail: "Competency and learning projection retained.",
      icon: GraduationCap,
      state: "active" as const,
    },
    {
      label: "Distribution consumer",
      value: capsule.consumer,
      detail: capsule.destination,
      icon: Network,
      state: "active" as const,
    },
  ];

  return (
    <section
      aria-labelledby="knowledge-genealogy-title"
      className="grid gap-5"
    >
      <LuminaExecutiveTitleMetricsComposition
        titleRegion={
          <LuminaProminentPremiumPanel>
            <div className="flex h-full flex-col justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <ExecutivePremiumIcon
                    icon={GitBranch}
                    state="active"
                  />

                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/68">
                      Permanent knowledge lineage
                    </div>

                    <h2
                      id="knowledge-genealogy-title"
                      className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-amber-400"
                    >
                      Knowledge Genealogy
                    </h2>
                  </div>
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-sky-300/68">
                  Knowledge Genealogy preserves the complete ancestry of every
                  Knowledge Capsule from source identity and compiler generation
                  through governance, canonical promotion, adaptation,
                  distribution, and organizational consumption.
                </p>
              </div>

              <LuminaStandardPremiumCard>
                <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-200/58">
                  Active lineage
                </div>

                <div className="mt-2 text-sm font-semibold text-violet-100">
                  {capsule.title}
                </div>

                <div className="mt-2 text-[11px] leading-5 text-violet-200/56">
                  {capsule.id} · {capsule.stage} · {capsule.state}
                </div>
              </LuminaStandardPremiumCard>
            </div>
          </LuminaProminentPremiumPanel>
        }
        metricsRegion={
          <LuminaExecutiveMetricGrid columns={2}>
            <LuminaExecutiveCard
              title="Lineage layers"
              value={String(capsule.layers.length)}
              description="Traceable preservation layers in this capsule."
              accentKey="cyan"
              icon={<GitBranch className="h-4 w-4 text-cyan-300" />}
            />

            <LuminaExecutiveCard
              title="Healthy layers"
              value={String(healthyLayers)}
              description="Layers currently preserving expected integrity."
              accentKey="emerald"
              icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}
            />

            <LuminaExecutiveCard
              title="Governed layers"
              value={String(guardedLayers)}
              description="Layers retained without a failed lineage state."
              accentKey="violet"
              icon={<BookOpenCheck className="h-4 w-4 text-violet-300" />}
            />

            <LuminaExecutiveCard
              title="Confidence"
              value={`${capsule.confidence}%`}
              description="Current confidence across the capsule genealogy."
              accentKey="amber"
              icon={<BrainCircuit className="h-4 w-4 text-amber-300" />}
            />
          </LuminaExecutiveMetricGrid>
        }
      />

      <LuminaStandardPremiumPanel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/62">
              Capsule ancestry
            </div>

            <h3 className="mt-1 text-lg font-semibold text-sky-100">
              Source-to-consumer lineage
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onCapsuleSelect(capsule.id)}
            className="rounded-full border border-cyan-300/24 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.1]"
          >
            Inspect {capsule.id}
          </button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {lineageSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <LuminaStandardPremiumCard
                as="article"
                key={step.label}
              >
                <div className="flex items-start gap-3">
                  <ExecutivePremiumIcon
                    icon={Icon}
                    state={step.state}
                  />

                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-300/54">
                      {String(index + 1).padStart(2, "0")} · {step.label}
                    </div>

                    <div className="mt-2 text-sm font-semibold text-white">
                      {step.value}
                    </div>

                    <div className="mt-2 text-[11px] leading-5 text-sky-300/58">
                      {step.detail}
                    </div>
                  </div>
                </div>
              </LuminaStandardPremiumCard>
            );
          })}
        </div>
      </LuminaStandardPremiumPanel>

      <LuminaBalancedSplitPanelComposition
        primaryRegion={
          <LuminaStandardPremiumPanel className="h-full">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/62">
            Provenance integrity
          </div>

          <h3 className="mt-1 text-lg font-semibold text-emerald-100">
            Preserved capsule layers
          </h3>

          <div className="mt-5 grid gap-3">
            {capsule.layers.map((layer) => (
              <LuminaStandardPremiumCard
                as="article"
                key={layer.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {layer.label}
                    </div>

                    <div className="mt-2 text-[11px] leading-5 text-sky-300/58">
                      {layer.detail}
                    </div>
                  </div>

                  <div className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                    {layer.status}
                  </div>
                </div>
              </LuminaStandardPremiumCard>
            ))}
          </div>
          </LuminaStandardPremiumPanel>
        }
        secondaryRegion={
          <LuminaStandardPremiumPanel className="h-full">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/62">
            Authority continuity
          </div>

          <h3 className="mt-1 text-lg font-semibold text-violet-100">
            Canonical lineage safeguards
          </h3>

          <div className="mt-5 grid gap-3">
            <LuminaStandardPremiumCard>
              <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                Responsible authority
              </div>
              <div className="mt-2 text-sm font-semibold text-cyan-100">
                {capsule.responsibleAuthority ?? capsule.authority}
              </div>
            </LuminaStandardPremiumCard>

            <LuminaStandardPremiumCard>
              <div className="text-[9px] uppercase tracking-[0.14em] text-amber-300/52">
                Remediation lineage
              </div>
              <div className="mt-2 text-sm font-semibold text-amber-100">
                {capsule.remediation ?? "No active remediation required"}
              </div>
            </LuminaStandardPremiumCard>

            <LuminaStandardPremiumCard>
              <div className="text-[9px] uppercase tracking-[0.14em] text-violet-300/52">
                Blocked dependencies
              </div>
              <div className="mt-2 text-sm font-semibold text-violet-100">
                {capsule.blockedDependencies?.join(", ") || "No blocked dependencies"}
              </div>
            </LuminaStandardPremiumCard>

            <LuminaStandardPremiumCard>
              <div className="text-[9px] uppercase tracking-[0.14em] text-emerald-300/52">
                Integrity posture
              </div>
              <div className="mt-2 text-sm font-semibold text-emerald-100">
                {capsule.integrity}
              </div>
            </LuminaStandardPremiumCard>
          </div>
          </LuminaStandardPremiumPanel>
        }
      />
    </section>
  );
}
