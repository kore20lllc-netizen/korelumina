import {
  AlertTriangle,
  BrainCircuit,
  GitFork,
  Link2,
  Network,
  ShieldCheck,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  FlagshipPanel,
} from "../../learning/presentation/FlagshipPanel";

const concepts = [
  "Human authorization boundary",
  "Educational activation readiness",
  "Evidence authority hierarchy",
  "Canonical knowledge lifecycle",
  "Conversation-derived decisions",
] as const;

const relationships = [
  "Constitution governs curriculum",
  "Evidence supports compiler candidate",
  "Decision contributes to Knowledge Package",
  "Validation gates canonical review",
] as const;

export function KnowledgeIR() {
  return (
    <FlagshipPanel
      title="Knowledge IR"
      description="Inspectable intermediate representation of extracted concepts, relationships, authority, provenance, dependencies, educational mapping and unresolved conflicts."
    >
      <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <section className="rounded-[22px] border border-cyan-300/30 bg-slate-950/26 p-5">
          <div className="flex items-center gap-3">
            <ExecutivePremiumIcon
              icon={BrainCircuit}
              state="active"
            />

            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/68">
                Extracted concepts
              </div>
              <div className="mt-1 text-sm font-semibold text-amber-400">
                14 governed concepts
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {concepts.map((concept) => (
              <div
                key={concept}
                className="rounded-[16px] border border-cyan-300/20 bg-cyan-300/[0.04] px-3 py-3 text-xs leading-5 text-sky-200"
              >
                {concept}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-violet-300/30 bg-slate-950/26 p-5">
          <div className="flex items-center gap-3">
            <ExecutivePremiumIcon
              icon={GitFork}
              state="active"
            />

            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-violet-300/68">
                Relationships
              </div>
              <div className="mt-1 text-sm font-semibold text-amber-400">
                23 mapped relationships
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {relationships.map((relationship) => (
              <div
                key={relationship}
                className="flex items-center gap-3 rounded-[16px] border border-violet-300/20 bg-violet-300/[0.04] px-3 py-3"
              >
                <Link2 className="h-4 w-4 text-violet-300" />
                <span className="text-xs text-sky-200">
                  {relationship}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-3 border-t border-cyan-300/16 p-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-cyan-300/24 bg-cyan-300/[0.05] p-4">
          <ExecutivePremiumIcon
            icon={ShieldCheck}
            state="healthy"
          />
          <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-cyan-300/66">
            Confidence
          </div>
          <div className="mt-1 text-lg font-semibold text-cyan-200">
            94%
          </div>
        </div>

        <div className="rounded-[18px] border border-amber-300/24 bg-amber-300/[0.05] p-4">
          <ExecutivePremiumIcon
            icon={Network}
            state="warning"
          />
          <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-amber-300/66">
            Authority
          </div>
          <div className="mt-1 text-sm font-semibold text-amber-300">
            Architectural
          </div>
        </div>

        <div className="rounded-[18px] border border-violet-300/24 bg-violet-300/[0.05] p-4">
          <ExecutivePremiumIcon
            icon={GitFork}
            state="active"
          />
          <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-violet-300/66">
            Dependencies
          </div>
          <div className="mt-1 text-sm font-semibold text-violet-200">
            6 governed links
          </div>
        </div>

        <div className="rounded-[18px] border border-rose-300/24 bg-rose-300/[0.05] p-4">
          <ExecutivePremiumIcon
            icon={AlertTriangle}
            state="error"
          />
          <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-rose-300/66">
            Unresolved conflicts
          </div>
          <div className="mt-1 text-sm font-semibold text-rose-200">
            2 require review
          </div>
        </div>
      </div>
    </FlagshipPanel>
  );
}
