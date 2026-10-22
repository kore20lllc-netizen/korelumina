import { RUNTIME_API, getRuntimeCallerHeaders } from "@/services/runtime/client";

/*
 * MS-2026-0012: Repo Audit reads only the Runtime's Repository
 * Intelligence engine (/api/runtime/repository-audit). There is no sample
 * report and no simulated progress: when Runtime cannot be reached, calls
 * fail and the workspace says so.
 *
 * Types mirror apps/lumina-runtime/src/repository-intelligence.
 */

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";
export type FindingCategory = "dependency" | "security" | "build" | "environment" | "architecture" | "quality";
export type AuditMode = "scan" | "deep";
export type AuditStage =
  | "snapshot"
  | "inventory"
  | "dependencies"
  | "secrets"
  | "code"
  | "environment"
  | "architecture"
  | "advisories"
  | "build"
  | "report";

export interface FindingEvidence {
  file: string;
  line?: number;
  excerpt?: string;
}

export interface RepositoryFinding {
  id: string;
  rule: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  detail: string;
  packageDirectory: string | null;
  evidence: FindingEvidence[];
  remedy: string | null;
}

export interface CategoryScore {
  category: FindingCategory;
  status: "checked" | "partial" | "not-checked";
  score: number | null;
  findings: number;
  notes: string[];
}

export interface AuditSummary {
  score: number | null;
  grade: "A" | "B" | "C" | "D" | "F" | null;
  counts: Record<FindingSeverity, number>;
  categories: CategoryScore[];
}

export interface BuildCheck {
  packageDirectory: string;
  check: "typecheck" | "build";
  status: "passed" | "failed" | "skipped" | "unavailable";
  reason: string | null;
  command: string | null;
  durationMs: number;
  errorCount: number;
}

export interface WorkspacePackage {
  directory: string;
  name: string | null;
  frameworks: { id: string; name: string; version: string | null }[];
  tooling: string[];
  entryPoints: string[];
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export interface RepositoryAuditReport {
  reportId: string;
  projectId: string;
  mode: AuditMode;
  startedAt: number;
  completedAt: number;
  manifest: {
    manifestId: string;
    commit: string | null;
    inventory: {
      totalFiles: number;
      totalBytes: number;
      languages: { language: string; files: number; bytes: number; lines: number }[];
      packageManager: { manager: string | null; lockfiles: string[]; conflicting: boolean };
      packages: WorkspacePackage[];
    };
  };
  summary: AuditSummary;
  coverage: {
    filesScannedForSecrets: number;
    filesScannedForCode: number;
    lockfilesChecked: string[];
    advisories: { status: "checked" | "unavailable"; source: string | null; reason: string | null; checkedAt: number; counts: Record<FindingSeverity, number> };
    build: BuildCheck[];
  };
  architecture: {
    modules: number;
    imports: number;
    entryPoints: number;
    cycles: number;
    unreachableFiles: number;
    packageGraph: Record<string, string[]>;
  };
  environmentVariables: { name: string; packageDirectory: string; public: boolean; documented: boolean }[];
  findings: RepositoryFinding[];
  comparison: { previousReportId: string; newFindings: string[]; resolvedFindings: string[] } | null;
}

export type ReportSummary = Pick<RepositoryAuditReport, "reportId" | "mode" | "startedAt" | "completedAt" | "summary" | "comparison">;

export interface AuditProgress {
  stage: AuditStage;
  state: "started" | "completed" | "skipped";
  message: string;
  at: number;
}

export interface AuditRunEvent {
  sequence: number;
  type: "progress" | "completed" | "failed";
  progress?: AuditProgress;
  reportId?: string;
  summary?: AuditSummary;
  error?: string;
}

export interface AuditFixStep {
  rule: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  remedies: string[];
  findingIds: string[];
  automated: false;
}

const BASE = "/api/runtime/repository-audit";

async function request<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<{ status: number; body: T & { ok?: boolean; error?: string } }> {
  let response: Response;
  try {
    response = await fetch(`${RUNTIME_API}${path}`, {
      method: init?.method ?? "GET",
      cache: "no-store",
      headers: getRuntimeCallerHeaders(init?.body === undefined ? undefined : { "Content-Type": "application/json" }),
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new Error("Runtime could not be reached. Start it with npm run dev.");
  }
  let body: T & { ok?: boolean; error?: string };
  try {
    body = (await response.json()) as T & { ok?: boolean; error?: string };
  } catch {
    throw new Error(`Runtime answered ${response.status} without a readable body.`);
  }
  return { status: response.status, body };
}

const MESSAGES: Record<string, string> = {
  forbidden: "You do not have access to this project.",
  project_not_found: "This project no longer exists in Runtime.",
  invalid_projectId: "That is not a valid project.",
  repository_audit_already_running: "An audit of this project is already running.",
};

function failure(status: number, error: string | undefined): Error {
  return new Error(MESSAGES[error ?? ""] ?? error ?? `Runtime answered ${status}.`);
}

/* The latest report, or null when the project has never been audited. */
export async function getLatestAudit(projectId: string): Promise<{ report: RepositoryAuditReport | null; runningRunId: string | null }> {
  const { status, body } = await request<{ report: RepositoryAuditReport; running: string | null }>(`${BASE}/${encodeURIComponent(projectId)}/latest`);
  if (status === 404 && body.error === "repository_audit_report_not_found") return { report: null, runningRunId: null };
  if (status !== 200 || !body.ok) throw failure(status, body.error);
  return { report: body.report, runningRunId: body.running };
}

export async function getAuditReport(projectId: string, reportId: string): Promise<RepositoryAuditReport> {
  const { status, body } = await request<{ report: RepositoryAuditReport }>(`${BASE}/${encodeURIComponent(projectId)}/reports/${encodeURIComponent(reportId)}`);
  if (status !== 200 || !body.ok) throw failure(status, body.error);
  return body.report;
}

export async function listAuditReports(projectId: string): Promise<ReportSummary[]> {
  const { status, body } = await request<{ reports: ReportSummary[] }>(`${BASE}/${encodeURIComponent(projectId)}/reports`);
  if (status !== 200 || !body.ok) throw failure(status, body.error);
  return body.reports;
}

export async function getFixPlan(projectId: string, reportId: string): Promise<AuditFixStep[]> {
  const { status, body } = await request<{ steps: AuditFixStep[] }>(`${BASE}/${encodeURIComponent(projectId)}/reports/${encodeURIComponent(reportId)}/fix-plan`);
  if (status !== 200 || !body.ok) throw failure(status, body.error);
  return body.steps;
}

/* Starts an audit; resolves with its run ID. An audit already running for the project is returned instead. */
export async function startAudit(projectId: string, mode: AuditMode): Promise<string> {
  const { status, body } = await request<{ runId: string }>(`${BASE}/runs`, { method: "POST", body: { projectId, mode } });
  if (status === 409 && body.runId) return body.runId;
  if (status !== 202 || !body.ok) throw failure(status, body.error);
  return body.runId;
}

/*
 * Follows a run's progress until it completes or fails. Uses fetch rather
 * than EventSource so the caller's sign-in headers reach Runtime.
 */
export async function followAudit(runId: string, onEvent: (event: AuditRunEvent) => void, signal?: AbortSignal): Promise<AuditRunEvent> {
  let response: Response;
  try {
    response = await fetch(`${RUNTIME_API}${BASE}/runs/${encodeURIComponent(runId)}/events`, { headers: getRuntimeCallerHeaders(), signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Runtime could not be reached. Start it with npm run dev.");
  }
  if (!response.ok || !response.body) {
    let error: string | undefined;
    try {
      error = ((await response.json()) as { error?: string }).error;
    } catch {
      error = undefined;
    }
    throw failure(response.status, error);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let last: AuditRunEvent | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const data = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");
      if (!data) continue;
      const event = JSON.parse(data) as AuditRunEvent;
      last = event;
      onEvent(event);
    }
  }
  if (!last || last.type === "progress") throw new Error("The audit stream ended before the audit finished.");
  return last;
}
