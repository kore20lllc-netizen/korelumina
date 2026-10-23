import { useEffect, useState } from "react";
import { Clock3, Gauge, Radar, ScanSearch, ShieldAlert, Telescope } from "lucide-react";

import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { cn } from "@/lib/utils";
import { exportAuditPdf } from "@/services/repositoryAuditPdf";

import { ClientReportDialog } from "./ClientReportDialog";

import { ExecutiveMetricCard } from "../../knowledge-v3/layout/ExecutiveMetricCard";
import type { ExecutiveRibbonMetric } from "../../knowledge-v3/layout/ExecutiveRibbonProvider";
import type { PreviewTone } from "../../executive/design/executiveDesignPreview";
import { DesignPreviewBadge, toneDot, tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { STAGE_LABEL, relativeTime, scoreTone } from "../shared/auditPresentation";
import { STAGE_ORDER, type RepoAuditState } from "../state/useRepoAudit";

/*
 * MS-2026-0012: the Repo Audit command deck, in the Executive Office deck's
 * materials: what is audited and the controls on the left, the report's
 * headline metrics on the right, the live stages while an audit runs.
 */

function metricsFor(state: RepoAuditState): ExecutiveRibbonMetric[] {
  const report = state.report.status === "ok" ? state.report.data : null;
  const counts = report?.summary.counts;
  const serious = counts ? counts.critical + counts.high : null;
  const covered = report?.summary.categories.filter((category) => category.status === "checked").length ?? null;
  return [
    {
      id: "score",
      label: "Audit Score",
      value: report?.summary.score === null || report?.summary.score === undefined ? "—" : `${report.summary.score} · ${report.summary.grade}`,
      detail: report ? (report.summary.score === null ? "No category could be scored" : "From findings alone, by published weights") : "Run an audit to score this project",
      icon: Gauge,
      accent: "text-amber-300",
      surface: "bg-amber-400/15",
    },
    {
      id: "serious",
      label: "Critical and High",
      value: serious === null ? "—" : String(serious),
      detail: counts ? `${counts.medium} medium · ${counts.low} low · ${counts.info} info` : "Findings that need attention first",
      icon: ShieldAlert,
      accent: "text-rose-300",
      surface: "bg-rose-400/15",
    },
    {
      id: "coverage",
      label: "Fully Checked",
      value: covered === null ? "—" : `${covered} of ${report!.summary.categories.length}`,
      detail: report ? `Last audit ${relativeTime(report.completedAt)} · ${report.mode === "deep" ? "deep" : "scan"}` : "Categories checked by the last audit",
      icon: Clock3,
      accent: "text-cyan-300",
      surface: "bg-cyan-400/15",
    },
  ];
}

function Controls({ state }: { state: RepoAuditState }) {
  const busy = state.running !== null || state.projectId === null;
  const report = state.report.status === "ok" ? state.report.data : null;
  const [exporting, setExporting] = useState<string | null>(null);
  const [clientReport, setClientReport] = useState(false);
  return (
    <div className="mt-6 grid gap-3 rounded-[20px] border border-white/[0.08] bg-slate-950/40 p-4">
      <label className="grid gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Project</span>
        {state.projects.status === "ok" && state.projects.data.length > 0 ? (
          <select
            value={state.projectId ?? ""}
            onChange={(event) => state.selectProject(event.target.value)}
            disabled={state.running !== null}
            className="rounded-[14px] border border-cyan-300/25 bg-slate-950/70 px-3 py-2 text-sm text-cyan-100 outline-none focus:border-cyan-300/60 disabled:opacity-60"
          >
            {state.projects.data.map((project) => (
              <option key={project.projectId} value={project.projectId}>
                {project.projectId}
                {project.framework ? ` · ${project.framework}` : ""}
              </option>
            ))}
          </select>
        ) : (
          <span className={`text-sm ${state.projects.status === "error" ? toneText.error : "text-sky-300/70"}`}>
            {state.projects.status === "loading"
              ? "Reading your projects…"
              : state.projects.status === "error"
                ? state.projects.message
                : "No projects yet. Import one in Imports."}
          </span>
        )}
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => state.run("scan")}
          title="Reads the repository: dependencies, secrets, risky code, environment, architecture and advisories"
          className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60 ${tonePill.active}`}
        >
          {state.running?.mode === "scan" ? "Scanning…" : "Run scan"}
        </button>
        {state.access === "engineer" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => state.run("deep")}
          title="Also runs the project's own typecheck and build. Needs installed dependencies and the right to manage the project."
          className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60 ${tonePill.warning}`}
        >
          {state.running?.mode === "deep" ? "Auditing…" : "Deep audit"}
        </button>
        ) : null}
        <button
          type="button"
          disabled={!report || exporting === "busy"}
          onClick={() => {
            if (!report) return;
            setExporting("busy");
            exportAuditPdf(report)
              .then((fileName) => setExporting(`Saved ${fileName}`))
              .catch((error) => setExporting(`The PDF could not be made: ${error instanceof Error ? error.message : String(error)}`));
          }}
          title="Downloads the latest report as a PDF"
          className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60 ${tonePill.healthy}`}
        >
          {exporting === "busy" ? "Exporting…" : "Export PDF"}
        </button>
        <button
          type="button"
          disabled={!report}
          onClick={() => setClientReport(true)}
          title="Prepare the latest audit as a report to send to a client"
          className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60 ${tonePill.healthy}`}
        >
          Prepare client report
        </button>
      </div>
      {report ? <ClientReportDialog report={report} open={clientReport} onOpenChange={setClientReport} /> : null}
      {exporting && exporting !== "busy" ? <p className="text-xs leading-5 text-sky-200/80" aria-live="polite">{exporting}</p> : null}
      <p className="text-xs leading-5 text-sky-300/60">
        {state.access === "engineer"
          ? "A scan only reads files. The deep audit also runs the project's typecheck and build, without any of Runtime's secrets."
          : "A scan only reads files: it never runs your code. Repairs, and the build checks that run your code, are done by KoreLumina engineers."}
      </p>
      {state.runError ? (
        <p className={`text-xs leading-5 ${toneText.error}`} aria-live="polite">
          {state.runError}
        </p>
      ) : null}
    </div>
  );
}

function Stages({ state }: { state: RepoAuditState }) {
  const running = state.running;
  const report = state.report.status === "ok" ? state.report.data : null;
  return (
    <div className="rounded-[20px] border border-white/[0.08] bg-slate-950/40 p-4">
      <div className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">
        <ExecutivePremiumIcon icon={running ? Radar : Telescope} state={running ? "active" : "healthy"} />
        {running ? "Audit in progress" : report ? "Last audit" : "No audit yet"}
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5" aria-live="polite">
        {STAGE_ORDER.map((stage) => {
          const progress = running?.stages[stage];
          const tone: PreviewTone = !running
            ? report
              ? stage === "build" && report.mode !== "deep"
                ? "warning"
                : "healthy"
              : "active"
            : progress?.state === "completed"
              ? "healthy"
              : progress?.state === "skipped"
                ? "warning"
                : progress?.state === "started"
                  ? "active"
                  : "active";
          const pending = running && !progress;
          return (
            <li
              key={stage}
              title={progress?.message ?? undefined}
              className={cn("flex min-w-0 items-center gap-2 rounded-[12px] border border-white/[0.06] bg-slate-950/40 px-3 py-2", pending && "opacity-45")}
            >
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[tone], progress?.state === "started" && "animate-pulse")} />
              <span className={`truncate text-[11px] font-medium ${toneText[tone]}`}>{STAGE_LABEL[stage]}</span>
            </li>
          );
        })}
      </ol>
      {running ? <AuditProgressBar running={running} /> : null}
    </div>
  );
}

/*
 * The audit's progress, so nobody wonders whether it is stuck: the share of
 * stages finished (a stage under way counts half), what it is doing now,
 * and a clock that keeps moving while the run is alive.
 */
function AuditProgressBar({ running }: { running: NonNullable<RepoAuditState["running"]> }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const stages = STAGE_ORDER.map((stage) => running.stages[stage]?.state);
  const done = stages.filter((state) => state === "completed" || state === "skipped").length;
  const underway = stages.filter((state) => state === "started").length;
  const percent = Math.min(99, Math.round(((done + underway * 0.5) / STAGE_ORDER.length) * 100));
  const latest = Object.values(running.stages).sort((left, right) => (right?.at ?? 0) - (left?.at ?? 0))[0];
  const seconds = Math.max(0, Math.floor((now - running.followedAt) / 1000));
  const elapsed = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <div className="mt-3 grid gap-2" aria-live="polite">
      <div
        role="progressbar"
        aria-label="Audit progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="relative h-2 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-inset ring-cyan-300/15"
      >
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-300 transition-[width] duration-700 ease-out" style={{ width: `${Math.max(4, percent)}%` }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent" style={{ transform: `translateX(${(seconds % 3) * 100}%)`, transition: "transform 1s linear" }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="min-w-0 flex-1 truncate text-sky-300/75">{latest?.message ?? "Starting…"}</span>
        <span className="shrink-0 tabular-nums text-sky-200/80">
          {percent}% · {done} of {STAGE_ORDER.length} steps · {elapsed}
        </span>
      </div>
    </div>
  );
}

export function RepoAuditCommandDeck({ state }: { state: RepoAuditState }) {
  const report = state.report.status === "ok" ? state.report.data : null;
  const tone = scoreTone(report?.summary.score ?? null);
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
            <ExecutivePremiumIcon icon={ScanSearch} state={tone} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/80 backdrop-blur-xl">
                  Repository Intelligence
                </span>
                <DesignPreviewBadge wiring="live" />
              </div>
              <h1 className="mt-3 text-5xl font-black tracking-[-0.045em]">
                <span className="text-gradient-lumina">Repo</span>{" "}
                <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">Audit</span>
              </h1>
            </div>
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-cyan">Is this repository healthy?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            Every finding points at its evidence, the same commit always gives the same report, and anything the audit could not check is said, never assumed.
          </p>
          <Controls state={state} />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {metricsFor(state).map((metric) => (
              <ExecutiveMetricCard key={metric.id} metric={metric} />
            ))}
          </div>
          <Stages state={state} />
        </div>
      </div>
    </header>
  );
}
