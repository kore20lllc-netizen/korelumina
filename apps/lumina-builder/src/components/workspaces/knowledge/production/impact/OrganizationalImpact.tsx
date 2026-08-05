import {
  Activity,
  BadgeCheck,
  Building2,
  CircleGauge,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

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
  LuminaStandardPremiumPanel,
} from "@/components/design-system/surfaces/LuminaStandardPremiumPanel";

import type {
  KnowledgeCapsuleModel,
  KnowledgeDistributionRecord,
} from "../capsules";

type OrganizationalImpactProps = {
  capsules: KnowledgeCapsuleModel[];
  records: KnowledgeDistributionRecord[];
};

const cardClass = [
  "rounded-[18px] p-4",
  premiumSurfaces.base.card,
  electricContour.strength.standard,
].join(" ");

const impactOutcomes = [
  {
    title: "Runtime recovery effectiveness",
    capsule: "KCAP-2026-042",
    mission: "Runtime Operations",
    outcome: "Recovery time reduced by 31%",
    confidence: "High confidence",
    detail:
      "Governed recovery standards now guide isolation, ownership, and restart decisions across active runtime incidents.",
  },
  {
    title: "Mission planning consistency",
    capsule: "KCAP-2026-031",
    mission: "Mission System",
    outcome: "Decision variance reduced by 24%",
    confidence: "Validated",
    detail:
      "Canonical planning guidance is reducing inconsistent mission framing and repeated corrective review.",
  },
  {
    title: "Knowledge preservation quality",
    capsule: "KCAP-2026-018",
    mission: "Chief Agent Program",
    outcome: "Lineage coverage increased to 92%",
    confidence: "High confidence",
    detail:
      "Compiler, governance, education, and consumer lineage are now preserved as one inspectable knowledge chain.",
  },
];

const leverageSignals = [
  {
    title: "Operational leverage",
    value: "8.4×",
    detail:
      "Estimated reuse value across runtime, mission, and engineering consumers.",
  },
  {
    title: "Decision acceleration",
    value: "29%",
    detail:
      "Average improvement in time-to-governed-decision for covered workflows.",
  },
  {
    title: "Risk reduction",
    value: "18%",
    detail:
      "Measured decline in repeated governance and recovery failure patterns.",
  },
];

const reviewSignals = [
  {
    title: "Impact evidence incomplete",
    detail:
      "Three capsules have strong adoption but insufficient outcome attribution.",
    tone: "amber",
  },
  {
    title: "Low-consumption authority",
    detail:
      "Two canonical capsules remain valid but have limited downstream reuse.",
    tone: "violet",
  },
  {
    title: "Retirement review candidate",
    detail:
      "One superseded capsule no longer contributes measurable organizational value.",
    tone: "rose",
  },
];

export function OrganizationalImpact({
  capsules,
  records,
}: OrganizationalImpactProps) {
  const canonicalCapsules = capsules.filter(
    (capsule) =>
      capsule.state === "published" ||
      capsule.stage === "Canonical Knowledge",
  );

  const activeConsumers = records.reduce(
    (total, record) =>
      total +
      record.consumers.filter(
        (consumer) =>
          consumer.status === "connected" ||
          consumer.status === "consuming",
      ).length,
    0,
  );

  const governedEvents = records.reduce(
    (total, record) =>
      total + record.history.length,
    0,
  );

  return (
    <section
      aria-labelledby="organizational-impact-title"
      className="grid gap-5"
    >
      <div className="grid items-stretch gap-5 xl:grid-cols-2">
        <LuminaProminentPremiumPanel>
          <div className="flex h-full flex-col justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={Target}
                  state="healthy"
                />

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/68">
                    Governed value realization
                  </div>

                  <h2
                    id="organizational-impact-title"
                    className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-amber-400"
                  >
                    Organizational Impact
                  </h2>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-sky-300/68">
                Organizational Impact connects governed knowledge to measurable
                mission outcomes, operational improvement, risk reduction,
                decision quality, and institutional leverage without breaking
                traceability to the originating canonical capsule.
              </p>
            </div>

            <div className={cardClass}>
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-200/58">
                Measurement boundary
              </div>

              <div className="mt-2 text-sm font-semibold text-violet-100">
                Impact informs governance. It does not rewrite authority.
              </div>

              <div className="mt-2 text-[11px] leading-5 text-violet-200/56">
                Outcome evidence may trigger reinforcement, adaptation,
                reassessment, or retirement while preserving canonical lineage.
              </div>
            </div>
          </div>
        </LuminaProminentPremiumPanel>

        <LuminaExecutiveMetricGrid columns={2}>
          <LuminaExecutiveCard
            title="Canonical assets measured"
            value={String(canonicalCapsules.length)}
            description="Published capsules included in impact evaluation."
            accentKey="cyan"
            icon={<BadgeCheck className="h-4 w-4 text-cyan-300" />}
          />

          <LuminaExecutiveCard
            title="Active consumers"
            value={String(activeConsumers)}
            description="Connected systems contributing usage evidence."
            accentKey="emerald"
            icon={<Users className="h-4 w-4 text-emerald-300" />}
          />

          <LuminaExecutiveCard
            title="Governed evidence events"
            value={String(governedEvents)}
            description="Traceable events supporting impact assessment."
            accentKey="violet"
            icon={<Activity className="h-4 w-4 text-violet-300" />}
          />

          <LuminaExecutiveCard
            title="Verified outcome rate"
            value="78%"
            description="Measured outcomes with sufficient lineage evidence."
            accentKey="amber"
            icon={<CircleGauge className="h-4 w-4 text-amber-300" />}
          />
        </LuminaExecutiveMetricGrid>
      </div>

      <LuminaStandardPremiumPanel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/62">
              Outcome attribution
            </div>

            <h3 className="mt-1 text-lg font-semibold text-sky-100">
              Missions improved by governed knowledge
            </h3>
          </div>

          <div className="rounded-full border border-emerald-300/24 bg-emerald-300/[0.06] px-3 py-1.5 text-[10px] font-semibold text-emerald-100">
            3 verified outcomes
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {impactOutcomes.map((impact) => (
            <article
              key={impact.capsule}
              className={cardClass}
            >
              <div className="flex items-start gap-3">
                <ExecutivePremiumIcon
                  icon={TrendingUp}
                  state="healthy"
                />

                <div className="min-w-0">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-cyan-300/54">
                    {impact.capsule} · {impact.mission}
                  </div>

                  <h4 className="mt-2 text-sm font-semibold text-white">
                    {impact.title}
                  </h4>
                </div>
              </div>

              <div className="mt-4 rounded-[16px] border border-emerald-300/20 bg-emerald-300/[0.05] p-3">
                <div className="text-[9px] uppercase tracking-[0.14em] text-emerald-300/56">
                  Measured outcome
                </div>

                <div className="mt-1 text-sm font-semibold text-emerald-100">
                  {impact.outcome}
                </div>
              </div>

              <div className="mt-3 text-[11px] leading-5 text-sky-300/60">
                {impact.detail}
              </div>

              <div className="mt-4 text-[9px] font-semibold uppercase tracking-[0.13em] text-violet-300/56">
                {impact.confidence}
              </div>
            </article>
          ))}
        </div>
      </LuminaStandardPremiumPanel>

      <div className="grid items-stretch gap-5 xl:grid-cols-2">
        <LuminaStandardPremiumPanel className="h-full">
          <div className="flex items-center gap-3">
            <ExecutivePremiumIcon
              icon={Sparkles}
              state="active"
            />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/58">
                Organizational leverage
              </div>

              <h3 className="mt-1 text-base font-semibold text-cyan-100">
                Value created through governed reuse
              </h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {leverageSignals.map((signal) => (
              <article
                key={signal.title}
                className={cardClass}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {signal.title}
                    </div>

                    <div className="mt-2 text-[11px] leading-5 text-sky-300/58">
                      {signal.detail}
                    </div>
                  </div>

                  <div className="text-xl font-semibold text-cyan-100">
                    {signal.value}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </LuminaStandardPremiumPanel>

        <LuminaStandardPremiumPanel className="h-full">
          <div className="flex items-center gap-3">
            <ExecutivePremiumIcon
              icon={ShieldCheck}
              state="warning"
            />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/58">
                Impact assurance
              </div>

              <h3 className="mt-1 text-base font-semibold text-violet-100">
                Weak, unproven, or review-required signals
              </h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {reviewSignals.map((signal) => (
              <article
                key={signal.title}
                className={cardClass}
              >
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                  <div>
                    <div className="text-sm font-semibold text-white">
                      {signal.title}
                    </div>

                    <div className="mt-2 text-[11px] leading-5 text-violet-200/58">
                      {signal.detail}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </LuminaStandardPremiumPanel>
      </div>

      <LuminaStandardPremiumPanel>
        <div className="flex items-center gap-3">
          <ExecutivePremiumIcon
            icon={GitBranch}
            state="healthy"
          />

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/58">
              Impact lineage
            </div>

            <h3 className="mt-1 text-base font-semibold text-emerald-100">
              Outcome evidence remains traceable to canonical authority
            </h3>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            "Canonical capsule",
            "Authorized consumer",
            "Governed evidence",
            "Measured outcome",
          ].map((step, index) => (
            <div
              key={step}
              className={cardClass}
            >
              <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/52">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="mt-2 text-sm font-semibold text-white">
                {step}
              </div>
            </div>
          ))}
        </div>
      </LuminaStandardPremiumPanel>
    </section>
  );
}
