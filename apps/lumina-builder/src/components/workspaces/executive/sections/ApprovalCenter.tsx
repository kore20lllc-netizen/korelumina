import { ShieldCheck } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import { approvals } from "../design/executiveDesignPreview";
import { ExecutiveSection, NotWiredButton } from "../shared/ExecutiveSection";

export function ApprovalCenter() {
  return (
    <ExecutiveSection
      id="executive-approvals"
      icon={ShieldCheck}
      iconState="warning"
      eyebrow="Approval Center"
      title="No high-impact action without you"
      description="Each approval shows its evidence, the Chief Agent's recommendation, risk, expected outcome, and rollback strategy."
    >
      <div className="grid gap-4">
        {approvals.map((approval) => (
          <LuminaFlagshipCard key={approval.id} as="article" className="rounded-[20px] p-4">
            <div className="relative z-10 grid gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">{approval.kind}</div>
                <div className="mt-1 text-base font-semibold text-amber-300">{approval.title}</div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-sky-300/50" title={approval.id}>{approval.id}</div>
              </div>
              <dl className="grid gap-2 text-xs">
                {[
                  ["Recommendation", approval.recommendation],
                  ["Evidence", approval.evidence.join(", ")],
                  ["Risk", approval.risk],
                  ["Expected outcome", approval.outcome],
                  ["Rollback", approval.rollback],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sky-300/60">{label}</dt>
                    <dd className="mt-0.5 break-words text-sky-100/80">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-2">
                <NotWiredButton tone="healthy">Approve</NotWiredButton>
                <NotWiredButton tone="error">Reject</NotWiredButton>
              </div>
            </div>
          </LuminaFlagshipCard>
        ))}
      </div>
    </ExecutiveSection>
  );
}
