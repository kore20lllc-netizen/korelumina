import {
  Archive,
  BrainCircuit,
  Building2,
  CircleDot,
  GitBranch,
  GraduationCap,
  Network,
  Search,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  electricContour,
  premiumSurfaces,
} from "@/components/design-system/lumina";

import {
  LuminaStandardPremiumCard,
} from "@/components/design-system/surfaces/LuminaStandardPremiumCard";

import {
  KnowledgeCapsule,
} from "../capsules";

import type {
  KnowledgeCapsuleModel,
  KnowledgeDistributionRecord,
} from "../capsules";

type KnowledgeDistributionHubProps = {
  capsules: KnowledgeCapsuleModel[];
  records: KnowledgeDistributionRecord[];
  selectedCapsuleId: string;
  onCapsuleSelect: (capsuleId: string) => void;
};

const consumerIcons = {
  "organizational-memory": Building2,
  "knowledge-graph": Network,
  "semantic-search": Search,
  "context-builder": Workflow,
  "chief-agent-corpus": GraduationCap,
  "chief-agent-context": BrainCircuit,
  "mission-system": GitBranch,
  "runtime-advisor": CircleDot,
  "executive-office": ShieldCheck,
  "engineering-workspace": Archive,
} as const;

const statusClasses = {
  connected:
    "border-cyan-300/30 bg-cyan-300/[0.06] text-cyan-200",
  consuming:
    "border-emerald-300/32 bg-emerald-300/[0.07] text-emerald-200",
  waiting:
    "border-blue-400/55 ring-1 ring-inset ring-cyan-300/14 bg-violet-300/[0.06] text-violet-200",
  pending:
    "border-amber-300/30 bg-amber-300/[0.07] text-amber-200",
  restricted:
    "border-rose-300/30 bg-rose-300/[0.06] text-rose-200",
  deprecated:
    "border-slate-300/22 bg-slate-300/[0.05] text-slate-300",
  superseded:
    "border-orange-300/30 bg-orange-300/[0.06] text-orange-200",
  archived:
    "border-slate-400/24 bg-slate-400/[0.05] text-slate-300",
} as const;

const shellClass = [
  "overflow-hidden rounded-[30px]",
  premiumSurfaces.base.shell,
  electricContour.strength.flagship,
].join(" ");

const panelClass = [
  "rounded-[24px] p-5",
  premiumSurfaces.base.panel,
  electricContour.strength.standard,
].join(" ");

const topologyClass = [
  "relative overflow-hidden rounded-[28px] p-4 sm:p-5",
  premiumSurfaces.base.panel,
  electricContour.strength.prominent,
].join(" ");

const consumerCardClass = [
  "relative overflow-hidden rounded-[20px] p-4",
  premiumSurfaces.base.card,
  electricContour.strength.standard,
].join(" ");

const compactCardClass = [
  "rounded-[14px] px-3 py-2 text-center",
  premiumSurfaces.base.card,
  electricContour.strength.standard,
].join(" ");

export function KnowledgeDistributionHub({
  capsules,
  records,
  selectedCapsuleId,
  onCapsuleSelect,
}: KnowledgeDistributionHubProps) {
  const record =
    records.find(
      (item) =>
        item.capsuleId === selectedCapsuleId,
    ) ?? records[0];

  const capsule =
    capsules.find(
      (item) =>
        item.id === record?.capsuleId,
    ) ??
    capsules.find(
      (item) =>
        item.stage === "Canonical Knowledge",
    ) ??
    capsules[0];

  if (!record || !capsule) {
    return null;
  }

  return (
    <section
      aria-label="Knowledge Distribution and Consumption Hub"
      className={shellClass}
    >
      <header className="border-b border-violet-300/18 p-5 sm:p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300/72">
          Distribution phase
        </div>

        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-amber-400">
          Knowledge Distribution & Consumption Hub
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-300/76">
          Canonical Knowledge becomes a governed organizational asset. The capsule
          retains one permanent identity while authorized consumers increase around it.
        </p>
      </header>

      <div className="grid gap-6 p-5 sm:p-6">
        <section
          aria-label="Governed knowledge distribution topology"
          className={topologyClass}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(139,92,246,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.04)_1px,transparent_1px)] [background-size:36px_36px]"
          />

          <div className="relative">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px_minmax(0,1fr)] xl:items-center">
              <div className="grid gap-3">
                {record.consumers
                  .slice(
                    0,
                    Math.ceil(
                      record.consumers.length / 2,
                    ),
                  )
                  .map((consumer) => {
                    const Icon =
                      consumerIcons[
                        consumer.id as keyof typeof consumerIcons
                      ] ?? Network;

                    return (
                      <article
                        key={consumer.id}
                        className={consumerCardClass}
                      >
                        <div className="flex items-start gap-3">
                          <ExecutivePremiumIcon
                            icon={Icon}
                            state={
                              consumer.status === "consuming"
                                ? "healthy"
                                : consumer.status === "restricted"
                                  ? "warning"
                                  : "active"
                            }
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-sky-100">
                                {consumer.label}
                              </h3>

                              <div
                                className={[
                                  "inline-flex rounded-full border px-2 py-1",
                                  "text-[9px] font-semibold uppercase tracking-[0.12em]",
                                  statusClasses[consumer.status],
                                ].join(" ")}
                              >
                                {consumer.status}
                              </div>
                            </div>

                            <p className="mt-2 text-[11px] leading-5 text-sky-400/72">
                              {consumer.detail}
                            </p>
                          </div>
                        </div>

                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute right-0 top-1/2 hidden h-px w-5 translate-x-full bg-gradient-to-r from-cyan-300/46 to-violet-300/18 xl:block"
                        />
                      </article>
                    );
                  })}
              </div>

              <div className="relative mx-auto w-full max-w-[340px]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-8 rounded-full border border-violet-300/10"
                />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-4 rounded-[32px] border border-amber-300/10 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,.10),transparent_64%)]"
                />

                <div className="relative z-10 rounded-[26px] border border-amber-300/34 bg-amber-300/[0.05] p-4 shadow-[0_0_48px_rgba(245,158,11,.13),0_22px_50px_rgba(2,6,23,.38)]">
                  <div className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/74">
                    Canonical organizational asset
                  </div>

                  <KnowledgeCapsule
                    capsule={capsule}
                    selected
                    onSelect={onCapsuleSelect}
                  />

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className={compactCardClass}>
                      <div className="text-[9px] uppercase tracking-[0.12em] text-emerald-300/58">
                        Consuming
                      </div>
                      <div className="mt-1 text-sm font-semibold text-emerald-100">
                        {
                          record.consumers.filter(
                            (consumer) =>
                              consumer.status === "consuming",
                          ).length
                        }
                      </div>
                    </div>

                    <div className={compactCardClass}>
                      <div className="text-[9px] uppercase tracking-[0.12em] text-cyan-300/58">
                        Authorized
                      </div>
                      <div className="mt-1 text-sm font-semibold text-cyan-100">
                        {record.consumers.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {record.consumers
                  .slice(
                    Math.ceil(
                      record.consumers.length / 2,
                    ),
                  )
                  .map((consumer) => {
                    const Icon =
                      consumerIcons[
                        consumer.id as keyof typeof consumerIcons
                      ] ?? Network;

                    return (
                      <article
                        key={consumer.id}
                        className={consumerCardClass}
                      >
                        <div className="flex items-start gap-3">
                          <ExecutivePremiumIcon
                            icon={Icon}
                            state={
                              consumer.status === "consuming"
                                ? "healthy"
                                : consumer.status === "restricted"
                                  ? "warning"
                                  : "active"
                            }
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-sky-100">
                                {consumer.label}
                              </h3>

                              <div
                                className={[
                                  "inline-flex rounded-full border px-2 py-1",
                                  "text-[9px] font-semibold uppercase tracking-[0.12em]",
                                  statusClasses[consumer.status],
                                ].join(" ")}
                              >
                                {consumer.status}
                              </div>
                            </div>

                            <p className="mt-2 text-[11px] leading-5 text-sky-400/72">
                              {consumer.detail}
                            </p>
                          </div>
                        </div>

                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute left-0 top-1/2 hidden h-px w-5 -translate-x-full bg-gradient-to-l from-violet-300/46 to-cyan-300/18 xl:block"
                        />
                      </article>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
          <section className={panelClass}>
            <div className="flex flex-col gap-2 border-b border-cyan-300/12 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/68">
                  Governed consumption log
                </div>

                <p className="mt-1 text-xs text-sky-400/62">
                  Permanent record of authorized capsule use.
                </p>
              </div>

              <div className="rounded-full border border-blue-400/48 bg-cyan-300/[0.04] px-3 py-1.5 text-[10px] font-semibold text-cyan-100">
                {record.history.length} events
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {record.history.map((event) => (
                <LuminaStandardPremiumCard
                  as="article"
                  key={event.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-amber-300">
                      {event.consumer}
                    </div>

                    <div className="text-[9px] uppercase tracking-[0.12em] text-cyan-300/54">
                      {event.action}
                    </div>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-sky-400/72">
                    {event.detail}
                  </p>
                </LuminaStandardPremiumCard>
              ))}
            </div>
          </section>

          <section className={panelClass}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/68">
              Capsule genealogy
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <LuminaStandardPremiumCard>
                <div className="text-[9px] uppercase tracking-[0.13em] text-violet-300/58">
                  Parents
                </div>
                <div className="mt-2 text-sm font-semibold text-violet-100">
                  {record.genealogy.parentCapsuleIds.length}
                </div>
              </LuminaStandardPremiumCard>

              <LuminaStandardPremiumCard>
                <div className="text-[9px] uppercase tracking-[0.13em] text-emerald-300/58">
                  Children
                </div>
                <div className="mt-2 text-sm font-semibold text-emerald-100">
                  {record.genealogy.childCapsuleIds.length}
                </div>
              </LuminaStandardPremiumCard>

              <LuminaStandardPremiumCard>
                <div className="text-[9px] uppercase tracking-[0.13em] text-cyan-300/58">
                  Missions
                </div>
                <div className="mt-2 text-sm font-semibold text-cyan-100">
                  {record.genealogy.relatedMissions.length}
                </div>
              </LuminaStandardPremiumCard>

              <LuminaStandardPremiumCard>
                <div className="text-[9px] uppercase tracking-[0.13em] text-amber-300/58">
                  Educational influence
                </div>
                <div className="mt-2 text-sm font-semibold text-amber-100">
                  {record.genealogy.educationalInfluence.length}
                </div>
              </LuminaStandardPremiumCard>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
