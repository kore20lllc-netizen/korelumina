import { FolderKanban } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import { cn } from "@/lib/utils";

import { ExecutiveSection, toneDot, tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { relativeTime, scoreTone } from "../../repo-audit/shared/auditPresentation";
import { rememberAuditProject } from "../../repo-audit/state/useRepoAudit";
import { STATE_LABEL, STATE_TONE } from "../../runtime/shared/runtimePresentation";
import { originLabel } from "../shared/projectPresentation";
import type { OriginFilter, ProjectRow, ProjectsView, SortOrder } from "../state/useProjectsView";

/* MS-2026-0011: every project, as Runtime knows it. */

const ORIGINS: { id: OriginFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "imported", label: "Imported" },
  { id: "built", label: "Built here" },
  { id: "unknown", label: "Origin not recorded" },
];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn("rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]", on ? tonePill.active : "border-white/10 text-white/45 hover:text-white/70")}>
      {children}
    </button>
  );
}

function ProjectCard({ row, view }: { row: ProjectRow; view: ProjectsView }) {
  const origin = originLabel(row.origin);
  const report = row.audit?.status === "ok" ? row.audit.data : null;
  return (
    <li>
      <LuminaFlagshipCard as="article" className="h-full rounded-[20px] p-4">
        <div className="relative z-10 flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-sky-50">{row.name}</h3>
              <p className="truncate text-xs text-sky-300/60" title={origin.detail ?? undefined}>
                {origin.label}
                {origin.detail ? ` · ${origin.detail}` : ""}
              </p>
            </div>
            {row.runtime ? (
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill[STATE_TONE[row.runtime]]}`}>
                <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[STATE_TONE[row.runtime]])} />
                {STATE_LABEL[row.runtime]}
              </span>
            ) : null}
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/60">Framework</dt>
              <dd className="mt-0.5 text-sky-100/80">{row.framework ?? "Not detected"}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/60">Updated</dt>
              <dd className="mt-0.5 text-sky-100/80">{row.updatedAt ? relativeTime(row.updatedAt) : "Not recorded"}</dd>
            </div>
            {row.audit ? (
              <div className="col-span-2">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/60">Latest audit</dt>
                <dd className="mt-0.5">
                  {row.audit.status === "loading" ? (
                    <span className="text-sky-300/60">Reading…</span>
                  ) : row.audit.status === "error" ? (
                    <span className={toneText.error}>{row.audit.message}</span>
                  ) : report ? (
                    <span>
                      <span className={`font-semibold ${toneText[scoreTone(report.summary.score)]}`}>
                        Grade {report.summary.grade ?? "not scored"}
                        {report.summary.score !== null ? ` · ${report.summary.score}` : ""}
                      </span>
                      <span className="text-sky-300/60"> · {report.summary.counts.critical} critical · {report.summary.counts.high} high · {relativeTime(report.completedAt)}</span>
                    </span>
                  ) : (
                    <span className="text-sky-300/60">Never audited</span>
                  )}
                  {row.openRepairs > 0 ? <span className="text-amber-200"> · {row.openRepairs} repair{row.openRepairs === 1 ? "" : "s"} open</span> : null}
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-auto flex flex-wrap gap-2">
            <button type="button" onClick={() => view.open(row.id)} className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill.healthy}`}>
              Open
            </button>
            {row.audit ? (
              <button
                type="button"
                onClick={() => {
                  rememberAuditProject(row.id);
                  view.workspace.setView("repo-audit");
                }}
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill.active}`}
              >
                Audit
              </button>
            ) : null}
            <button type="button" onClick={() => view.setExporting({ id: row.id, name: row.name })} className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill.warning}`}>
              Export
            </button>
            <button type="button" onClick={() => view.setDeleting({ id: row.id, name: row.name })} className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50 hover:border-rose-300/30 hover:text-rose-200">
              Delete
            </button>
          </div>
        </div>
      </LuminaFlagshipCard>
    </li>
  );
}

export function ProjectsSection({ view }: { view: ProjectsView }) {
  return (
    <ExecutiveSection id="projects-list" icon={FolderKanban} eyebrow="Projects" title="Everything you build and import" description="Where each project came from, whether it is running, and its latest audit. Open one to work on it." wiring="live">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <input
          value={view.query}
          onChange={(event) => view.setQuery(event.target.value)}
          placeholder="Search projects"
          aria-label="Search projects"
          className="rounded-[14px] border border-cyan-300/25 bg-slate-950/70 px-3 py-2 text-sm text-cyan-50 outline-none placeholder:text-white/30 focus:border-cyan-300/60"
        />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sort">
          {(["recent", "name"] as SortOrder[]).map((order) => (
            <Chip key={order} on={view.sort === order} onClick={() => view.setSort(order)}>
              {order === "recent" ? "Recently updated" : "Name"}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Origin">
        {ORIGINS.map((entry) => (
          <Chip key={entry.id} on={view.origin === entry.id} onClick={() => view.setOrigin(entry.id)}>
            {entry.label}
          </Chip>
        ))}
      </div>
      {view.projects.status === "loading" ? (
        <p className="text-sm text-sky-300/70">Reading your projects…</p>
      ) : view.projects.status === "error" ? (
        <p className={`text-sm ${toneText.error}`}>{view.projects.message}</p>
      ) : view.rows.length === 0 ? (
        <p className="text-sm text-sky-300/70">No projects yet. Start a new one, or import a repository.</p>
      ) : view.shown.length === 0 ? (
        <p className="text-sm text-sky-300/70">No project matches.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {view.shown.map((row) => (
            <ProjectCard key={row.id} row={row} view={view} />
          ))}
        </ul>
      )}
    </ExecutiveSection>
  );
}
