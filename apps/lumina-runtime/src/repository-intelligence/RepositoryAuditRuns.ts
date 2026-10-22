import { randomUUID } from "node:crypto";

import { runRepositoryAudit, type AuditMode, type AuditProgress, type RepositoryAuditReport, type RunRepositoryAuditInput } from "./RepositoryAudit.js";
import type { FileRepositoryIntelligenceStore } from "./RepositoryIntelligenceStore.js";

/*
 * MS-2026-0012: audits in progress. A run keeps every progress event so a
 * viewer who connects late sees the whole run, and one project runs at
 * most one audit at a time. Finished reports are saved to the store.
 */

export type AuditRunStatus = "running" | "completed" | "failed";

export interface AuditRunEvent {
  sequence: number;
  type: "progress" | "completed" | "failed";
  progress?: AuditProgress;
  /* On completion: the report's ID and summary. */
  reportId?: string;
  summary?: RepositoryAuditReport["summary"];
  error?: string;
}

export interface AuditRun {
  runId: string;
  projectId: string;
  mode: AuditMode;
  status: AuditRunStatus;
  startedAt: number;
  completedAt: number | null;
  reportId: string | null;
  error: string | null;
  events: AuditRunEvent[];
}

const KEEP_FINISHED = 50;

export class RepositoryAuditRuns {
  private readonly runs = new Map<string, AuditRun>();
  private readonly listeners = new Map<string, Set<(event: AuditRunEvent) => void>>();

  constructor(
    private readonly store: FileRepositoryIntelligenceStore,
    private readonly execute: (input: RunRepositoryAuditInput) => Promise<RepositoryAuditReport> = runRepositoryAudit,
    private readonly now: () => number = Date.now,
  ) {}

  runningFor(projectId: string): AuditRun | null {
    return [...this.runs.values()].find((run) => run.projectId === projectId && run.status === "running") ?? null;
  }

  get(runId: string): AuditRun | null {
    return this.runs.get(runId) ?? null;
  }

  /* Starts an audit; resolves when it ends. Throws if the project already has one running. */
  start(input: { projectId: string; root: string; mode: AuditMode; checkAdvisories?: boolean }): { run: AuditRun; done: Promise<AuditRun> } {
    if (this.runningFor(input.projectId)) throw new Error("repository_audit_already_running");
    const run: AuditRun = {
      runId: `audit-run:${randomUUID()}`,
      projectId: input.projectId,
      mode: input.mode,
      status: "running",
      startedAt: this.now(),
      completedAt: null,
      reportId: null,
      error: null,
      events: [],
    };
    this.runs.set(run.runId, run);
    this.prune();

    const emit = (event: Omit<AuditRunEvent, "sequence">) => {
      const full = { ...event, sequence: run.events.length + 1 };
      run.events.push(full);
      for (const listener of this.listeners.get(run.runId) ?? []) listener(full);
    };

    const done = (async () => {
      /* Start after the caller has its answer; the audit never runs inside the request. */
      await new Promise((resolve) => setImmediate(resolve));
      try {
        const report = await this.execute({
          projectId: input.projectId,
          root: input.root,
          mode: input.mode,
          checkAdvisories: input.checkAdvisories,
          previous: this.store.latestReport(input.projectId),
          onProgress: (progress) => emit({ type: "progress", progress }),
        });
        this.store.saveReport(report);
        run.status = "completed";
        run.reportId = report.reportId;
        run.completedAt = this.now();
        emit({ type: "completed", reportId: report.reportId, summary: report.summary });
      } catch (error) {
        run.status = "failed";
        run.error = error instanceof Error ? error.message : String(error);
        run.completedAt = this.now();
        emit({ type: "failed", error: run.error });
      } finally {
        this.listeners.delete(run.runId);
      }
      return run;
    })();

    return { run, done };
  }

  /* Delivers every past event, then live ones until the run ends. Returns an unsubscribe function. */
  subscribe(runId: string, listener: (event: AuditRunEvent) => void): () => void {
    const run = this.runs.get(runId);
    if (!run) throw new Error("repository_audit_run_not_found");
    for (const event of run.events) listener(event);
    if (run.status !== "running") return () => {};
    const set = this.listeners.get(runId) ?? new Set();
    set.add(listener);
    this.listeners.set(runId, set);
    return () => set.delete(listener);
  }

  private prune(): void {
    const finished = [...this.runs.values()].filter((run) => run.status !== "running").sort((left, right) => left.startedAt - right.startedAt);
    for (const run of finished.slice(0, Math.max(0, finished.length - KEEP_FINISHED))) this.runs.delete(run.runId);
  }
}

/* Remedies of real findings, most severe first, one step per rule. Nothing here is applied automatically. */
export interface AuditFixStep {
  rule: string;
  category: RepositoryAuditReport["findings"][number]["category"];
  severity: RepositoryAuditReport["findings"][number]["severity"];
  title: string;
  /* Distinct remedies of the step's findings, in finding order. */
  remedies: string[];
  findingIds: string[];
  automated: false;
}

export function buildFixPlan(report: RepositoryAuditReport): AuditFixStep[] {
  const steps = new Map<string, AuditFixStep>();
  for (const finding of report.findings) {
    if (!finding.remedy || finding.severity === "info") continue;
    const step =
      steps.get(finding.rule) ??
      { rule: finding.rule, category: finding.category, severity: finding.severity, title: finding.title, remedies: [], findingIds: [], automated: false as const };
    step.findingIds.push(finding.id);
    if (!step.remedies.includes(finding.remedy)) step.remedies.push(finding.remedy);
    steps.set(finding.rule, step);
  }
  for (const step of steps.values()) {
    if (step.findingIds.length > 1) step.title = `${step.findingIds.length} findings: ${step.rule.split(".").slice(1).join(" ").replace(/-/g, " ")}`;
  }
  return [...steps.values()];
}
