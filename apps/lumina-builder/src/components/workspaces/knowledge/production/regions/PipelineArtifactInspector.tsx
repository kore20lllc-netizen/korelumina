import {
  BookOpenCheck,
  FileText,
  GitBranch,
  MessagesSquare,
  Network,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

interface PipelineArtifactInspectorProps {
  sourceLabel: string;
  compilerLabel: string;
}

const inspectorSections = [
  {
    label: "Executive Summary",
    value:
      "Governed evidence candidate contributing to Chief Agent education and package readiness.",
  },
  {
    label: "Source",
    value:
      "Certified mixed-source evidence corpus",
  },
  {
    label: "Authority",
    value:
      "Architectural",
  },
  {
    label: "Approval",
    value:
      "Human review required",
  },
  {
    label: "Provenance",
    value:
      "Constitutional documentation, decision records and governed conversations",
  },
  {
    label: "Lineage",
    value:
      "Evidence → Compiler → Knowledge IR → Validation → Package candidate",
  },
  {
    label: "Dependencies",
    value:
      "Knowledge Constitution, Learning Constitution and Chief Agent Operational Learning Model",
  },
  {
    label: "Validation",
    value:
      "4 passed · 2 require manual review",
  },
  {
    label: "Educational Contribution",
    value:
      "Governance Foundations and Repository Operations",
  },
  {
    label: "Related Curriculum",
    value:
      "Authority, provenance, lifecycle and activation readiness",
  },
  {
    label: "Related Conversations",
    value:
      "Phase 1A certification thread and production-contract decisions",
  },
  {
    label: "Related Knowledge Packages",
    value:
      "KPKG-GOVERNANCE-FOUNDATIONS-001",
  },
  {
    label: "Related Canonical Knowledge",
    value:
      "Canonical review boundary only; not implemented",
  },
] as const;

export function PipelineArtifactInspector({
  sourceLabel,
  compilerLabel,
}: PipelineArtifactInspectorProps) {
  return (
    <LuminaFlagshipPanel
      title="Pipeline Artifact Inspector"
      description="Fully populated inspection contract for the currently selected source and compiler artifact."
    >
      <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <section className="rounded-[22px] border border-cyan-300/30 bg-slate-950/26 p-5">
          <div className="flex items-start gap-3">
            <ExecutivePremiumIcon
              icon={FileText}
              state="active"
            />

            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/66">
                Selected artifact
              </div>

              <h3 className="mt-1 text-lg font-semibold text-amber-400">
                {sourceLabel}
              </h3>

              <p className="mt-2 text-sm leading-6 text-sky-500/78">
                Inspected through the {compilerLabel} visual contract.
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 md:grid-cols-2">
            {inspectorSections.map((section) => (
              <div
                key={section.label}
                className="rounded-[16px] border border-cyan-300/18 bg-cyan-300/[0.04] p-3"
              >
                <dt className="text-[10px] uppercase tracking-[0.14em] text-sky-500/62">
                  {section.label}
                </dt>

                <dd className="mt-1 text-xs leading-5 text-sky-200">
                  {section.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[20px] border border-amber-300/24 bg-amber-300/[0.05] p-4">
            <ExecutivePremiumIcon
              icon={ShieldCheck}
              state="warning"
            />
            <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-amber-300/66">
              Authority and approval
            </div>
            <div className="mt-1 text-sm font-semibold text-amber-300">
              Architectural · Human review
            </div>
          </div>

          <div className="rounded-[20px] border border-violet-300/24 bg-violet-300/[0.05] p-4">
            <ExecutivePremiumIcon
              icon={GitBranch}
              state="active"
            />
            <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-violet-300/66">
              Lineage
            </div>
            <div className="mt-1 text-sm font-semibold text-violet-200">
              5 governed stages
            </div>
          </div>

          <div className="rounded-[20px] border border-cyan-300/24 bg-cyan-300/[0.05] p-4">
            <ExecutivePremiumIcon
              icon={Network}
              state="active"
            />
            <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-cyan-300/66">
              Dependencies
            </div>
            <div className="mt-1 text-sm font-semibold text-cyan-200">
              6 governed links
            </div>
          </div>

          <div className="rounded-[20px] border border-emerald-300/24 bg-emerald-300/[0.05] p-4">
            <ExecutivePremiumIcon
              icon={PackageCheck}
              state="healthy"
            />
            <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-emerald-300/66">
              Package posture
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-300">
              Candidate
            </div>
          </div>

          <div className="rounded-[20px] border border-violet-300/24 bg-violet-300/[0.05] p-4">
            <ExecutivePremiumIcon
              icon={MessagesSquare}
              state="active"
            />
            <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-violet-300/66">
              Related conversations
            </div>
            <div className="mt-1 text-sm font-semibold text-violet-200">
              3 governed threads
            </div>
          </div>

          <div className="rounded-[20px] border border-amber-300/24 bg-amber-300/[0.05] p-4">
            <ExecutivePremiumIcon
              icon={BookOpenCheck}
              state="warning"
            />
            <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-amber-300/66">
              Curriculum contribution
            </div>
            <div className="mt-1 text-sm font-semibold text-amber-300">
              Governance Foundations
            </div>
          </div>
        </section>
      </div>
    </LuminaFlagshipPanel>
  );
}
