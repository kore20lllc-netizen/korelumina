import {
  Filter,
  Search,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  FlagshipPanel,
} from "../../learning/presentation/FlagshipPanel";

import type {
  EvidenceSource,
} from "../state";

interface EvidenceIntakeProps {
  sources: EvidenceSource[];
  selectedSourceId: string;
  onSourceSelect: (sourceId: string) => void;
}

const authorityState = {
  constitutional: "healthy",
  architectural: "active",
  operational: "warning",
  supporting: "active",
} as const;

export function EvidenceIntake({
  sources,
  selectedSourceId,
  onSourceSelect,
}: EvidenceIntakeProps) {
  return (
    <FlagshipPanel
      title="Evidence Intake"
      description="Governed source visibility across authority, provenance, ownership, scope, confidence, lifecycle and educational contribution."
      toolbar={
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/[0.06] px-3 text-xs font-semibold text-cyan-200 transition hover:border-cyan-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 motion-reduce:transition-none"
          >
            <Search className="h-4 w-4" />
            Search
          </button>

          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-300/30 bg-violet-300/[0.06] px-3 text-xs font-semibold text-violet-200 transition hover:border-violet-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 motion-reduce:transition-none"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      }
    >
      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => {
          const selected =
            source.id === selectedSourceId;

          return (
            <button
              key={source.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSourceSelect(source.id)}
              className={[
                "group rounded-[20px] border p-4 text-left transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                "motion-reduce:transition-none",
                selected
                  ? "border-cyan-200/72 bg-cyan-300/[0.10] shadow-[0_0_26px_rgba(34,211,238,.13)]"
                  : "border-cyan-300/30 bg-slate-950/26 hover:border-cyan-200/55 hover:bg-cyan-300/[0.06]",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <ExecutivePremiumIcon
                  icon={source.icon}
                  state={authorityState[source.authority]}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-amber-400">
                        {source.label}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-sky-500/78">
                        {source.description}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full border border-cyan-300/24 bg-cyan-300/[0.06] px-2 py-1 text-[10px] font-semibold text-cyan-200">
                      {source.artifactCount}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <dt className="uppercase tracking-[0.14em] text-sky-500/62">
                        Authority
                      </dt>
                      <dd className="mt-1 font-medium capitalize text-amber-300">
                        {source.authority}
                      </dd>
                    </div>

                    <div>
                      <dt className="uppercase tracking-[0.14em] text-sky-500/62">
                        Confidence
                      </dt>
                      <dd className="mt-1 font-medium text-cyan-200">
                        {source.confidence}%
                      </dd>
                    </div>

                    <div>
                      <dt className="uppercase tracking-[0.14em] text-sky-500/62">
                        Owner
                      </dt>
                      <dd className="mt-1 font-medium text-sky-200">
                        {source.owner}
                      </dd>
                    </div>

                    <div>
                      <dt className="uppercase tracking-[0.14em] text-sky-500/62">
                        Lifecycle
                      </dt>
                      <dd className="mt-1 font-medium capitalize text-violet-200">
                        {source.lifecycle}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-cyan-300/16 pt-3">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-sky-500/62">
                      Educational contribution
                    </div>
                    <p className="mt-1 text-xs leading-5 text-sky-300/80">
                      {source.educationalContribution}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </FlagshipPanel>
  );
}
