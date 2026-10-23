import { Blocks, Boxes, FileWarning, Hammer, History, KeyRound, LayoutDashboard, Network, ShieldCheck, Wrench } from "lucide-react";

import { LuminaSectionNavigator } from "@/components/lumina/workspace/primitives/LuminaSectionNavigator";

import { RepoAuditCommandDeck } from "./layout/RepoAuditCommandDeck";
import {
  ArchitectureSection,
  BuildSection,
  DependenciesSection,
  EnvironmentSection,
  FindingsSection,
  FixPlanSection,
  HistorySection,
  OverviewSection,
  RepairSection,
  SecuritySection,
} from "./sections/RepoAuditSections";
import { useRepoAudit } from "./state/useRepoAudit";

/*
 * MS-2026-0012 and MS-2026-0011: Repo Audit, rebuilt on the Runtime's
 * Repository Intelligence engine in the Knowledge Operations design, with
 * the Executive Office's arrangement: a command deck on top, a sticky
 * section navigator, then flagship sections in a two-column grid.
 */

const SECTIONS = [
  { id: "repo-audit-overview", label: "Overview", icon: LayoutDashboard },
  { id: "repo-audit-findings", label: "Findings", icon: FileWarning },
  { id: "repo-audit-security", label: "Security", icon: ShieldCheck },
  { id: "repo-audit-dependencies", label: "Dependencies", icon: Boxes },
  { id: "repo-audit-build", label: "Build", icon: Hammer },
  { id: "repo-audit-architecture", label: "Architecture", icon: Network },
  { id: "repo-audit-environment", label: "Environment", icon: KeyRound },
  { id: "repo-audit-fix-plan", label: "Fix plan", icon: Blocks },
  { id: "repo-audit-history", label: "History", icon: History },
];

/* ADR-0046: Business and Enterprise diagnose; the fix plan is in-house, so they see how to get a repair instead. */
const DIAGNOSIS_SECTIONS = SECTIONS.map((section) => (section.id === "repo-audit-fix-plan" ? { id: "repo-audit-repair", label: "Repair", icon: Wrench } : section));

export function RepoAuditWorkspace() {
  const state = useRepoAudit();
  return (
    <section aria-label="Repo Audit" className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent text-white">
      <span id="repo-audit-top" />
      <div className="relative z-30 px-6 pt-6">
        <RepoAuditCommandDeck state={state} />
      </div>
      <div className="sticky top-4 z-40 px-6 pt-5">
        <LuminaSectionNavigator items={state.access === "engineer" ? SECTIONS : DIAGNOSIS_SECTIONS} ariaLabel="Repo Audit sections" topTargetId="repo-audit-top" minWidthClassName="min-w-[960px]" gridColumnsClassName="grid-cols-9" />
      </div>
      <main aria-label="Repo Audit canvas" className="relative z-10 grid gap-6 px-6 pb-6 pt-5 xl:grid-cols-2">
        <OverviewSection state={state} />
        <FindingsSection state={state} />
        <SecuritySection state={state} />
        <DependenciesSection state={state} />
        <BuildSection state={state} />
        <ArchitectureSection state={state} />
        <EnvironmentSection state={state} />
        {state.access === "engineer" ? <FixPlanSection state={state} /> : <RepairSection state={state} />}
        <div className="xl:col-span-2">
          <HistorySection state={state} />
        </div>
      </main>
    </section>
  );
}

export default RepoAuditWorkspace;
