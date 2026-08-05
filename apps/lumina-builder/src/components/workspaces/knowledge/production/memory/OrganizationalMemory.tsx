import {
  BrainCircuit,
  History,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

const projections = [
  {
    title: "Executive summary projection",
    audience: "Executive Office",
    privacy: "Strategic",
    status: "Active",
    detail:
      "Condenses canonical runtime recovery guidance into decision-ready organizational context.",
  },
  {
    title: "Mission operating projection",
    audience: "Mission System",
    privacy: "Operational",
    status: "Active",
    detail:
      "Adapts canonical evidence into mission planning constraints and recovery expectations.",
  },
  {
    title: "Chief Agent competency projection",
    audience: "Chief Agent",
    privacy: "Restricted",
    status: "Governed",
    detail:
      "Transforms canonical guidance into competency signals without transferring authority.",
  },
];

const evolution = [
  {
    version: "Memory v1.0",
    event: "Canonical capsule received",
    detail:
      "Runtime Isolation Recovery Standard entered organizational stewardship.",
  },
  {
    version: "Memory v1.1",
    event: "Privacy-filtered projection created",
    detail:
      "Sensitive incident detail removed from executive and mission summaries.",
  },
  {
    version: "Memory v1.2",
    event: "Institutional learning incorporated",
    detail:
      "Repeated mission usage strengthened recovery pattern recognition.",
  },
  {
    version: "Memory v1.3",
    event: "Adaptation lineage certified",
    detail:
      "All projections remain traceable to the canonical source capsule.",
  },
];

const summaries = [
  {
    title: "Runtime resilience posture",
    detail:
      "Environment isolation, dependency recovery, and process ownership now operate as one governed standard.",
    lineage: "Derived from KCAP-2026-042",
  },
  {
    title: "Mission recovery learning",
    detail:
      "Recovery planning increasingly favors observable runtime state and explicit ownership.",
    lineage: "Derived from 8 governed mission uses",
  },
  {
    title: "Institutional adaptation",
    detail:
      "Cross-workspace recovery language is converging without transferring canonical authority.",
    lineage: "Derived from 3 active projections",
  },
];

const cardClass = [
  "rounded-[18px] p-4",
  premiumSurfaces.base.card,
  electricContour.strength.standard,
].join(" ");

const compactCardClass = [
  "rounded-[16px] p-3",
  premiumSurfaces.base.card,
  electricContour.strength.standard,
].join(" ");

export function OrganizationalMemory() {
  return (
    <section
      aria-labelledby="organizational-memory-title"
      className="grid gap-5"
    >
      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <LuminaProminentPremiumPanel>
          <div className="flex h-full flex-col gap-5 xl:justify-between">
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

          <div className={cardClass}>
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
          </div>
        </LuminaProminentPremiumPanel>

        <LuminaExecutiveMetricGrid columns={2}>
        <LuminaExecutiveCard
          title="Active projections"
          value="18"
          description="Governed adaptations serving organizational consumers."
          accentKey="cyan"
          icon={<Layers3 className="h-4 w-4 text-cyan-300" />}
        />

        <LuminaExecutiveCard
          title="Privacy filters"
          value="7"
          description="Projection boundaries protecting sensitive knowledge."
          accentKey="violet"
          icon={<ShieldCheck className="h-4 w-4 text-violet-300" />}
        />

        <LuminaExecutiveCard
          title="Institutional summaries"
          value="11"
          description="Cross-organizational learning distilled from use."
          accentKey="emerald"
          icon={<Sparkles className="h-4 w-4 text-emerald-300" />}
        />

        <LuminaExecutiveCard
          title="Adaptation generations"
          value="4"
          description="Traceable memory evolution from canonical sources."
          accentKey="amber"
          icon={<History className="h-4 w-4 text-amber-300" />}
        />
        </LuminaExecutiveMetricGrid>
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.38fr)_minmax(340px,.62fr)]">
        <LuminaStandardPremiumPanel>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/62">
              Memory adaptation
            </div>
            <h3 className="mt-1 text-lg font-semibold text-sky-100">
              Canonical knowledge projected for organizational use
            </h3>
          </div>

          <div className="mt-5 grid gap-4">
            {projections.map((projection) => (
              <article
                key={projection.title}
                className={[
                  "rounded-[22px] p-4",
                  premiumSurfaces.base.card,
                  electricContour.strength.standard,
                ].join(" ")}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-300/24 bg-emerald-300/[0.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-100">
                        {projection.status}
                      </span>

                      <span className="rounded-full border border-violet-300/20 bg-violet-300/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-violet-100">
                        {projection.privacy}
                      </span>
                    </div>

                    <h4 className="mt-3 text-base font-semibold text-white">
                      {projection.title}
                    </h4>

                    <div className="mt-2 text-xs text-cyan-300/64">
                      Consumer: {projection.audience}
                    </div>
                  </div>

                  <div className={cardClass}>
                    <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                      Adaptation purpose
                    </div>
                    <div className="mt-2 text-xs leading-5 text-cyan-100/72">
                      {projection.detail}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className={compactCardClass}>
                    <div className="text-[9px] uppercase tracking-[0.13em] text-emerald-300/52">
                      Canonical source
                    </div>
                    <div className="mt-1 text-xs font-semibold text-emerald-100">
                      KCAP-2026-042
                    </div>
                  </div>

                  <div className={compactCardClass}>
                    <div className="text-[9px] uppercase tracking-[0.13em] text-violet-300/52">
                      Adaptation lineage
                    </div>
                    <div className="mt-1 text-xs font-semibold text-violet-100">
                      Memory v1.3
                    </div>
                  </div>

                  <div className={compactCardClass}>
                    <div className="text-[9px] uppercase tracking-[0.13em] text-amber-300/52">
                      Authority posture
                    </div>
                    <div className="mt-1 text-xs font-semibold text-amber-100">
                      Stewarded, not canonical
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </LuminaStandardPremiumPanel>

        <div className="grid items-stretch gap-5 xl:grid-cols-2">
          <LuminaStandardPremiumPanel className="h-full">
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
              {[
                [
                  "Executive projection",
                  "Incident identities removed",
                  "Preserves organizational learning without exposing sensitive operational details.",
                ],
                [
                  "Mission projection",
                  "Scope-limited operational detail",
                  "Only mission-relevant recovery guidance is projected.",
                ],
                [
                  "Chief Agent projection",
                  "Competency signals only",
                  "Canonical authority remains external to adapted memory.",
                ],
              ].map(([label, title, detail]) => (
                <div
                  key={label}
                  className={cardClass}
                >
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
              ))}
            </div>
          </LuminaStandardPremiumPanel>

          <LuminaStandardPremiumPanel className="h-full">
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
              {[
                ["Origin", "KCAP-2026-042 · v3.0"],
                ["Stewarded memory", "Memory v1.3"],
                ["Active projections", "3 governed adaptations"],
              ].map(([label, value], index) => (
                <div key={label}>
                  <div className={cardClass}>
                    <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/52">
                      {label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {value}
                    </div>
                  </div>

                  {index < 2 ? (
                    <div className="mx-auto h-4 w-px bg-cyan-300/28" />
                  ) : null}
                </div>
              ))}
            </div>
          </LuminaStandardPremiumPanel>
        </div>
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-2">
        <LuminaStandardPremiumPanel className="h-full">
          <div className="flex items-center gap-3">
            <ExecutivePremiumIcon
              icon={Sparkles}
              state="healthy"
            />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/58">
                Institutional learning
              </div>
              <h3 className="mt-1 text-base font-semibold text-emerald-100">
                Organizational summaries
              </h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {summaries.map((summary) => (
              <article
                key={summary.title}
                className={cardClass}
              >
                <div className="text-sm font-semibold text-white">
                  {summary.title}
                </div>
                <div className="mt-2 text-[11px] leading-5 text-emerald-100/62">
                  {summary.detail}
                </div>
                <div className="mt-4 text-[9px] font-semibold uppercase tracking-[0.13em] text-cyan-300/52">
                  {summary.lineage}
                </div>
              </article>
            ))}
          </div>
        </LuminaStandardPremiumPanel>

        <LuminaStandardPremiumPanel className="h-full">
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
            {evolution.map((entry, index) => (
              <div
                key={entry.version}
                className="relative"
              >
                <div className={cardClass}>
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

                {index < evolution.length - 1 ? (
                  <div className="mx-auto h-3 w-px bg-cyan-300/24" />
                ) : null}
              </div>
            ))}
          </div>
        </LuminaStandardPremiumPanel>
      </div>
    </section>
  );
}
