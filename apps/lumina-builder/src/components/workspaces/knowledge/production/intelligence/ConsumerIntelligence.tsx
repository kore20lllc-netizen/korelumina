import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Building2,
  CircleGauge,
  GitBranch,
  MessageSquareText,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";

import {
  electricContour,
  LuminaExecutiveCard,
  LuminaExecutiveMetricGrid,
  premiumSurfaces,
} from "@/components/design-system/lumina";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import type {
  KnowledgeDistributionRecord,
} from "../capsules";

type ConsumerIntelligenceProps = {
  records: KnowledgeDistributionRecord[];
};

const consumerIcons = {
  "organizational-memory": Building2,
  "knowledge-graph": Network,
  "semantic-search": Search,
  "context-builder": Workflow,
  "chief-agent-corpus": BrainCircuit,
  "chief-agent-context": BrainCircuit,
  "mission-system": GitBranch,
  "runtime-advisor": CircleGauge,
  "executive-office": ShieldCheck,
  "engineering-workspace": Users,
} as const;

const panelClass = [
  "rounded-[26px] p-5",
  premiumSurfaces.base.panel,
  electricContour.strength.standard,
].join(" ");

const prominentPanelClass = [
  "rounded-[28px] p-6",
  premiumSurfaces.base.panel,
  electricContour.strength.prominent,
].join(" ");

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

const intelligenceRows = [
  {
    title: "Mission System",
    consumerId: "mission-system",
    trust: "High",
    adoption: "92%",
    quality: "Strong",
    pattern: "Mission planning",
    signal: "Expanded scenario guidance requested",
  },
  {
    title: "Context Builder",
    consumerId: "context-builder",
    trust: "High",
    adoption: "88%",
    quality: "Strong",
    pattern: "Context assembly",
    signal: "More recovery examples requested",
  },
  {
    title: "Organizational Memory",
    consumerId: "organizational-memory",
    trust: "Governed",
    adoption: "84%",
    quality: "Healthy",
    pattern: "Institutional recall",
    signal: "Privacy-filtered summary demand",
  },
  {
    title: "Engineering Workspace",
    consumerId: "engineering-workspace",
    trust: "High",
    adoption: "76%",
    quality: "Healthy",
    pattern: "Operating standards",
    signal: "Implementation checklist requested",
  },
];

const demandSignals = [
  {
    title: "Mission adaptation demand",
    value: "High",
    detail:
      "Consumers are requesting more scenario-specific operational guidance.",
  },
  {
    title: "Executive projection demand",
    value: "Moderate",
    detail:
      "Leadership consumers prefer concise risk and decision summaries.",
  },
  {
    title: "Chief Agent education demand",
    value: "Emerging",
    detail:
      "Competency mapping is the primary dependency before broader use.",
  },
];

const usagePatterns = [
  {
    title: "Mission planning",
    value: "34%",
    detail: "Most frequent governed consumption pattern.",
  },
  {
    title: "Context assembly",
    value: "27%",
    detail: "Strong reuse across active contextual workflows.",
  },
  {
    title: "Engineering standards",
    value: "22%",
    detail: "Increasing contribution to technical operating standards.",
  },
  {
    title: "Executive summaries",
    value: "17%",
    detail: "Restricted but high-value strategic consumption.",
  },
];

export function ConsumerIntelligence({
  records,
}: ConsumerIntelligenceProps) {
  const record = records[0];

  if (!record) {
    return null;
  }

  const activeConsumers = record.consumers.filter(
    (consumer) =>
      consumer.status === "consuming" ||
      consumer.status === "connected",
  ).length;

  const governedConsumers = record.consumers.filter(
    (consumer) =>
      consumer.status !== "deprecated" &&
      consumer.status !== "archived",
  ).length;

  const constrainedConsumers = record.consumers.filter(
    (consumer) =>
      consumer.status === "restricted" ||
      consumer.status === "pending" ||
      consumer.status === "waiting",
  ).length;

  return (
    <section
      aria-labelledby="consumer-intelligence-title"
      className="grid gap-5"
    >
      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)]">
        <header className={prominentPanelClass}>
          <div className="flex h-full flex-col gap-5 xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon
                icon={Activity}
                state="active"
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/68">
                  Governed consumption intelligence
                </div>

                <h2
                  id="consumer-intelligence-title"
                  className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-amber-400"
                >
                  Consumer Intelligence
                </h2>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-sky-300/68">
              Consumer Intelligence reveals how canonical knowledge is used,
              trusted, adopted, constrained, and adapted across organizational
              systems without changing the authority of the source capsule.
            </p>
          </div>

          <div className={cardClass}>
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-200/58">
              Intelligence posture
            </div>

            <div className="mt-2 text-sm font-semibold text-violet-100">
              Usage informs stewardship, not authority.
            </div>

            <div className="mt-2 text-[11px] leading-5 text-violet-200/56">
              Consumer behavior may trigger review, adaptation, or retirement
              signals, but never silently modifies canonical knowledge.
            </div>
          </div>
          </div>
        </header>

        <LuminaExecutiveMetricGrid columns={2}>
        <LuminaExecutiveCard
          title="Active consumers"
          value={String(activeConsumers)}
          description="Connected or consuming organizational systems."
          accentKey="cyan"
          icon={<Users className="h-4 w-4 text-cyan-300" />}
        />

        <LuminaExecutiveCard
          title="Governed access"
          value={String(governedConsumers)}
          description="Authorized consumers within current policy."
          accentKey="emerald"
          icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}
        />

        <LuminaExecutiveCard
          title="Constrained consumers"
          value={String(constrainedConsumers)}
          description="Pending, waiting, or restricted access paths."
          accentKey="amber"
          icon={<AlertTriangle className="h-4 w-4 text-amber-300" />}
        />

        <LuminaExecutiveCard
          title="Consumption events"
          value={String(record.history.length)}
          description="Governed activity captured for this capsule."
          accentKey="violet"
          icon={<Activity className="h-4 w-4 text-violet-300" />}
        />
        </LuminaExecutiveMetricGrid>
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.42fr)_minmax(340px,.58fr)]">
        <section className={panelClass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/62">
                Consumer performance
              </div>
              <h3 className="mt-1 text-lg font-semibold text-sky-100">
                Trust, adoption, quality, and feedback signals
              </h3>
            </div>

            <div className="rounded-full border border-blue-400/48 bg-cyan-300/[0.04] px-3 py-1.5 text-[10px] font-semibold text-cyan-100">
              4 priority consumers
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {intelligenceRows.map((row) => {
              const Icon =
                consumerIcons[
                  row.consumerId as keyof typeof consumerIcons
                ] ?? Network;

              return (
                <article
                  key={row.consumerId}
                  className={[
                    "rounded-[22px] p-4",
                    premiumSurfaces.base.card,
                    electricContour.strength.standard,
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <ExecutivePremiumIcon
                        icon={Icon}
                        state="healthy"
                      />

                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-white">
                          {row.title}
                        </h4>

                        <div className="mt-2 text-xs text-cyan-300/62">
                          Primary pattern: {row.pattern}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 xl:w-[430px]">
                      <div className={compactCardClass}>
                        <div className="text-[9px] uppercase tracking-[0.13em] text-emerald-300/52">
                          Consumer trust
                        </div>
                        <div className="mt-1 text-xs font-semibold text-emerald-100">
                          {row.trust}
                        </div>
                      </div>

                      <div className={compactCardClass}>
                        <div className="text-[9px] uppercase tracking-[0.13em] text-cyan-300/52">
                          Adoption
                        </div>
                        <div className="mt-1 text-xs font-semibold text-cyan-100">
                          {row.adoption}
                        </div>
                      </div>

                      <div className={compactCardClass}>
                        <div className="text-[9px] uppercase tracking-[0.13em] text-violet-300/52">
                          Consumption quality
                        </div>
                        <div className="mt-1 text-xs font-semibold text-violet-100">
                          {row.quality}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-blue-400/46 bg-cyan-300/[0.025] p-3 ring-1 ring-inset ring-cyan-300/10">
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-amber-300/56">
                        Feedback signal
                      </div>
                      <div className="mt-1 text-xs leading-5 text-sky-200/68">
                        {row.signal}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="grid items-stretch gap-5 xl:grid-cols-2">
          <section className={[panelClass, "h-full"].join(" ")}>
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon
                icon={TrendingUp}
                state="active"
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/58">
                  Usage patterns
                </div>
                <h3 className="mt-1 text-base font-semibold text-cyan-100">
                  Organizational adoption mix
                </h3>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {usagePatterns.map((pattern) => (
                <div
                  key={pattern.title}
                  className={cardClass}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      {pattern.title}
                    </div>
                    <div className="text-sm font-semibold text-cyan-100">
                      {pattern.value}
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] leading-5 text-sky-300/58">
                    {pattern.detail}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={[panelClass, "h-full"].join(" ")}>
            <div className="flex items-center gap-3">
              <ExecutivePremiumIcon
                icon={Sparkles}
                state="warning"
              />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/58">
                  Adaptation demand
                </div>
                <h3 className="mt-1 text-base font-semibold text-violet-100">
                  Emerging consumer requirements
                </h3>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {demandSignals.map((signal) => (
                <div
                  key={signal.title}
                  className={cardClass}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      {signal.title}
                    </div>
                    <div className="rounded-full border border-amber-300/24 bg-amber-300/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                      {signal.value}
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] leading-5 text-violet-200/58">
                    {signal.detail}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,.82fr)]">
        <section className={panelClass}>
          <div className="flex items-center gap-3">
            <ExecutivePremiumIcon
              icon={Activity}
              state="healthy"
            />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/58">
                Governed activity
              </div>
              <h3 className="mt-1 text-base font-semibold text-emerald-100">
                Recent consumption signals
              </h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {record.history.map((event) => (
              <article
                key={event.id}
                className={cardClass}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-white">
                    {event.consumer}
                  </div>

                  <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-cyan-300/54">
                    {event.action}
                  </div>
                </div>

                <div className="mt-2 text-[11px] leading-5 text-sky-300/60">
                  {event.detail}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={panelClass}>
          <div className="flex items-center gap-3">
            <ExecutivePremiumIcon
              icon={AlertTriangle}
              state="warning"
            />

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/58">
                Knowledge attention
              </div>
              <h3 className="mt-1 text-base font-semibold text-amber-100">
                Underused and constrained knowledge
              </h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className={cardClass}>
              <div className="text-[9px] uppercase tracking-[0.14em] text-amber-300/52">
                Underused projection
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                Executive Office
              </div>
              <div className="mt-2 text-[11px] leading-5 text-sky-300/58">
                Restricted summary-only access is limiting broader strategic
                adoption.
              </div>
            </div>

            <div className={cardClass}>
              <div className="text-[9px] uppercase tracking-[0.14em] text-violet-300/52">
                Waiting consumer
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                Chief Agent Context
              </div>
              <div className="mt-2 text-[11px] leading-5 text-sky-300/58">
                Consumption remains blocked by educational corpus publication.
              </div>
            </div>

            <div className={cardClass}>
              <div className="text-[9px] uppercase tracking-[0.14em] text-rose-300/52">
                Staleness watch
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                Runtime Advisor projection
              </div>
              <div className="mt-2 text-[11px] leading-5 text-sky-300/58">
                No governed retrieval event has been recorded in the current
                observation window.
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
