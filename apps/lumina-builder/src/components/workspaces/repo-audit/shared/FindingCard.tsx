import { useState } from "react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import type { RepositoryFinding } from "@/services/repositoryAuditService";

import { tonePill } from "../../executive/shared/ExecutiveSection";
import { CATEGORY_LABEL, SEVERITY_LABEL, SEVERITY_TONE } from "./auditPresentation";

/* MS-2026-0012: one finding with its evidence and remedy. */

export function FindingCard({ finding, isNew = false }: { finding: RepositoryFinding; isNew?: boolean }) {
  const [open, setOpen] = useState(false);
  const shown = open ? finding.evidence : finding.evidence.slice(0, 3);
  return (
    <LuminaFlagshipCard as="article" className="rounded-[18px] p-4">
      <div className="relative z-10 grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[SEVERITY_TONE[finding.severity]]}`}>
            {SEVERITY_LABEL[finding.severity]}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/60">{CATEGORY_LABEL[finding.category]}</span>
          {isNew ? (
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill.warning}`}>New</span>
          ) : null}
        </div>
        <h3 className="text-sm font-semibold leading-5 text-white/90">{finding.title}</h3>
        <p className="text-xs leading-5 text-sky-300/70">{finding.detail}</p>
        {shown.length > 0 ? (
          <ul className="grid gap-1">
            {shown.map((evidence, index) => (
              <li key={`${evidence.file}:${evidence.line ?? ""}:${index}`} className="min-w-0 rounded-[10px] border border-white/[0.06] bg-slate-950/50 px-3 py-1.5">
                <div className="truncate font-mono text-[11px] text-cyan-100/80">
                  {evidence.file}
                  {evidence.line ? `:${evidence.line}` : ""}
                </div>
                {evidence.excerpt ? <div className="truncate font-mono text-[11px] text-white/50">{evidence.excerpt}</div> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {finding.evidence.length > 3 ? (
          <button type="button" onClick={() => setOpen((value) => !value)} className="justify-self-start text-[11px] font-medium text-cyan-300/80 hover:text-cyan-200">
            {open ? "Show less" : `Show all ${finding.evidence.length} locations`}
          </button>
        ) : null}
        {finding.remedy ? (
          <p className="text-xs leading-5 text-emerald-200/80">
            <span className="font-semibold">Fix: </span>
            {finding.remedy}
          </p>
        ) : null}
      </div>
    </LuminaFlagshipCard>
  );
}

export function FindingList({ findings, newIds, empty }: { findings: RepositoryFinding[]; newIds?: ReadonlySet<string>; empty: string }) {
  const [limit, setLimit] = useState(30);
  if (findings.length === 0) return <p className="text-sm text-emerald-200/80">{empty}</p>;
  return (
    <div className="grid gap-3">
      {findings.slice(0, limit).map((finding) => (
        <FindingCard key={finding.id} finding={finding} isNew={newIds?.has(finding.id)} />
      ))}
      {findings.length > limit ? (
        <button type="button" onClick={() => setLimit((value) => value + 30)} className={`justify-self-start rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill.active}`}>
          Show {Math.min(30, findings.length - limit)} more of {findings.length - limit}
        </button>
      ) : null}
    </div>
  );
}
