import {
  useState,
} from "react";

import {
  Archive,
  BadgeCheck,
  BookMarked,
  GitCompareArrows,
  LibraryBig,
  Scale,
  ShieldCheck,
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
  CanonicalKnowledgeProjection,
} from "../data/canonicalKnowledgeProjection";

import type {
  CanonicalReviewQueueSlot,
} from "../data/canonicalReviewProjection";

type CanonicalKnowledgeProps = {
  projection: CanonicalKnowledgeProjection;

  promotionCandidates:
    readonly CanonicalReviewQueueSlot[];

  onPromoteCanonical: (
    packageId: string,
  ) => Promise<void>;

  selectedCanonicalId?: string;

  onCanonicalSelect: (
    capsuleId: string,
    canonicalId: string,
  ) => void;
};

export function CanonicalKnowledge({
  projection,
  promotionCandidates,
  onPromoteCanonical,
  selectedCanonicalId,
  onCanonicalSelect,
}: CanonicalKnowledgeProps) {
  const [
    promotionConfirmTarget,
    setPromotionConfirmTarget,
  ] = useState<string | null>(
    null,
  );

  const [
    promotionBusy,
    setPromotionBusy,
  ] = useState<string | null>(
    null,
  );

  const [
    promotionError,
    setPromotionError,
  ] = useState<string | null>(
    null,
  );

  async function promote(
    packageId: string,
  ) {
    if (promotionBusy) {
      return;
    }

    try {
      setPromotionBusy(
        packageId,
      );

      setPromotionError(
        null,
      );

      await onPromoteCanonical(
        packageId,
      );

      setPromotionConfirmTarget(
        null,
      );
    } catch (error) {
      setPromotionError(
        error instanceof Error
          ? error.message
          : String(error),
      );
    } finally {
      setPromotionBusy(
        null,
      );
    }
  }

  return (
    <section
      aria-labelledby="canonical-knowledge-title"
      className="grid gap-5"
    >
      <LuminaExecutiveTitleMetricsComposition
        variant="content-led"
        titleRegion={
          <LuminaFlagshipPanel
            className="flex h-full flex-col"
            title={null}
          >
            <div className="relative z-10 flex h-full flex-col px-6 pb-7 pt-2">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={BookMarked}
                  state="healthy"
                />

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/68">
                    Published organizational authority
                  </div>

                  <h2
                    id="canonical-knowledge-title"
                    className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-amber-400"
                  >
                    Canonical Knowledge
                  </h2>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-sky-300/68">
                Published Knowledge Capsules become stable organizational
                authority only after evidence, governance, scope, trust,
                supersession, and publication lineage are made explicit.
              </p>
            </div>

            <div className="mb-auto mt-7 grid grid-cols-2 gap-3.5 sm:grid-cols-4 xl:mt-8 xl:grid-cols-2">
              <LuminaFlagshipCard as="article" className="rounded-[18px] px-3.5 py-3">
                <div className="text-[9px] uppercase tracking-[0.16em] text-emerald-200/58">
                  Published
                </div>
                <div className="mt-1 text-xl font-semibold text-emerald-100">
                  {projection.metrics.published}
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard as="article" className="rounded-[18px] px-3.5 py-3">
                <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-200/58">
                  Collections
                </div>
                <div className="mt-1 text-xl font-semibold text-cyan-100">
                  {projection.metrics.collections}
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard as="article" className="rounded-[18px] px-3.5 py-3">
                <div className="text-[9px] uppercase tracking-[0.16em] text-violet-200/58">
                  Constitutional
                </div>
                <div className="mt-1 text-xl font-semibold text-violet-100">
                  {projection.metrics.constitutional}
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard as="article" className="rounded-[18px] px-3.5 py-3">
                <div className="text-[9px] uppercase tracking-[0.16em] text-slate-300/54">
                  Retiring
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-100">
                  {projection.metrics.retiring}
                </div>
              </LuminaFlagshipCard>
            </div>
            </div>
          </LuminaFlagshipPanel>
        }
        metricsRegion={
          <LuminaExecutiveMetricGrid columns={2}>
        <LuminaExecutiveCard
          title="Published capsules"
          value={projection.metrics.published}
          description="Active canonical authority across KoreLumina."
          accentKey="emerald"
          icon={<BadgeCheck className="h-4 w-4 text-emerald-300" />}
        />

        <LuminaExecutiveCard
          title="Canonical collections"
          value={projection.metrics.collections}
          description="Governed bodies of organizational knowledge."
          accentKey="cyan"
          icon={<LibraryBig className="h-4 w-4 text-cyan-300" />}
        />

        <LuminaExecutiveCard
          title="Constitutional authority"
          value={projection.metrics.constitutional}
          description="Capsules with platform-level governing force."
          accentKey="violet"
          icon={<Scale className="h-4 w-4 text-violet-300" />}
        />

        <LuminaExecutiveCard
          title="Supersession activity"
          value={projection.metrics.supersessionActivity}
          description="Canonical replacements under active transition."
          accentKey="amber"
          icon={<GitCompareArrows className="h-4 w-4 text-amber-300" />}
        />
          </LuminaExecutiveMetricGrid>
        }
      />

      <LuminaFlagshipPanel
        title={null}
        className="[&>div:nth-of-type(3)]:hidden"
      >
        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/62">
                Canonical promotion queue
              </div>

              <h3 className="mt-1 text-lg font-semibold text-sky-100">
                Approved authority awaiting publication
              </h3>

              <p className="mt-2 max-w-3xl text-xs leading-5 text-sky-300/62">
                Only packages carrying explicit governed approval appear here.
                Canonical promotion is a separate publication action and never
                occurs as a side effect of review.
              </p>
            </div>

            <LuminaStatusBadge
              variant={
                promotionCandidates.length > 0
                  ? "healthy"
                  : "neutral"
              }
            >
              {promotionCandidates.length} awaiting promotion
            </LuminaStatusBadge>
          </div>

          {promotionError ? (
            <div className="mt-4 rounded-[14px] border border-rose-300/18 bg-rose-300/[0.05] px-4 py-3 text-xs text-rose-100">
              {promotionError}
            </div>
          ) : null}

          {promotionCandidates.length === 0 ? (
            <LuminaFlagshipCard
              as="article"
              className="mt-5 rounded-[18px] p-4"
            >
              <div className="relative z-10">
                <div className="text-sm font-semibold text-sky-100">
                  No approved packages awaiting canonical promotion
                </div>

                <div className="mt-2 text-xs leading-5 text-sky-300/58">
                  Packages appear here only after Canonical Review records
                  persisted approval evidence.
                </div>
              </div>
            </LuminaFlagshipCard>
          ) : (
            <div
              className="relative z-20 mt-5 max-h-[520px] min-h-0 overflow-y-auto overscroll-contain pr-2 pointer-events-auto [scrollbar-gutter:stable] [touch-action:pan-y]"
              aria-label="Capsules awaiting canonical decision"
              tabIndex={0}
              onWheel={(event) => {
                event.stopPropagation();
              }}
            >
              <div className="grid gap-3">
              {promotionCandidates.map(
                (candidate) => {
                  const confirming =
                    promotionConfirmTarget ===
                    candidate.id;

                  const busy =
                    promotionBusy ===
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
                                Approved
                              </LuminaStatusBadge>
                            </div>

                            <h4 className="mt-2 break-words text-base font-semibold text-white [overflow-wrap:anywhere]">
                              {candidate.title}
                            </h4>

                            <div className="mt-2 text-xs text-sky-300/60">
                              {candidate.domain}
                              {" · "}
                              {candidate.authority}
                            </div>

                            <div className="mt-2 text-[11px] text-emerald-200/64">
                              {candidate.reviewers}
                            </div>
                          </div>

                          {!confirming ? (
                            <button
                              type="button"
                              disabled={
                                promotionBusy !==
                                null
                              }
                              onClick={() => {
                                setPromotionError(
                                  null,
                                );

                                setPromotionConfirmTarget(
                                  candidate.id,
                                );
                              }}
                              className="shrink-0 rounded-full border border-emerald-300/28 bg-emerald-300/[0.08] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 transition hover:border-emerald-300/44 hover:bg-emerald-300/[0.13] disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              Promote to Canonical Knowledge
                            </button>
                          ) : null}
                        </div>

                        {confirming ? (
                          <div className="mt-4 rounded-[16px] border border-amber-300/18 bg-amber-300/[0.045] p-4">
                            <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-amber-200/72">
                              Confirm canonical publication
                            </div>

                            <p className="mt-2 max-w-3xl text-xs leading-5 text-amber-100/68">
                              This action publishes the approved package as
                              Canonical Knowledge and preserves its review,
                              provenance, lifecycle, authority, and
                              supersession evidence.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={
                                  promotionBusy !==
                                  null
                                }
                                onClick={() =>
                                  void promote(
                                    candidate.id,
                                  )
                                }
                                className="rounded-full border border-emerald-300/30 bg-emerald-300/[0.09] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100 transition hover:bg-emerald-300/[0.15] disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                {busy
                                  ? "Publishing…"
                                  : "Confirm publication"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  promotionBusy !==
                                  null
                                }
                                onClick={() => {
                                  setPromotionConfirmTarget(
                                    null,
                                  );

                                  setPromotionError(
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
            </div>
          )}
        </div>
      </LuminaFlagshipPanel>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,.55fr)]">
        <LuminaFlagshipPanel
          title={null}
          className="[&>div:nth-of-type(3)]:hidden"
        >
          <div className="p-5 sm:p-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/62">
              Published capsules
            </div>
            <h3 className="mt-1 text-lg font-semibold text-sky-100">
              Why each capsule became canonical
            </h3>
          </div>

          <div className="mt-5 grid gap-4">
            {projection.capsules.slice(0, 3).map((capsule) => {
              const selected =
                selectedCanonicalId ===
                capsule.id;

              return (
                <button
                  type="button"
                  key={capsule.id}
                  aria-pressed={selected}
                  onClick={() =>
                    onCanonicalSelect(
                      capsule.capsuleId,
                      capsule.id,
                    )
                  }
                  className="block w-full text-left"
                >
                  <LuminaFlagshipCard
                    as="article"
                    className={[
                      "rounded-[18px] p-4 transition-[border-color,box-shadow,transform] duration-200",
                      selected
                        ? "ring-1 ring-inset ring-cyan-200/80 shadow-[0_0_28px_rgba(37,99,235,0.24)]"
                        : "hover:ring-1 hover:ring-inset hover:ring-cyan-300/45",
                    ].join(" ")}
                  >
                    <div className="relative z-10">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/68">
                        {capsule.displayId}
                      </span>
                      <LuminaStatusBadge variant="healthy">{capsule.status}</LuminaStatusBadge>
                    </div>

                    <h4 className="mt-2 text-base font-semibold text-white">
                      {capsule.title}
                    </h4>

                    <div className="mt-2 text-xs text-sky-400/68">
                      {capsule.collection} · {capsule.version}
                    </div>
                  </div>

                  <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:w-[420px]">
                    <LuminaFlagshipCard
                      as="article"
                      className="rounded-[16px] p-3"
                    >
                      <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-violet-300/52">
                        Trust level
                      </div>
                      <div className="mt-1 text-xs font-semibold text-violet-100">
                        {capsule.trust}
                      </div>
                      </div>
                    </LuminaFlagshipCard>

                    <LuminaFlagshipCard
                      as="article"
                      className="rounded-[16px] p-3"
                    >
                      <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                        Scope
                      </div>
                      <div className="mt-1 text-xs font-semibold text-cyan-100">
                        {capsule.scope}
                      </div>
                      </div>
                    </LuminaFlagshipCard>

                    <LuminaFlagshipCard
                      as="article"
                      className="rounded-[16px] p-3"
                    >
                      <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-amber-300/52">
                        Constitutional authority
                      </div>
                      <div className="mt-1 text-xs font-semibold text-amber-100">
                        {capsule.authority}
                      </div>
                      </div>
                    </LuminaFlagshipCard>

                    <LuminaFlagshipCard
                      as="article"
                      className="rounded-[16px] p-3"
                    >
                      <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300/52">
                        Retirement posture
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-100">
                        {capsule.retirement}
                      </div>
                      </div>
                    </LuminaFlagshipCard>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.42fr)]">
                  <LuminaFlagshipCard
                    as="article"
                    className="rounded-[16px] p-3"
                  >
                    <div className="relative z-10">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-300/58">
                      Canonical rationale
                    </div>

                    <div className="mt-3 grid gap-2">
                      {capsule.rationale.map((reason) => (
                        <div
                          key={reason}
                          className="flex items-start gap-2 text-[11px] leading-5 text-emerald-100/72"
                        >
                          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                    </div>
                  </LuminaFlagshipCard>

                  <div className="grid gap-3">
                    <LuminaFlagshipCard
                      as="article"
                      className="rounded-[16px] p-3"
                    >
                      <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                        Supersession
                      </div>
                      <div className="mt-2 text-xs font-semibold leading-5 text-cyan-100">
                        {capsule.supersession}
                      </div>
                      </div>
                    </LuminaFlagshipCard>

                    <LuminaFlagshipCard
                      as="article"
                      className="rounded-[16px] p-3"
                    >
                      <div className="relative z-10">
                      <div className="text-[9px] uppercase tracking-[0.14em] text-violet-300/52">
                        Version
                      </div>
                      <div className="mt-2 text-xs font-semibold text-violet-100">
                        {capsule.version}
                      </div>
                      </div>
                    </LuminaFlagshipCard>
                  </div>
                </div>
                    </div>
                  </LuminaFlagshipCard>
                </button>
              );
            })}
          </div>
          </div>
        </LuminaFlagshipPanel>

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
                  icon={LibraryBig}
                  state="active"
                />
              }
              copyRegion={
                <>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/58">
                    Canonical collections
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-cyan-100">
                    Governed bodies of knowledge
                  </h3>
                </>
              }
            />

            <div className="mt-5 grid gap-3">
              {projection.collections.map((collection) => (
                <LuminaFlagshipCard
                  key={collection.title}
                  as="article"
                  className="rounded-[16px] p-3"
                >
                  <div className="relative z-10">
                    <div className="text-sm font-semibold text-white">
                      {collection.title}
                    </div>
                    <div className="mt-2 text-[11px] leading-5 text-cyan-200/58">
                      {collection.count} · {collection.scope}
                    </div>
                    <div className="mt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-300/58">
                      {collection.authority}
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
              <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon
                icon={Archive}
                state="active"
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300/58">
                  Lifecycle governance
                </div>
                <h3 className="mt-1 text-base font-semibold text-slate-100">
                  Supersession and retirement
                </h3>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <LuminaFlagshipCard
                as="article"
                className="rounded-[16px] p-3"
              >
                <div className="relative z-10">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-amber-300/52">
                    Superseded
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-100">
                    {projection.metrics.superseded}
                  </div>
                  <div className="mt-2 text-[11px] leading-5 text-amber-200/56">
                    Preserved for lineage, audit, and historical interpretation.
                  </div>
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard
                as="article"
                className="rounded-[16px] p-3"
              >
                <div className="relative z-10">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300/52">
                    Retirement scheduled
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-100">
                    {projection.metrics.retirementScheduled}
                  </div>
                  <div className="mt-2 text-[11px] leading-5 text-slate-300/56">
                    Authority remains valid until the scheduled retirement date.
                  </div>
                </div>
              </LuminaFlagshipCard>
            </div>
              </div>
            </LuminaFlagshipPanel>
          }
        />
      </div>
    </section>
  );
}
