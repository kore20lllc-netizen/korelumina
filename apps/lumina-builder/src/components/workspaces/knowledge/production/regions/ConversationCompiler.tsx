import {
  BrainCircuit,
  CheckCircle2,
  FileCode2,
  GitCommitHorizontal,
  MessagesSquare,
  Network,
  Scale,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

const conversationStages = [
  {
    label: "Conversation Intake",
    detail: "Governed conversational source selected for educational analysis",
    icon: MessagesSquare,
    state: "active",
  },
  {
    label: "Educational Relevance",
    detail: "Chief Agent learning relevance and curriculum contribution mapped",
    icon: BrainCircuit,
    state: "active",
  },
  {
    label: "Architectural Impact",
    detail: "Architecture, workflow and boundary implications identified",
    icon: Network,
    state: "warning",
  },
  {
    label: "Decision Extraction",
    detail: "Durable decisions, corrections and rationale separated from dialogue",
    icon: GitCommitHorizontal,
    state: "active",
  },
  {
    label: "Knowledge IR",
    detail: "Conversation concepts and lineage represented as an IR candidate",
    icon: FileCode2,
    state: "active",
  },
  {
    label: "Validation",
    detail: "Authority, provenance and conflict posture awaiting human review",
    icon: Scale,
    state: "warning",
  },
  {
    label: "Package Candidate",
    detail: "Educational knowledge candidate prepared for governed packaging",
    icon: CheckCircle2,
    state: "healthy",
  },
] as const;

export function ConversationCompiler() {
  return (
    <LuminaFlagshipPanel
      title="Conversation Compiler"
      description="Conversation is treated as a first-class educational source with visible relevance, architectural impact, decision lineage and package contribution."
    >
      <div className="grid gap-3 p-5 lg:grid-cols-2 xl:grid-cols-3">
        {conversationStages.map((stage, index) => (
          <article
            key={stage.label}
            className="rounded-[20px] border border-violet-300/28 bg-slate-950/24 p-4 ring-1 ring-inset ring-violet-100/8"
          >
            <div className="flex items-start gap-3">
              <ExecutivePremiumIcon
                icon={stage.icon}
                state={stage.state}
              />

              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/66">
                  Stage {index + 1}
                </div>

                <h3 className="mt-1 text-sm font-semibold text-amber-400">
                  {stage.label}
                </h3>

                <p className="mt-1.5 text-xs leading-5 text-sky-500/76">
                  {stage.detail}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-3 border-t border-violet-300/16 p-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-cyan-300/24 bg-cyan-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-cyan-300/66">
            Selected conversation
          </div>
          <div className="mt-2 text-sm font-semibold text-sky-200">
            Phase 1A certification thread
          </div>
        </div>

        <div className="rounded-[18px] border border-violet-300/24 bg-violet-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-violet-300/66">
            Educational relevance
          </div>
          <div className="mt-2 text-sm font-semibold text-violet-200">
            High · 94%
          </div>
        </div>

        <div className="rounded-[18px] border border-amber-300/24 bg-amber-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-amber-300/66">
            Decisions extracted
          </div>
          <div className="mt-2 text-sm font-semibold text-amber-300">
            7 durable decisions
          </div>
        </div>

        <div className="rounded-[18px] border border-emerald-300/24 bg-emerald-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-emerald-300/66">
            Package posture
          </div>
          <div className="mt-2 text-sm font-semibold text-emerald-300">
            Candidate
          </div>
        </div>
      </div>
    </LuminaFlagshipPanel>
  );
}
