import { useMemo, useState } from "react";
import {
  Blocks,
  Boxes,
  FileWarning,
  Hammer,
  History,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Network,
  ShieldCheck,
} from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import type { FindingCategory, FindingSeverity, RepositoryAuditReport } from "@/services/repositoryAuditService";

import { ExecutiveCardHeading, ExecutiveSection, ExecutiveTile, tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { CATEGORY_LABEL, SEVERITIES, SEVERITY_LABEL, SEVERITY_TONE, categoryTone, formatBytes, relativeTime, scoreTone } from "../shared/auditPresentation";
import { FindingList } from "../shared/FindingCard";
import { ReportGate } from "../shared/ReportGate";
import type { RepoAuditState } from "../state/useRepoAudit";

/* MS-2026-0012: the Repo Audit sections, each a Knowledge Operations flagship panel reading the real report. */

const newIdsOf = (report: RepositoryAuditReport) => new Set(report.comparison?.newFindings ?? []);
const ofCategory = (report: RepositoryAuditReport, category: FindingCategory) => report.findings.filter((finding) => finding.category === category);

function Note({ children, tone = "active" }: { children: React.ReactNode; tone?: keyof typeof toneText }) {
  return <p className={`text-xs leading-5 ${tone === "active" ? "text-sky-300/70" : toneText[tone]}`}>{children}</p>;
}

export function OverviewSection({ state }: { state: RepoAuditState }) {
  return (
    <ExecutiveSection id="repo-audit-overview" icon={LayoutDashboard} eyebrow="Overview" title="Scores by category" description="Each category starts at 100 and loses points per finding. A category the audit could not check is shown as such, never as passing." wiring="live">
      <ReportGate report={state.report}>
        {(report) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {report.summary.categories.map((category) => (
                <ExecutiveTile
                  key={category.category}
                  label={CATEGORY_LABEL[category.category]}
                  value={category.status === "not-checked" ? "Not checked" : `${category.score}${category.status === "partial" ? " · partial" : ""}`}
                  detail={category.notes[0] ?? `${category.findings} finding${category.findings === 1 ? "" : "s"}`}
                  tone={categoryTone(category)}
                />
              ))}
            </div>
            <LuminaFlagshipCard as="article" className="rounded-[18px] p-4">
              <div className="relative z-10 grid gap-2 text-xs leading-5 text-sky-300/70">
                <ExecutiveCardHeading icon={ListChecks} tone="active">Coverage</ExecutiveCardHeading>
                <div>{report.manifest.inventory.totalFiles} files ({formatBytes(report.manifest.inventory.totalBytes)}) at {report.manifest.commit ? report.manifest.commit.slice(0, 8) : "an uncommitted state"}.</div>
                <div>Secrets checked in {report.coverage.filesScannedForSecrets} files, risky code in {report.coverage.filesScannedForCode}.</div>
                <div>Lockfiles checked: {report.coverage.lockfilesChecked.join(", ") || "none"}.</div>
                <div>
                  Advisories:{" "}
                  {report.coverage.advisories.status === "checked"
                    ? `checked with ${report.coverage.advisories.source} ${relativeTime(report.coverage.advisories.checkedAt)}`
                    : `not checked (${report.coverage.advisories.reason})`}
                  .
                </div>
                <div>
                  Languages: {report.manifest.inventory.languages.slice(0, 5).map((language) => `${language.language} ${language.files}`).join(" · ")}.
                </div>
              </div>
            </LuminaFlagshipCard>
          </>
        )}
      </ReportGate>
    </ExecutiveSection>
  );
}

export function FindingsSection({ state }: { state: RepoAuditState }) {
  const [severities, setSeverities] = useState<ReadonlySet<FindingSeverity>>(new Set(["critical", "high", "medium"]));
  return (
    <ExecutiveSection id="repo-audit-findings" icon={FileWarning} eyebrow="Findings" title="Everything the audit found" description="Most severe first. Each finding names its file and line, or the package.json entry it comes from." wiring="live">
      <ReportGate report={state.report}>
        {(report) => {
          const shown = report.findings.filter((finding) => severities.has(finding.severity));
          return (
            <>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Severities shown">
                {SEVERITIES.map((severity) => {
                  const on = severities.has(severity);
                  return (
                    <button
                      key={severity}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setSeverities((current) => {
                          const next = new Set(current);
                          if (next.has(severity)) next.delete(severity);
                          else next.add(severity);
                          return next;
                        })
                      }
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${on ? tonePill[SEVERITY_TONE[severity]] : "border-white/10 text-white/45"}`}
                    >
                      {SEVERITY_LABEL[severity]} · {report.summary.counts[severity]}
                    </button>
                  );
                })}
              </div>
              <FindingList findings={shown} newIds={newIdsOf(report)} empty="No findings at the selected severities." />
            </>
          );
        }}
      </ReportGate>
    </ExecutiveSection>
  );
}

export function SecuritySection({ state }: { state: RepoAuditState }) {
  return (
    <ExecutiveSection id="repo-audit-security" icon={ShieldCheck} eyebrow="Security" title="Secrets, risky code and advisories" description="Credentials are reported by file, line and kind, never by value. Advisories come from the package manager's own audit." wiring="live">
      <ReportGate report={state.report}>
        {(report) => (
          <>
            {report.coverage.advisories.status === "checked" ? (
              <Note tone="healthy">Advisories checked with {report.coverage.advisories.source} {relativeTime(report.coverage.advisories.checkedAt)}.</Note>
            ) : (
              <Note tone="warning">Advisories were not checked: {report.coverage.advisories.reason}. Security is partial until they are.</Note>
            )}
            <FindingList findings={ofCategory(report, "security")} newIds={newIdsOf(report)} empty="No security findings." />
          </>
        )}
      </ReportGate>
    </ExecutiveSection>
  );
}

export function DependenciesSection({ state }: { state: RepoAuditState }) {
  return (
    <ExecutiveSection id="repo-audit-dependencies" icon={Boxes} eyebrow="Dependencies" title="Packages, frameworks and lockfiles" description="Read from the code: what is imported, what is declared, and whether the lockfile matches." wiring="live">
      <ReportGate report={state.report}>
        {(report) => {
          const inventory = report.manifest.inventory;
          return (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <ExecutiveTile
                  label="Package manager"
                  value={inventory.packageManager.manager ?? "None"}
                  detail={inventory.packageManager.lockfiles.join(", ") || "No lockfile"}
                  tone={inventory.packageManager.conflicting || inventory.packageManager.lockfiles.length === 0 ? "warning" : "healthy"}
                />
                <ExecutiveTile label="Packages" value={String(inventory.packages.length)} detail={inventory.packages.map((entry) => entry.name ?? entry.directory).slice(0, 4).join(", ")} tone="active" />
              </div>
              <div className="grid gap-2">
                {inventory.packages.map((entry) => (
                  <div key={entry.directory} className="rounded-[12px] border border-white/[0.06] bg-slate-950/40 px-3 py-2 text-xs leading-5 text-sky-300/70">
                    <span className="font-semibold text-white/85">{entry.name ?? entry.directory}</span>
                    <span className="text-white/40"> · {entry.directory}</span>
                    <div>
                      {entry.frameworks.map((framework) => `${framework.name} ${framework.version ?? ""}`.trim()).join(", ") || "No framework"}
                      {entry.tooling.length > 0 ? ` · ${entry.tooling.join(", ")}` : ""}
                    </div>
                  </div>
                ))}
              </div>
              <FindingList findings={ofCategory(report, "dependency")} newIds={newIdsOf(report)} empty="No dependency findings." />
            </>
          );
        }}
      </ReportGate>
    </ExecutiveSection>
  );
}

export function BuildSection({ state }: { state: RepoAuditState }) {
  return (
    <ExecutiveSection id="repo-audit-build" icon={Hammer} eyebrow="Build health" title="Typecheck and build" description="The deep audit runs the project's own TypeScript and build script. A check that could not run says why." wiring="live">
      <ReportGate report={state.report}>
        {(report) =>
          report.mode !== "deep" ? (
            <Note tone="warning">This report is a scan. Run a deep audit to typecheck and build the project.</Note>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {report.coverage.build.map((check) => (
                  <ExecutiveTile
                    key={`${check.packageDirectory}:${check.check}`}
                    label={`${check.packageDirectory === "." ? "Project" : check.packageDirectory} · ${check.check}`}
                    value={check.status === "failed" ? `Failed${check.check === "typecheck" ? ` · ${check.errorCount}` : ""}` : check.status[0]!.toUpperCase() + check.status.slice(1)}
                    detail={check.reason ?? check.command ?? undefined}
                    tone={check.status === "passed" ? "healthy" : check.status === "failed" ? "error" : "warning"}
                  />
                ))}
              </div>
              <FindingList findings={ofCategory(report, "build")} newIds={newIdsOf(report)} empty="The project typechecks and builds." />
            </>
          )
        }
      </ReportGate>
    </ExecutiveSection>
  );
}

export function ArchitectureSection({ state }: { state: RepoAuditState }) {
  return (
    <ExecutiveSection id="repo-audit-architecture" icon={Network} eyebrow="Architecture" title="How the code is connected" description="Imports resolved like TypeScript and bundlers resolve them: broken imports, load-time cycles and files nothing loads." wiring="live">
      <ReportGate report={state.report}>
        {(report) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <ExecutiveTile label="Modules" value={String(report.architecture.modules)} detail={`${report.architecture.imports} imports · ${report.architecture.entryPoints} entry points`} tone="active" />
              <ExecutiveTile label="Import cycles" value={String(report.architecture.cycles)} detail="Type-only and lazy imports excluded" tone={report.architecture.cycles === 0 ? "healthy" : "warning"} />
              <ExecutiveTile label="Never loaded" value={String(report.architecture.unreachableFiles)} detail="Files no entry point, route, script, test or config reaches" tone={report.architecture.unreachableFiles === 0 ? "healthy" : "warning"} />
              <ExecutiveTile
                label="Package links"
                value={String(Object.values(report.architecture.packageGraph).reduce((sum, targets) => sum + targets.length, 0))}
                detail={Object.entries(report.architecture.packageGraph).map(([from, to]) => `${from} → ${to.join(", ")}`).join(" · ") || "No workspace package imports another"}
                tone="active"
              />
            </div>
            <FindingList findings={ofCategory(report, "architecture")} newIds={newIdsOf(report)} empty="No architecture findings." />
          </>
        )}
      </ReportGate>
    </ExecutiveSection>
  );
}

export function EnvironmentSection({ state }: { state: RepoAuditState }) {
  return (
    <ExecutiveSection id="repo-audit-environment" icon={KeyRound} eyebrow="Environment" title="Variables the code reads" description="Compared by name with the project's example files. Values are never read into the report." wiring="live">
      <ReportGate report={state.report}>
        {(report) => (
          <>
            {report.environmentVariables.length === 0 ? (
              <Note>The code reads no environment variables.</Note>
            ) : (
              <div className="grid gap-1.5">
                {report.environmentVariables.map((variable) => (
                  <div key={`${variable.packageDirectory}:${variable.name}`} className="flex min-w-0 items-center justify-between gap-3 rounded-[10px] border border-white/[0.06] bg-slate-950/40 px-3 py-1.5">
                    <span className="truncate font-mono text-[11px] text-cyan-100/85">{variable.name}</span>
                    <span className="flex shrink-0 gap-1.5">
                      {variable.public ? <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${tonePill.warning}`}>Browser</span> : null}
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${variable.documented ? tonePill.healthy : tonePill.active}`}>
                        {variable.documented ? "Documented" : "Undocumented"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
            <FindingList findings={ofCategory(report, "environment")} newIds={newIdsOf(report)} empty="No environment findings." />
          </>
        )}
      </ReportGate>
    </ExecutiveSection>
  );
}

export function FixPlanSection({ state }: { state: RepoAuditState }) {
  return (
    <ExecutiveSection id="repo-audit-fix-plan" icon={Blocks} eyebrow="Fix plan" title="What to fix, in order" description="The remedies of the real findings, grouped by rule, most severe first. Nothing here is applied automatically." wiring="live">
      <ReportGate report={state.report}>
        {() =>
          state.fixPlan.status === "loading" ? (
            <Note>Reading the fix plan…</Note>
          ) : state.fixPlan.status === "error" ? (
            <Note tone="error">{state.fixPlan.message}</Note>
          ) : state.fixPlan.data.length === 0 ? (
            <Note tone="healthy">Nothing to fix.</Note>
          ) : (
            <ol className="grid gap-3">
              {state.fixPlan.data.map((step, index) => (
                <LuminaFlagshipCard key={step.rule} as="article" className="rounded-[18px] p-4">
                  <div className="relative z-10 grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-white/50">{index + 1}.</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[SEVERITY_TONE[step.severity]]}`}>{SEVERITY_LABEL[step.severity]}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/60">{CATEGORY_LABEL[step.category]}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white/90">{step.title}</h3>
                    <ul className="grid gap-1 text-xs leading-5 text-emerald-200/80">
                      {step.remedies.slice(0, 6).map((remedy) => (
                        <li key={remedy}>{remedy}</li>
                      ))}
                      {step.remedies.length > 6 ? <li className="text-sky-300/60">and {step.remedies.length - 6} more</li> : null}
                    </ul>
                  </div>
                </LuminaFlagshipCard>
              ))}
            </ol>
          )
        }
      </ReportGate>
    </ExecutiveSection>
  );
}

export function HistorySection({ state }: { state: RepoAuditState }) {
  const history = state.history;
  const rows = useMemo(() => (history.status === "ok" ? history.data : []), [history]);
  return (
    <ExecutiveSection id="repo-audit-history" icon={History} eyebrow="History" title="Every audit of this project" description="Newest first, with the findings each audit added and resolved compared with the one before." wiring="live">
      {history.status === "loading" ? (
        <Note>Reading the history…</Note>
      ) : history.status === "error" ? (
        <Note tone="error">{history.message}</Note>
      ) : rows.length === 0 ? (
        <Note>No audits yet.</Note>
      ) : (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.reportId} className="flex min-w-0 items-center justify-between gap-3 rounded-[12px] border border-white/[0.06] bg-slate-950/40 px-3 py-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white/85">
                  {new Date(row.completedAt).toLocaleString()} · {row.mode === "deep" ? "Deep audit" : "Scan"}
                </div>
                <div className="text-[11px] text-sky-300/60">
                  {row.comparison ? `${row.comparison.newFindings.length} new · ${row.comparison.resolvedFindings.length} resolved` : "First audit"}
                </div>
              </div>
              <span className={`shrink-0 text-sm font-semibold ${toneText[scoreTone(row.summary.score)]}`}>
                {row.summary.score === null ? "—" : `${row.summary.score} · ${row.summary.grade}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </ExecutiveSection>
  );
}
