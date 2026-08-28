import {
  useState,
} from "react";

import {
  BrainCircuit,
  History,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  LuminaBalancedSplitPanelComposition,
} from "@/components/design-system/compositions/LuminaBalancedSplitPanelComposition";

import {
  LuminaExecutiveTitleMetricsComposition,
} from "@/components/design-system/compositions/LuminaExecutiveTitleMetricsComposition";

import {
  LuminaPanelHeaderComposition,
} from "@/components/design-system/compositions/LuminaPanelHeaderComposition";

import {
  LuminaExecutiveCard,
  LuminaExecutiveMetricGrid,
} from "@/components/design-system/lumina";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  LuminaStatusBadge,
} from "@/components/lumina/workspace";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import type {
  OrganizationalMemoryProjection,
} from "../data/organizationalMemoryProjection";

type OrganizationalMemoryProps = {
  projection: OrganizationalMemoryProjection;
  selectedProjectionId?: string;
  onProjectionSelect: (
    capsuleId: string,
    projectionId: string,
  ) => void;

  onAdaptCanonical: (
    packageId: string,
  ) => Promise<void>;
};

export function OrganizationalMemory({
  projection,
  selectedProjectionId,
  onProjectionSelect,
  onAdaptCanonical,
}: OrganizationalMemoryProps) {
  const [
    adaptationConfirmTarget,
    setAdaptationConfirmTarget,
  ] = useState<string | null>(
    null,
  );

  const [
    adaptationBusy,
    setAdaptationBusy,
  ] = useState<string | null>(
    null,
  );

  const [
    adaptationError,
    setAdaptationError,
  ] = useState<string | null>(
    null,
  );

  async function adapt(
    packageId: string,
  ) {
    if (
      adaptationBusy
    ) {
      return;
    }

    try {
      setAdaptationBusy(
        packageId,
      );

      setAdaptationError(
        null,
      );

      await onAdaptCanonical(
        packageId,
      );

      setAdaptationConfirmTarget(
        null,
      );
    } catch (error) {
      setAdaptationError(
        error instanceof Error
          ? error.message
          : String(error),
      );
    } finally {
      setAdaptationBusy(
        null,
      );
    }
  }

  return (
    <section
      aria-labelledby="organizational-memory-title"
      className="grid gap-5"
    >
      <LuminaExecutiveTitleMetricsComposition
        variant="balanced-explicit"
        titleRegion={
          <LuminaFlagshipPanel
            title={null}
            className="h-full [&>div:nth-of-type(3)]:hidden"
          >
          <div className="flex h-full flex-col justify-between gap-5 p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon
                icon={BrainCircuit}
                state="active"
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/68">
                  Adaptive organizational stewardship
                </div>

                <h2
                  id="organizational-memory-title"
                  className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-amber-400"
                >
                  Organizational Memory
                </h2>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-sky-300/68">
              Organizational Memory adapts canonical knowledge into usable
              projections, summaries, and institutional learning while
              preserving privacy, lineage, and canonical authority.
            </p>
          </div>

          <LuminaFlagshipCard
            as="article"
            className="rounded-[18px] p-4"
          >
            <div className="relative z-10">
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-200/58">
                Stewardship boundary
              </div>

              <div className="mt-2 text-sm font-semibold text-violet-100">
                Memory adapts. Canonical Knowledge authorizes.
              </div>

              <div className="mt-2 text-[11px] leading-5 text-violet-200/56">
                No memory projection replaces, overrides, or silently mutates
                canonical authority.
              </div>
            </div>
          </LuminaFlagshipCard>
          </div>
          </LuminaFlagshipPanel>
        }
        metricsRegion={
          <LuminaExecutiveMetricGrid columns={2}>
        <LuminaExecutiveCard
          title="Active projections"
          value={projection.metrics.activeProjections}
          description="Governed adaptations serving organizational consumers."
          accentKey="cyan"
          icon={<Layers3 className="h-4 w-4 text-cyan-300" />}
        />

        <LuminaExecutiveCard
          title="Privacy filters"
          value={projection.metrics.privacyFilters}
          description="Projection boundaries protecting sensitive knowledge."
          accentKey="violet"
          icon={<ShieldCheck className="h-4 w-4 text-violet-300" />}
        />

        <LuminaExecutiveCard
          title="Institutional summaries"
          value={projection.metrics.institutionalSummaries}
          description="Cross-organizational learning distilled from use."
          accentKey="emerald"
          icon={<Sparkles className="h-4 w-4 text-emerald-300" />}
        />

        <LuminaExecutiveCard
          title="Adaptation generations"
          value={projection.metrics.adaptationGenerations}
          description="Traceable memory evolution from canonical sources."
          accentKey="amber"
          icon={<History className="h-4 w-4 text-amber-300" />}
        />
          </LuminaExecutiveMetricGrid>
        }
      />

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.38fr)_minmax(340px,.62fr)]">
        <LuminaFlagshipPanel
          title={null}
          className="[&>div:nth-of-type(3)]:hidden"
        >
          <div
            className="
              max-h-[760px]
              overflow-y-auto overflow-x-hidden
              overscroll-contain
              p-5 pr-3 sm:p-6 sm:pr-4
              [scrollbar-gutter:stable]
            "
          >
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/62">
              Memory adaptation
            </div>
            <h3 className="mt-1 text-lg font-semibold text-sky-100">
              Canonical knowledge projected for organizational use
            </h3>
          </div>

          {projection.adaptationCandidates.length > 0 ? (
            <div className="mt-5 grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-300/64">
                    Canonical adaptation queue
                  </div>

                  <div className="mt-1 text-xs leading-5 text-sky-300/60">
                    Canonical authority awaiting explicit generalized
                    Organizational Memory adaptation.
                  </div>
                </div>

                <LuminaStatusBadge variant="healthy">
                  {projection.adaptationCandidates.length} awaiting adaptation
                </LuminaStatusBadge>
              </div>

              {adaptationError ? (
                <div className="rounded-[14px] border border-rose-300/18 bg-rose-300/[0.05] px-4 py-3 text-xs text-rose-100">
                  {adaptationError}
                </div>
              ) : null}

              {projection.adaptationCandidates.map(
                (candidate) => {
                  const confirming =
                    adaptationConfirmTarget ===
                    candidate.id;

                  const busy =
                    adaptationBusy ===
                    candidate.id;

                  return (
                    <LuminaFlagshipCard
                      key={candidate.id}
                      as="article"
                      className="rounded-[18px] p-4"
                    >
                      <div className="relative z-10">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="break-words text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300/68 [overflow-wrap:anywhere]">
                                {candidate.id}
                              </span>

                              <LuminaStatusBadge variant="healthy">
                                Canonical
                              </LuminaStatusBadge>
                            </div>

                            <h4 className="mt-2 break-words text-base font-semibold text-white [overflow-wrap:anywhere]">
                              {candidate.title}
                            </h4>

                            <div className="mt-2 text-xs text-sky-300/60">
                              {candidate.version}
                              {" · "}
                              {candidate.scope}
                              {" · "}
                              {candidate.authority}
                            </div>
                          </div>

                          {!confirming ? (
                            <button
                              type="button"
                              disabled={
                                adaptationBusy !==
                                null
                              }
                              onClick={() => {
                                setAdaptationError(
                                  null,
                                );

                                setAdaptationConfirmTarget(
                                  candidate.id,
                                );
                              }}
                              className="shrink-0 rounded-full border border-emerald-300/28 bg-emerald-300/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 transition hover:border-emerald-300/44 hover:bg-emerald-300/[0.13] disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              Adapt to Organizational Memory
                            </button>
                          ) : null}
                        </div>

                        {confirming ? (
                          <div className="mt-4 rounded-[16px] border border-amber-300/18 bg-amber-300/[0.045] p-4">
                            <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-amber-200/72">
                              Confirm governed adaptation
                            </div>

                            <p className="mt-2 max-w-3xl text-xs leading-5 text-amber-100/68">
                              This creates a generalized Organizational Memory
                              projection while preserving canonical authority,
                              package lineage, human approval, provenance, and
                              the customer-specific privacy boundary.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={
                                  adaptationBusy !==
                                  null
                                }
                                onClick={() =>
                                  void adapt(
                                    candidate.id,
                                  )
                                }
                                className="rounded-full border border-emerald-300/30 bg-emerald-300/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 transition hover:bg-emerald-300/[0.15] disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                {busy
                                  ? "Adapting…"
                                  : "Confirm adaptation"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  adaptationBusy !==
                                  null
                                }
                                onClick={() => {
                                  setAdaptationConfirmTarget(
                                    null,
                                  );

                                  setAdaptationError(
                                    null,
                                  );
                                }}
                                className="rounded-full border border-sky-300/16 bg-slate-950/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-200/72 transition hover:border-sky-300/30"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </LuminaFlagshipCard>
                  );
                },
              )}
            </div>
          ) : null}

          <div
            className={
              projection.adaptationCandidates.length > 0
                ? "mt-5 grid gap-4"
                : "mt-5 grid gap-4"
            }
          >
            {projection.projections.map((memoryProjection) => {
              const selected =
                selectedProjectionId ===
                memoryProjection.id;

              return (
                <button
                  type="button"
                  key={memoryProjection.id}
                  aria-pressed={selected}
                  onClick={() =>
                    onProjectionSelect(
                      memoryProjection.capsuleId,
                      memoryProjection.id,
                    )
                  }
                  className="block w-full text-left"
                >
                  <LuminaFlagshipCard
                    as="article"
                    className={[
                      "rounded-[22px] p-4",
                      "transition-[border-color,box-shadow,transform] duration-200",
                      selected
                        ? "ring-1 ring-inset ring-cyan-200/80 shadow-[0_0_28px_rgba(37,99,235,0.24)]"
                        : "hover:ring-1 hover:ring-inset hover:ring-cyan-300/45",
                    ].join(" ")}
                  >
                <div className="relative z-10">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <LuminaStatusBadge variant="healthy">
                        {memoryProjection.status}
                      </LuminaStatusBadge>

                      <span className="rounded-full border border-violet-300/20 bg-violet-300/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-violet-100">
                        {memoryProjection.privacy}
                      </span>
                    </div>

                    <h4 className="mt-3 text-base font-semibold text-white">
                      {memoryProjection.title}
                    </h4>

                    <div className="mt-2 text-xs text-cyan-300/64">
                      Consumer: {memoryProjection.audience}
                    </div>
                  </div>

                  <LuminaFlagshipCard
                    as="article"
                    className="rounded-[18px] p-4"
                  >
                    <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                        Adaptation purpose
                      </div>
                      <div className="mt-2 text-xs leading-5 text-cyan-100/72">
                        {memoryProjection.detail}
                      </div>
                    </div>
                  </LuminaFlagshipCard>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <LuminaFlagshipCard
                    as="article"
                    className="rounded-[16px] p-3"
                  >
                    <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.13em] text-emerald-300/52">
                        Canonical source
                      </div>
                      <div className="mt-1 text-xs font-semibold text-emerald-100">
                        {memoryProjection.canonicalSource}
                      </div>
                    </div>
                  </LuminaFlagshipCard>

                  <LuminaFlagshipCard
                    as="article"
                    className="rounded-[16px] p-3"
                  >
                    <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.13em] text-violet-300/52">
                        Adaptation lineage
                      </div>
                      <div className="mt-1 text-xs font-semibold text-violet-100">
                        {memoryProjection.adaptationLineage}
                      </div>
                    </div>
                  </LuminaFlagshipCard>

                  <LuminaFlagshipCard
                    as="article"
                    className="rounded-[16px] p-3"
                  >
                    <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.13em] text-amber-300/52">
                        Authority posture
                      </div>
                      <div className="mt-1 text-xs font-semibold text-amber-100">
                        {memoryProjection.authorityPosture}
                      </div>
                    </div>
                  </LuminaFlagshipCard>
                </div>
                </div>
                  </LuminaFlagshipCard>
                </button>
              );
            })}
          </div>
          </div>
        </LuminaFlagshipPanel>

        <div className="grid items-stretch gap-5 xl:grid-cols-2">
          <LuminaFlagshipPanel
            title={null}
            className="h-full [&>div:nth-of-type(3)]:hidden"
          >
            <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon
                icon={ShieldCheck}
                state="warning"
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/58">
                  Privacy filtering
                </div>
                <h3 className="mt-1 text-base font-semibold text-violet-100">
                  Projection safety boundaries
                </h3>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {projection.privacy.map(({ label, title, detail }) => (
                <LuminaFlagshipCard
                  key={label}
                  as="article"
                  className="rounded-[18px] p-4"
                >
                  <div className="relative z-10">
                    <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                      {label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {title}
                    </div>
                    <div className="mt-2 text-[11px] leading-5 text-sky-300/56">
                      {detail}
                    </div>
                  </div>
                </LuminaFlagshipCard>
              ))}
            </div>
            </div>
          </LuminaFlagshipPanel>

          <LuminaFlagshipPanel
            title={null}
            className="h-full [&>div:nth-of-type(3)]:hidden"
          >
            <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon
                icon={Network}
                state="active"
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/58">
                  Adaptation lineage
                </div>
                <h3 className="mt-1 text-base font-semibold text-cyan-100">
                  Canonical source preserved
                </h3>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {projection.lineage.map(({ label, value }, index) => (
                <div key={label}>
                  <LuminaFlagshipCard
                    as="article"
                    className="rounded-[18px] p-4"
                  >
                    <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                        {label}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {value}
                      </div>
                    </div>
                  </LuminaFlagshipCard>

                  {index < 2 ? (
                    <div className="mx-auto h-4 w-px bg-cyan-300/28" />
                  ) : null}
                </div>
              ))}
            </div>
            </div>
          </LuminaFlagshipPanel>
        </div>
      </div>

      <LuminaBalancedSplitPanelComposition
        primaryRegion={
          <LuminaFlagshipPanel
            title={null}
            className="h-full [&>div:nth-of-type(3)]:hidden"
          >
          <div className="p-5 sm:p-6">
          <LuminaPanelHeaderComposition
            iconRegion={
              <ExecutivePremiumIcon
                icon={Sparkles}
                state="healthy"
              />
            }
            copyRegion={
              <>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/58">
                  Institutional learning
                </div>
                <h3 className="mt-1 text-base font-semibold text-emerald-100">
                  Organizational summaries
                </h3>
              </>
            }
          />

          <div className="mt-5 grid gap-3">
            {projection.summaries.map((summary) => (
              <LuminaFlagshipCard
                as="article"
                key={summary.title}
                className="rounded-[18px] p-4"
              >
                <div className="relative z-10">
                  <div className="text-sm font-semibold text-white">
                    {summary.title}
                  </div>
                  <div className="mt-2 text-[11px] leading-5 text-emerald-100/62">
                    {summary.detail}
                  </div>
                  <div className="mt-4 text-[9px] font-semibold uppercase tracking-[0.13em] text-cyan-300/52">
                    {summary.lineage}
                  </div>
                </div>
              </LuminaFlagshipCard>
            ))}
          </div>
          </div>
          </LuminaFlagshipPanel>
        }
        secondaryRegion={
          <LuminaFlagshipPanel
            title={null}
            className="h-full [&>div:nth-of-type(3)]:hidden"
          >
          <div
            className="
              max-h-[560px]
              overflow-y-auto overflow-x-hidden
              overscroll-contain
              p-5 pr-3 sm:p-6 sm:pr-4
              [scrollbar-gutter:stable]
            "
          >
          <div className="flex items-center gap-3">
            <ExecutivePremiumIcon
              icon={History}
              state="active"
            />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/58">
                Memory evolution
              </div>
              <h3 className="mt-1 text-base font-semibold text-cyan-100">
                Stewardship history
              </h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {projection.evolution.map((entry, index) => (
              <div
                key={entry.version}
                className="relative"
              >
                <LuminaFlagshipCard
                  as="article"
                  className="rounded-[18px] p-4"
                >
                  <div className="relative z-10">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/54">
                      {entry.version}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {entry.event}
                    </div>
                    <div className="mt-2 text-[11px] leading-5 text-sky-400/58">
                      {entry.detail}
                    </div>
                  </div>
                </LuminaFlagshipCard>

                {index < projection.evolution.length - 1 ? (
                  <div className="mx-auto h-3 w-px bg-cyan-300/24" />
                ) : null}
              </div>
            ))}
          </div>
          </div>
          </LuminaFlagshipPanel>
        }
      />
    </section>
  );
}
