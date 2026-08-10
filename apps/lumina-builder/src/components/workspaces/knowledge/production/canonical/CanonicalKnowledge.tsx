import {
  flagshipAppearance,
} from "../../learning/presentation/flagshipAppearance";

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
  electricContour,
  LuminaExecutiveCard,
  LuminaExecutiveMetricGrid,
  premiumSurfaces,
} from "@/components/design-system/lumina";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  LuminaStandardPremiumPanel,
} from "@/components/design-system/surfaces/LuminaStandardPremiumPanel";

import {
  LuminaStateSurface,
  LuminaStatusBadge,
} from "@/components/lumina/workspace";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

type CanonicalKnowledgeProps = {
  selectedCanonicalId?: string;
  onCanonicalSelect: (
    capsuleId: string,
    canonicalId: string,
  ) => void;
};

const CANONICAL_CAPSULES = [
  {
    id: "KCAP-2026-042",
    capsuleId: "capsule-144",
    title: "Runtime Isolation Recovery Standard",
    collection: "Runtime Architecture Canon",
    authority: "Architecture Council",
    trust: "Constitutional",
    scope: "Platform-wide",
    version: "v3.0",
    status: "Published",
    supersession: "Replaces KCAP-2025-118",
    retirement: "No retirement scheduled",
    rationale: [
      "Evidence certified across runtime recovery incidents.",
      "Supersession boundary approved by Architecture Council.",
      "Publication authority confirmed by Chief Systems Architect.",
    ],
  },
  {
    id: "KCAP-2026-031",
    capsuleId: "capsule-145",
    title: "Knowledge Package Integrity Protocol",
    collection: "Knowledge Constitution",
    authority: "Constitutional Review Board",
    trust: "Constitutional",
    scope: "Knowledge Operations",
    version: "v2.1",
    status: "Published",
    supersession: "Extends KCAP-2025-076",
    retirement: "Annual constitutional review",
    rationale: [
      "Integrity states aligned with sealed, peeling, remediation, and resealing.",
      "Governance interpretation conflict resolved.",
      "Canonical lineage preserved through publication.",
    ],
  },
  {
    id: "KCAP-2026-018",
    capsuleId: "capsule-146",
    title: "Mission Recovery Evidence Standard",
    collection: "Mission Operations Canon",
    authority: "Mission Governance",
    trust: "High",
    scope: "Mission system",
    version: "v1.6",
    status: "Published",
    supersession: "No predecessor",
    retirement: "Review after 12 months",
    rationale: [
      "Mission recovery evidence reached required confidence threshold.",
      "Operational applicability validated across multiple missions.",
      "No unresolved constitutional conflicts remained.",
    ],
  },
];

const COLLECTIONS = [
  {
    title: "Knowledge Constitution",
    count: "18 capsules",
    authority: "Constitutional Review Board",
    scope: "Platform governance",
  },
  {
    title: "Runtime Architecture Canon",
    count: "27 capsules",
    authority: "Architecture Council",
    scope: "Runtime and Builder",
  },
  {
    title: "Mission Operations Canon",
    count: "14 capsules",
    authority: "Mission Governance",
    scope: "Mission system",
  },
];

const compactCardClass = [
  "rounded-[16px] p-3",
  premiumSurfaces.base.card,
  electricContour.strength.standard,
].join(" ");

export function CanonicalKnowledge({
  selectedCanonicalId,
  onCanonicalSelect,
}: CanonicalKnowledgeProps) {
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
                  59
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard as="article" className="rounded-[18px] px-3.5 py-3">
                <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-200/58">
                  Collections
                </div>
                <div className="mt-1 text-xl font-semibold text-cyan-100">
                  9
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard as="article" className="rounded-[18px] px-3.5 py-3">
                <div className="text-[9px] uppercase tracking-[0.16em] text-violet-200/58">
                  Constitutional
                </div>
                <div className="mt-1 text-xl font-semibold text-violet-100">
                  23
                </div>
              </LuminaFlagshipCard>

              <LuminaFlagshipCard as="article" className="rounded-[18px] px-3.5 py-3">
                <div className="text-[9px] uppercase tracking-[0.16em] text-slate-300/54">
                  Retiring
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-100">
                  4
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
          value="59"
          description="Active canonical authority across KoreLumina."
          accentKey="emerald"
          icon={<BadgeCheck className="h-4 w-4 text-emerald-300" />}
        />

        <LuminaExecutiveCard
          title="Canonical collections"
          value="9"
          description="Governed bodies of organizational knowledge."
          accentKey="cyan"
          icon={<LibraryBig className="h-4 w-4 text-cyan-300" />}
        />

        <LuminaExecutiveCard
          title="Constitutional authority"
          value="23"
          description="Capsules with platform-level governing force."
          accentKey="violet"
          icon={<Scale className="h-4 w-4 text-violet-300" />}
        />

        <LuminaExecutiveCard
          title="Supersession activity"
          value="7"
          description="Canonical replacements under active transition."
          accentKey="amber"
          icon={<GitCompareArrows className="h-4 w-4 text-amber-300" />}
        />
          </LuminaExecutiveMetricGrid>
        }
      />

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
            {CANONICAL_CAPSULES.map((capsule) => {
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
                        {capsule.id}
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
            <LuminaStandardPremiumPanel className="h-full">
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
              {COLLECTIONS.map((collection) => (
                <div
                  key={collection.title}
                  className={[
                    flagshipAppearance.canonicalSurface,
                    flagshipAppearance.canonicalPanelSurface,
                  ].join(" ")}
                >
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
              ))}
            </div>
            </LuminaStandardPremiumPanel>
          }
          secondaryRegion={
            <LuminaStandardPremiumPanel className="h-full">
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
              <LuminaStateSurface tone="warning">
                <div className="text-[9px] uppercase tracking-[0.14em] text-amber-300/52">
                  Superseded
                </div>
                <div className="mt-1 text-sm font-semibold text-amber-100">
                  7 capsules
                </div>
                <div className="mt-2 text-[11px] leading-5 text-amber-200/56">
                  Preserved for lineage, audit, and historical interpretation.
                </div>
              </LuminaStateSurface>

              <div className={[
                flagshipAppearance.canonicalSurface,
                flagshipAppearance.canonicalPanelSurface,
              ].join(" ")}>
                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-300/52">
                  Retirement scheduled
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-100">
                  4 capsules
                </div>
                <div className="mt-2 text-[11px] leading-5 text-slate-300/56">
                  Authority remains valid until the scheduled retirement date.
                </div>
              </div>
            </div>
            </LuminaStandardPremiumPanel>
          }
        />
      </div>
    </section>
  );
}
