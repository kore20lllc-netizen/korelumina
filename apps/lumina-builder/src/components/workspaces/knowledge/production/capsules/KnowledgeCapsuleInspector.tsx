import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  GitBranch,
  Network,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  FlagshipPanel,
} from "../../learning/presentation/FlagshipPanel";

import {
  flagshipAppearance,
} from "../../learning/presentation/flagshipAppearance";

import type {
  KnowledgeCapsule,
} from "./types";

type InspectorTab =
  | "lifecycle"
  | "provenance"
  | "validation"
  | "distribution"
  | "genealogy"
  | "mission-impact";

interface KnowledgeCapsuleInspectorProps {
  capsule: KnowledgeCapsule | null;
  onClose?: () => void;
}

const tabs: Array<{
  id: InspectorTab;
  label: string;
  icon: typeof Clock3;
}> = [
  {
    id: "lifecycle",
    label: "Lifecycle",
    icon: Clock3,
  },
  {
    id: "provenance",
    label: "Provenance",
    icon: DatabaseZap,
  },
  {
    id: "validation",
    label: "Validation",
    icon: ShieldCheck,
  },
  {
    id: "distribution",
    label: "Distribution",
    icon: Network,
  },
  {
    id: "genealogy",
    label: "Genealogy",
    icon: GitBranch,
  },
  {
    id: "mission-impact",
    label: "Mission impact",
    icon: Target,
  },
];

const stateClasses = {
  queued:
    "border-sky-300/26 bg-sky-300/[0.07] text-sky-100",
  processing:
    "border-cyan-300/28 bg-cyan-300/[0.08] text-cyan-100",
  waiting:
    "border-blue-400/55 ring-1 ring-inset ring-cyan-300/14 bg-violet-300/[0.08] text-violet-100",
  blocked:
    "border-rose-300/30 bg-rose-300/[0.08] text-rose-100",
  failed:
    "border-rose-300/34 bg-rose-300/[0.10] text-rose-100",
  "needs-review":
    "border-amber-300/32 bg-amber-300/[0.09] text-amber-100",
  validated:
    "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-100",
  approved:
    "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-100",
  published:
    "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100",
  adapted:
    "border-violet-300/30 bg-violet-300/[0.08] text-violet-100",
  consumed:
    "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100",
  superseded:
    "border-slate-300/24 bg-slate-300/[0.06] text-slate-200",
  archived:
    "border-slate-300/20 bg-slate-300/[0.05] text-slate-300",
} as const;

function DetailCard({
  label,
  value,
  tone = "cyan",
}: {
  label: string;
  value: string;
  tone?: "cyan" | "violet" | "amber" | "emerald" | "rose";
}) {
  const toneClasses = {
    cyan:
      "border-blue-400/48 ring-1 ring-inset ring-cyan-300/10 bg-cyan-300/[0.035] text-cyan-100",
    violet:
      "border-blue-400/48 ring-1 ring-inset ring-cyan-300/10 bg-violet-300/[0.035] text-violet-100",
    amber:
      "border-blue-400/48 ring-1 ring-inset ring-cyan-300/10 bg-amber-300/[0.035] text-amber-100",
    emerald:
      "border-blue-400/48 ring-1 ring-inset ring-cyan-300/10 bg-emerald-300/[0.035] text-emerald-100",
    rose:
      "border-blue-400/48 ring-1 ring-inset ring-cyan-300/10 bg-rose-300/[0.035] text-rose-100",
  } as const;

  return (
    <div
      className={[
        "rounded-[16px] border p-3",
        toneClasses[tone],
      ].join(" ")}
    >
      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] opacity-60">
        {label}
      </div>

      <div className="mt-1.5 text-sm font-semibold leading-5">
        {value}
      </div>
    </div>
  );
}

function EmptyValue({
  label,
}: {
  label: string;
}) {
  return (
    <div className="rounded-[16px] border border-dashed border-cyan-300/12 bg-cyan-300/[0.015] px-3 py-4 text-center text-[10px] leading-5 text-sky-500/52">
      {label}
    </div>
  );
}

export function KnowledgeCapsuleInspector({
  capsule,
  onClose,
}: KnowledgeCapsuleInspectorProps) {
  const [
    activeTab,
    setActiveTab,
  ] = useState<InspectorTab>("lifecycle");

  useEffect(() => {
    setActiveTab("lifecycle");
  }, [capsule?.id]);

  const activeTabDefinition = useMemo(
    () =>
      tabs.find(
        (tab) =>
          tab.id === activeTab,
      ) ?? tabs[0],
    [activeTab],
  );

  if (!capsule) {
    return null;
  }

  const ActiveIcon =
    activeTabDefinition.icon;

  const validationLayerCount =
    capsule.layers.filter(
      (layer) =>
        layer.status === "validated",
    ).length;

  const disputedLayerCount =
    capsule.layers.filter(
      (layer) =>
        layer.status !== "validated",
    ).length;

  return (
    <FlagshipPanel
      aria-label={`${capsule.identity} executive inspector`}
      className="overflow-hidden"
    >
      <header className="border-b border-blue-400/50 ring-1 ring-inset ring-cyan-300/12 bg-[linear-gradient(145deg,rgba(4,14,36,.88),rgba(17,10,46,.84),rgba(4,15,38,.88))] p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/72">
              Executive knowledge passport
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-amber-400 sm:text-2xl">
                {capsule.identity}
              </h2>

              <div
                className={[
                  "inline-flex rounded-full border px-3 py-1.5",
                  "text-[9px] font-semibold uppercase tracking-[0.13em]",
                  stateClasses[capsule.state],
                ].join(" ")}
              >
                {capsule.state.replace("-", " ")}
              </div>

              <div className="inline-flex rounded-full border border-blue-400/60 ring-1 ring-inset ring-cyan-300/16 bg-violet-300/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-violet-100">
                {capsule.integrity}
              </div>
            </div>

            <h3 className="mt-3 text-base font-semibold text-sky-100">
              {capsule.title}
            </h3>

            <p className="mt-2 max-w-3xl text-xs leading-5 text-sky-400/72">
              Stable identity, governed lineage, validation posture,
              distribution authority and mission influence for one
              persistent Knowledge Package.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-[18px] border border-blue-400/48 bg-cyan-300/[0.04] px-4 py-3">
              <div className="text-[9px] uppercase tracking-[0.14em] text-cyan-300/56">
                Current stage
              </div>
              <div className="mt-1 text-sm font-semibold text-cyan-100">
                {capsule.stage}
              </div>
            </div>

            {onClose ? (
              <button
                type="button"
                aria-label="Close capsule inspector"
                onClick={onClose}
                className={[
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border",
                  "border-blue-400/55 ring-1 ring-inset ring-cyan-300/14 bg-cyan-300/[0.045] text-cyan-100",
                  "transition-[border-color,background-color,transform] duration-200",
                  "hover:-translate-y-0.5 hover:border-cyan-300/42 hover:bg-cyan-300/[0.08]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60",
                  "motion-reduce:transition-none",
                ].join(" ")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Knowledge capsule inspector sections"
          className="mt-6 flex gap-2 overflow-x-auto pb-1"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={[
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2",
                  "text-[10px] font-semibold transition-[border-color,background-color,color,transform] duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/55",
                  "motion-reduce:transition-none",
                  active
                    ? "border-cyan-300/42 bg-cyan-300/[0.10] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,.09)]"
                    : "border-cyan-300/14 bg-slate-950/24 text-sky-400/72 hover:-translate-y-0.5 hover:border-cyan-300/28 hover:text-sky-100",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <div
        role="tabpanel"
        className="p-5 sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <ExecutivePremiumIcon
            icon={ActiveIcon}
            state={
              activeTab === "validation" &&
              disputedLayerCount > 0
                ? "warning"
                : activeTab === "distribution"
                  ? "active"
                  : "healthy"
            }
          />

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/62">
              Inspector section
            </div>

            <div className="mt-1 text-sm font-semibold text-amber-400">
              {activeTabDefinition.label}
            </div>
          </div>
        </div>

        {activeTab === "lifecycle" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
            <section
              className={[
                flagshipAppearance.innerPanel,
                "bg-slate-950/24 p-4",
              ].join(" ")}
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <DetailCard
                  label="Stable identity"
                  value={capsule.identity}
                />
                <DetailCard
                  label="Current stage"
                  value={capsule.stage}
                  tone="violet"
                />
                <DetailCard
                  label="Lifecycle state"
                  value={capsule.state.replace("-", " ")}
                  tone="emerald"
                />
                <DetailCard
                  label="Integrity posture"
                  value={capsule.integrity}
                  tone={
                    capsule.integrity === "sealed"
                      ? "emerald"
                      : "rose"
                  }
                />
                <DetailCard
                  label="Package type"
                  value={capsule.type}
                  tone="amber"
                />
                <DetailCard
                  label="Authority"
                  value={capsule.authority}
                />
              </div>
            </section>

            <section
              className={[
                flagshipAppearance.innerPanel,
                "bg-violet-300/[0.03] p-4",
              ].join(" ")}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/64">
                Lifecycle assurance
              </div>

              <div className="mt-4 grid gap-3">
                <DetailCard
                  label="Identity continuity"
                  value="Preserved"
                  tone="emerald"
                />
                <DetailCard
                  label="Capsule replacement"
                  value="Prohibited"
                  tone="amber"
                />
                <DetailCard
                  label="Lineage retention"
                  value="Permanent"
                  tone="violet"
                />
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "provenance" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <section
              className={[
                flagshipAppearance.innerPanel,
                "bg-slate-950/24 p-4",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={DatabaseZap}
                  state="active"
                />

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/62">
                    Source provenance
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-400">
                    Evidentiary origin
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailCard
                  label="Owner"
                  value={capsule.owner}
                />
                <DetailCard
                  label="Compiler"
                  value={capsule.compiler}
                  tone="violet"
                />
                <DetailCard
                  label="Source count"
                  value={String(capsule.sources.length)}
                  tone="amber"
                />
                <DetailCard
                  label="Evidence status"
                  value={
                    capsule.sources.length > 0
                      ? "Captured"
                      : "Pending"
                  }
                  tone={
                    capsule.sources.length > 0
                      ? "emerald"
                      : "rose"
                  }
                />
              </div>
            </section>

            <section
              className={[
                flagshipAppearance.innerPanel,
                "bg-violet-300/[0.03] p-4",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={BrainCircuit}
                  state="active"
                />

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-violet-300/62">
                    Semantic formation
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-400">
                    Knowledge IR mapping
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Claims",
                  "Concepts",
                  "Mappings",
                  "Confidence",
                  "Educational mapping",
                  "Constitutional artifacts",
                ].map((item) => (
                  <DetailCard
                    key={item}
                    label={item}
                    value="Modeled"
                    tone="violet"
                  />
                ))}
              </div>
            </section>

            <section className="rounded-[22px] border border-blue-400/48 bg-slate-950/24 p-4 lg:col-span-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/62">
                Source register
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {capsule.sources.length > 0 ? (
                  capsule.sources.map((source) => (
                    <DetailCard
                      key={source}
                      label="Source"
                      value={source}
                    />
                  ))
                ) : (
                  <EmptyValue label="No source records available in this fixture." />
                )}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "validation" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-[22px] border border-amber-300/20 bg-amber-300/[0.025] p-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <DetailCard
                  label="Validated layers"
                  value={String(validationLayerCount)}
                  tone="emerald"
                />
                <DetailCard
                  label="Disputed layers"
                  value={String(disputedLayerCount)}
                  tone={
                    disputedLayerCount > 0
                      ? "rose"
                      : "emerald"
                  }
                />
                <DetailCard
                  label="Current posture"
                  value={
                    disputedLayerCount > 0
                      ? "Exception active"
                      : "Healthy"
                  }
                  tone={
                    disputedLayerCount > 0
                      ? "amber"
                      : "emerald"
                  }
                />
              </div>

              <div className="mt-4 grid gap-3">
                {capsule.layers.map((layer) => (
                  <article
                    key={layer.id}
                    className={[
                      "rounded-[18px] border p-4",
                      layer.status === "validated"
                        ? "border-emerald-300/18 bg-emerald-300/[0.035]"
                        : "border-rose-300/18 bg-rose-300/[0.035]",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-sky-100">
                          {layer.label}
                        </div>

                        <div className="mt-1 text-[10px] text-sky-400/62">
                          {layer.id}
                        </div>
                      </div>

                      <div
                        className={[
                          "rounded-full border px-2.5 py-1",
                          "text-[9px] font-semibold uppercase tracking-[0.12em]",
                          layer.status === "validated"
                            ? "border-emerald-300/24 bg-emerald-300/[0.06] text-emerald-100"
                            : "border-rose-300/24 bg-rose-300/[0.06] text-rose-100",
                        ].join(" ")}
                      >
                        {layer.status}
                      </div>
                    </div>

                    {layer.detail ? (
                      <p className="mt-2 text-[11px] leading-5 text-sky-400/70">
                        {layer.detail}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section
              className={[
                flagshipAppearance.innerPanel,
                "bg-violet-300/[0.03] p-4",
              ].join(" ")}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/62">
                Review controls
              </div>

              <div className="mt-4 grid gap-3">
                <DetailCard
                  label="Approval posture"
                  value={capsule.approval}
                  tone="amber"
                />
                <DetailCard
                  label="Confidence"
                  value={`${capsule.confidence}%`}
                  tone="cyan"
                />
                <DetailCard
                  label="Reseal eligibility"
                  value={
                    disputedLayerCount > 0
                      ? "Pending remediation"
                      : "Eligible"
                  }
                  tone={
                    disputedLayerCount > 0
                      ? "rose"
                      : "emerald"
                  }
                />
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "distribution" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <section
              className={[
                flagshipAppearance.innerPanel,
                "bg-slate-950/24 p-4",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={Network}
                  state="active"
                />

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/62">
                    Distribution destinations
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-400">
                    Governed consumer access
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Organizational Memory",
                  "Knowledge Graph",
                  "Semantic Search",
                  "Context Builder",
                  "Chief Agent Educational Corpus",
                  "Mission System",
                  "Runtime Advisor",
                  "Executive Office",
                ].map((item) => (
                  <DetailCard
                    key={item}
                    label="Consumer"
                    value={item}
                  />
                ))}
              </div>
            </section>

            <section
              className={[
                flagshipAppearance.innerPanel,
                "bg-violet-300/[0.03] p-4",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={BookOpenCheck}
                  state="healthy"
                />

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-violet-300/62">
                    Consumption posture
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-400">
                    Authorized organizational use
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <DetailCard
                  label="Distribution state"
                  value={
                    capsule.state === "published" ||
                    capsule.state === "consumed" ||
                    capsule.state === "adapted"
                      ? "Active"
                      : "Pending publication"
                  }
                  tone="emerald"
                />
                <DetailCard
                  label="Canonical immutability"
                  value="Enforced"
                  tone="violet"
                />
                <DetailCard
                  label="Consumption history"
                  value="Preserved"
                  tone="cyan"
                />
                <DetailCard
                  label="Future consumers"
                  value="Authorization required"
                  tone="amber"
                />
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "genealogy" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <section
              className={[
                flagshipAppearance.innerPanel,
                "bg-violet-300/[0.03] p-4",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={GitBranch}
                  state="active"
                />

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-violet-300/62">
                    Capsule genealogy
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-400">
                    Organizational descent
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailCard
                  label="Ancestors"
                  value="Tracked"
                  tone="violet"
                />
                <DetailCard
                  label="Descendants"
                  value="Tracked"
                  tone="emerald"
                />
                <DetailCard
                  label="Siblings"
                  value="Tracked"
                  tone="cyan"
                />
                <DetailCard
                  label="Lineage continuity"
                  value="Permanent"
                  tone="amber"
                />
              </div>
            </section>

            <section
              className={[
                flagshipAppearance.innerPanel,
                "bg-slate-950/24 p-4",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={Network}
                  state="active"
                />

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/62">
                    Dependency graph
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-400">
                    Operational relationships
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Upstream",
                  "Downstream",
                  "Blocking",
                  "Related Packages",
                  "Related Conversations",
                  "Related Documentation",
                ].map((item) => (
                  <DetailCard
                    key={item}
                    label={item}
                    value="Inspectable"
                  />
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "mission-impact" ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section
              className={[
                flagshipAppearance.innerPanel,
                "bg-slate-950/24 p-4",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={Target}
                  state="active"
                />

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/62">
                    Mission influence
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-400">
                    Operational effect surface
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  "Planning",
                  "Reasoning",
                  "Execution",
                  "Runtime",
                  "Future Learning",
                  "Engineering Standards",
                ].map((item) => (
                  <DetailCard
                    key={item}
                    label="Influence"
                    value={item}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-[22px] border border-amber-300/18 bg-amber-300/[0.025] p-4">
              <div className="flex items-center gap-3">
                <ExecutivePremiumIcon
                  icon={CheckCircle2}
                  state="healthy"
                />

                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-amber-300/62">
                    Educational contribution
                  </div>
                  <div className="mt-1 text-sm font-semibold text-amber-400">
                    Chief Agent readiness
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <DetailCard
                  label="Educational corpus"
                  value="Contributing"
                  tone="amber"
                />
                <DetailCard
                  label="Genesis corpus"
                  value="Mapped"
                  tone="violet"
                />
                <DetailCard
                  label="Competency effect"
                  value="Inspectable"
                  tone="cyan"
                />
                <DetailCard
                  label="Organizational influence"
                  value="Governed"
                  tone="emerald"
                />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </FlagshipPanel>
  );
}
