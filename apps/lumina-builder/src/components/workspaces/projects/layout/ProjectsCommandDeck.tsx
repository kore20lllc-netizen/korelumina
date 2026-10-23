import { Activity, FolderGit2, FolderKanban, Plus, ShieldCheck } from "lucide-react";

import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { cn } from "@/lib/utils";

import { ExecutiveMetricCard } from "../../knowledge-v3/layout/ExecutiveMetricCard";
import type { ExecutiveRibbonMetric } from "../../knowledge-v3/layout/ExecutiveRibbonProvider";
import { DesignPreviewBadge, tonePill } from "../../executive/shared/ExecutiveSection";
import type { ProjectsView } from "../state/useProjectsView";

/*
 * MS-2026-0011: the Projects command deck, in the Executive Office deck's
 * materials: what to do next on the left, the live counts on the right.
 */

function metricsFor(view: ProjectsView): ExecutiveRibbonMetric[] {
  const total = view.rows.length;
  const imported = view.rows.filter((row) => row.origin.kind === "git" || row.origin.kind === "archive").length;
  const running = view.rows.filter((row) => row.runtime === "running").length;
  const audited = view.rows.filter((row) => row.audit?.status === "ok" && row.audit.data !== null);
  const graded = audited
    .map((row) => (row.audit?.status === "ok" ? row.audit.data : null))
    .filter((report): report is NonNullable<typeof report> => Boolean(report && report.summary.score !== null))
    .sort((left, right) => (left.summary.score ?? 0) - (right.summary.score ?? 0));
  const reading = view.projects.status === "loading";
  const metrics: ExecutiveRibbonMetric[] = [
    {
      id: "projects",
      label: "Projects",
      value: reading ? "—" : String(total),
      detail: view.projects.status === "error" ? "Runtime unreachable" : reading ? "Reading Runtime" : `${imported} imported · ${total - imported} not imported`,
      icon: FolderKanban,
      accent: "text-cyan-300",
      surface: "bg-cyan-400/15",
    },
    {
      id: "running",
      label: "Running",
      value: reading ? "—" : `${running} of ${total}`,
      detail: view.runtime.status === "error" ? "Runtime status unreadable" : "Processes Runtime is running now",
      icon: Activity,
      accent: "text-emerald-300",
      surface: "bg-emerald-400/15",
    },
  ];
  if (view.access) {
    metrics.push({
      id: "audited",
      label: "Audited",
      value: reading ? "—" : `${audited.length}`,
      detail: graded[0] ? `Lowest grade ${graded[0].summary.grade} (${graded[0].summary.score})` : "No scored audit yet",
      icon: ShieldCheck,
      accent: "text-violet-300",
      surface: "bg-violet-400/15",
    });
  }
  return metrics;
}

export function ProjectsCommandDeck({ view }: { view: ProjectsView }) {
  const metrics = metricsFor(view);
  return (
    <header
      className={cn(
        "group relative min-w-0 overflow-hidden",
        "rounded-[30px]",
        "border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20",
        "bg-slate-950/[0.48] backdrop-blur-[44px] backdrop-saturate-[170%]",
        "shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_30px_rgba(37,99,235,.16),0_28px_160px_rgba(0,0,0,.40),inset_0_0_22px_rgba(56,189,248,.05)]",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_8%,rgba(217,119,6,.20),transparent_30%),radial-gradient(circle_at_30%_70%,rgba(124,58,237,.22),transparent_34%),radial-gradient(circle_at_78%_30%,rgba(67,56,202,.16),transparent_32%),radial-gradient(circle_at_95%_90%,rgba(34,211,238,.06),transparent_24%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[7%] top-0 h-px opacity-90 [background:linear-gradient(90deg,transparent_0%,rgba(96,165,250,.10)_12%,rgba(247,215,116,.42)_34%,rgba(255,255,255,.62)_50%,rgba(125,211,252,.28)_69%,rgba(59,130,246,.08)_88%,transparent_100%)]"
      />
      <div className="relative z-10 grid gap-8 px-8 py-8 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start gap-5">
            <ExecutivePremiumIcon icon={FolderKanban} state="active" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/80 backdrop-blur-xl">
                  Workspace
                </span>
                <DesignPreviewBadge wiring="live" />
              </div>
              <h1 className="mt-3 text-5xl font-black tracking-[-0.045em]">
                <span className="text-gradient-lumina">Your</span>{" "}
                <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">Projects</span>
              </h1>
            </div>
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-cyan">What are you working on?</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => view.workspace.setView("entry")} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill.healthy}`}>
              <Plus className="h-3 w-3" /> New project
            </button>
            <button type="button" onClick={() => view.workspace.setImportOpen(true)} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill.active}`}>
              <FolderGit2 className="h-3 w-3" /> Import a repository
            </button>
            {view.access ? (
              <button type="button" onClick={() => view.workspace.setView("repo-audit")} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill.warning}`}>
                <ShieldCheck className="h-3 w-3" /> Repo Audit
              </button>
            ) : null}
          </div>
        </div>
        <div className={cn("grid min-w-0 content-start gap-4", metrics.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {metrics.map((metric) => (
            <ExecutiveMetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>
    </header>
  );
}
