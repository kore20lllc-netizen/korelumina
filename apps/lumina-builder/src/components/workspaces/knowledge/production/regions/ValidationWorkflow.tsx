import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  CircleX,
  Eye,
  FileQuestion,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

const validations = [
  {
    label: "Authority alignment",
    status: "Passed",
    rationale: "Source authority matches constitutional and architectural hierarchy.",
    impact: "Chief Agent curriculum remains within approved governance boundaries.",
    icon: CheckCircle2,
    state: "healthy",
  },
  {
    label: "Provenance completeness",
    status: "Warning",
    rationale: "Two conversation references require stronger source lineage.",
    impact: "Educational confidence remains partial until lineage is confirmed.",
    icon: AlertTriangle,
    state: "warning",
  },
  {
    label: "Conflict resolution",
    status: "Manual review",
    rationale: "A superseded engineering decision conflicts with a newer architectural rule.",
    impact: "Related curriculum cannot be promoted to activation-ready status.",
    icon: Eye,
    state: "warning",
  },
  {
    label: "Evidence sufficiency",
    status: "Awaiting evidence",
    rationale: "Runtime evidence remains represented as a future certified compiler stage.",
    impact: "Operational competency coverage remains intentionally incomplete.",
    icon: FileQuestion,
    state: "active",
  },
  {
    label: "Educational mapping",
    status: "Passed",
    rationale: "Knowledge concepts map to Governance Foundations and Repository Operations.",
    impact: "Package candidate contributes directly to Chief Agent curriculum.",
    icon: CheckCircle2,
    state: "healthy",
  },
  {
    label: "Canonical conflict",
    status: "Conflict",
    rationale: "One package candidate overlaps an approved canonical knowledge boundary.",
    impact: "Canonical review must determine merge, supersession or rejection.",
    icon: CircleX,
    state: "error",
  },
] as const;

export function ValidationWorkflow() {
  return (
    <LuminaFlagshipPanel
      title="Validation"
      description="Visible validation posture across passed, warning, failed, manual review, awaiting evidence and conflict states."
    >
      <div className="grid gap-3 p-5 lg:grid-cols-2">
        {validations.map((validation) => (
          <article
            key={validation.label}
            className="rounded-[20px] border border-amber-300/24 bg-slate-950/24 p-4"
          >
            <div className="flex items-start gap-3">
              <ExecutivePremiumIcon
                icon={validation.icon}
                state={validation.state}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-amber-400">
                    {validation.label}
                  </h3>

                  <span className="rounded-full border border-amber-300/22 bg-amber-300/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-300">
                    {validation.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-sky-500/62">
                      Rationale
                    </div>
                    <p className="mt-1 text-xs leading-5 text-sky-300/80">
                      {validation.rationale}
                    </p>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-sky-500/62">
                      Educational impact
                    </div>
                    <p className="mt-1 text-xs leading-5 text-sky-300/80">
                      {validation.impact}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-amber-300/16 p-5 text-xs text-sky-400/76">
        <CircleHelp className="h-4 w-4 text-amber-300" />
        Validation remains a visual contract only. No engine or live review workflow is implemented.
      </div>
    </LuminaFlagshipPanel>
  );
}
