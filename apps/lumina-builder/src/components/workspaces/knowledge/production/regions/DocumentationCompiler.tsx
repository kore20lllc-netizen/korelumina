import {
  CheckCircle2,
  FileCode2,
  FileSearch,
  RotateCcw,
  ScanText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  FlagshipPanel,
} from "../../learning/presentation/FlagshipPanel";

const stages = [
  {
    id: "queued",
    label: "Queued",
    detail: "8 governed documents awaiting compiler review",
    icon: FileSearch,
    state: "active",
  },
  {
    id: "parsing",
    label: "Parsing",
    detail: "Document structure and semantic boundaries identified",
    icon: ScanText,
    state: "active",
  },
  {
    id: "extracting",
    label: "Extracting",
    detail: "Authority, provenance, concepts and relationships modeled",
    icon: Sparkles,
    state: "active",
  },
  {
    id: "ir-generation",
    label: "IR Generation",
    detail: "Knowledge IR candidate assembled for inspection",
    icon: FileCode2,
    state: "active",
  },
  {
    id: "validation",
    label: "Validation",
    detail: "Educational impact and conflict posture under review",
    icon: ShieldCheck,
    state: "warning",
  },
  {
    id: "complete",
    label: "Complete",
    detail: "Candidate package ready for governed review",
    icon: CheckCircle2,
    state: "healthy",
  },
  {
    id: "failed",
    label: "Failed",
    detail: "Two unsupported source fragments require review",
    icon: TriangleAlert,
    state: "error",
  },
  {
    id: "retry",
    label: "Retry",
    detail: "Manual retry posture represented without execution",
    icon: RotateCcw,
    state: "warning",
  },
] as const;

export function DocumentationCompiler() {
  return (
    <FlagshipPanel
      title="Documentation Compiler"
      description="Detailed visual contract for transforming governed documentation into inspectable Knowledge IR candidates."
    >
      <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage, index) => (
          <article
            key={stage.id}
            className="relative rounded-[20px] border border-cyan-300/30 bg-slate-950/26 p-4 ring-1 ring-inset ring-cyan-100/8"
          >
            <div className="flex items-start gap-3">
              <ExecutivePremiumIcon
                icon={stage.icon}
                state={stage.state}
              />

              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/68">
                  Step {index + 1}
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

      <div className="grid gap-3 border-t border-cyan-300/16 p-5 md:grid-cols-3">
        <div className="rounded-[18px] border border-cyan-300/24 bg-cyan-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/66">
            Current candidate
          </div>

          <div className="mt-2 text-sm font-semibold text-sky-200">
            Knowledge Constitution v1
          </div>

          <div className="mt-1 text-xs text-sky-500/72">
            14 concepts · 23 relationships · 96% confidence
          </div>
        </div>

        <div className="rounded-[18px] border border-violet-300/24 bg-violet-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-violet-300/66">
            Educational mapping
          </div>

          <div className="mt-2 text-sm font-semibold text-violet-200">
            Governance Foundations
          </div>

          <div className="mt-1 text-xs text-sky-500/72">
            Authority, approval, provenance and activation boundaries
          </div>
        </div>

        <div className="rounded-[18px] border border-amber-300/24 bg-amber-300/[0.05] p-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-amber-300/66">
            Manual review
          </div>

          <div className="mt-2 text-sm font-semibold text-amber-300">
            2 unresolved fragments
          </div>

          <div className="mt-1 text-xs text-sky-500/72">
            Source authority and supersession require confirmation
          </div>
        </div>
      </div>
    </FlagshipPanel>
  );
}
