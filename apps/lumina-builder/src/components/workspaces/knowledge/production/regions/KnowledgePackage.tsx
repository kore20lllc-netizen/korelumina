import {
  BookOpenCheck,
  Box,
  CheckCircle2,
  GitBranch,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  FlagshipPanel,
} from "../../learning/presentation/FlagshipPanel";

export function KnowledgePackage() {
  return (
    <FlagshipPanel
      title="Knowledge Package"
      description="Visual contract for package identity, lifecycle, confidence, authority, provenance, dependencies and educational contribution."
    >
      <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <section className="rounded-[22px] border border-emerald-300/30 bg-emerald-300/[0.04] p-5">
          <div className="flex items-start gap-3">
            <ExecutivePremiumIcon
              icon={PackageCheck}
              state="healthy"
            />

            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-300/68">
                Package candidate
              </div>
              <h3 className="mt-1 text-lg font-semibold text-amber-400">
                KPKG-GOVERNANCE-FOUNDATIONS-001
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-500/78">
                Governed package candidate combining constitutional documentation,
                architectural decisions and conversation-derived educational evidence.
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] border border-emerald-300/18 bg-slate-950/24 p-3">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-sky-500/62">
                Lifecycle
              </dt>
              <dd className="mt-1 text-sm font-semibold text-emerald-300">
                Candidate
              </dd>
            </div>

            <div className="rounded-[16px] border border-cyan-300/18 bg-slate-950/24 p-3">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-sky-500/62">
                Confidence
              </dt>
              <dd className="mt-1 text-sm font-semibold text-cyan-200">
                94%
              </dd>
            </div>

            <div className="rounded-[16px] border border-amber-300/18 bg-slate-950/24 p-3">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-sky-500/62">
                Authority
              </dt>
              <dd className="mt-1 text-sm font-semibold text-amber-300">
                Architectural
              </dd>
            </div>

            <div className="rounded-[16px] border border-violet-300/18 bg-slate-950/24 p-3">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-sky-500/62">
                Provenance
              </dt>
              <dd className="mt-1 text-sm font-semibold text-violet-200">
                Certified mixed-source corpus
              </dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[20px] border border-cyan-300/24 bg-cyan-300/[0.05] p-4">
            <ExecutivePremiumIcon
              icon={ShieldCheck}
              state="healthy"
            />
            <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-cyan-300/66">
              Validation
            </div>
            <div className="mt-1 text-sm font-semibold text-cyan-200">
              4 passed · 2 review
            </div>
          </div>

          <div className="rounded-[20px] border border-violet-300/24 bg-violet-300/[0.05] p-4">
            <ExecutivePremiumIcon
              icon={GitBranch}
              state="active"
            />
            <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-violet-300/66">
              Dependencies
            </div>
            <div className="mt-1 text-sm font-semibold text-violet-200">
              6 governed links
            </div>
          </div>

          <div className="rounded-[20px] border border-amber-300/24 bg-amber-300/[0.05] p-4">
            <ExecutivePremiumIcon
              icon={BookOpenCheck}
              state="warning"
            />
            <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-amber-300/66">
              Educational contribution
            </div>
            <div className="mt-1 text-sm font-semibold text-amber-300">
              Governance Foundations
            </div>
          </div>

          <div className="rounded-[20px] border border-emerald-300/24 bg-emerald-300/[0.05] p-4">
            <ExecutivePremiumIcon
              icon={CheckCircle2}
              state="healthy"
            />
            <div className="mt-3 text-[10px] uppercase tracking-[0.15em] text-emerald-300/66">
              Canonical posture
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-300">
              Ready for review
            </div>
          </div>
        </section>
      </div>

      <div className="flex items-center gap-3 border-t border-emerald-300/16 p-5 text-xs text-sky-400/76">
        <Box className="h-4 w-4 text-emerald-300" />
        Package generation is not implemented. This surface represents the approved UI contract only.
      </div>
    </FlagshipPanel>
  );
}
