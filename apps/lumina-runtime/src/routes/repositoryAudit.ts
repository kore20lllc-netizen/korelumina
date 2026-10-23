import { existsSync } from "node:fs";

import type { Express, Request, Response } from "express";

import { getProjectPath } from "../projects/getProjectPath.js";
import { getProjectMetadata } from "../projects/projectMetadataStore.js";
import {
  FileRepositoryIntelligenceStore,
  RepositoryAuditRuns,
  buildFixPlan,
  type AuditMode,
} from "../repository-intelligence/index.js";
import { requireRuntimeAccess } from "./runtimeAccess.js";
import { decideAuditAccess, type AuditAction, type AuditDecision } from "./auditPolicy.js";
import { getRuntimeCaller } from "./runtimeCaller.js";

/*
 * MS-2026-0012: the Repo Audit API. Progress streams as server-sent events.
 *
 * ADR-0046: Business and Enterprise may diagnose their imported projects
 * (start a scan, read reports and progress); the deep audit, which runs
 * the project's own typecheck and build, and the fix plan are in-house.
 */

export interface RepositoryAuditRouteDependencies {
  store: FileRepositoryIntelligenceStore;
  runs: RepositoryAuditRuns;
  /* The project's directory, or null when it does not exist. */
  projectRoot(projectId: string): string | null;
  authorize(req: Request, projectId: string, action: AuditAction): AuditDecision;
}

const PROJECT_ID = /^[a-zA-Z0-9._-]{1,128}$/;

export function defaultRepositoryAuditRouteDependencies(): RepositoryAuditRouteDependencies {
  const store = new FileRepositoryIntelligenceStore();
  return {
    store,
    runs: new RepositoryAuditRuns(store),
    projectRoot: (projectId) => {
      const root = getProjectPath(projectId);
      return existsSync(root) ? root : null;
    },
    authorize: (req, projectId, action) => decideAuditAccess(getRuntimeCaller(req), getProjectMetadata(projectId), action),
  };
}

export function registerRepositoryAuditRoutes(app: Express, dependencies: RepositoryAuditRouteDependencies = defaultRepositoryAuditRouteDependencies()): void {
  const { store, runs } = dependencies;

  /* Validates the project ID and access; answers and returns null when refused. */
  const project = (req: Request, res: Response, projectId: unknown, action: AuditAction): { projectId: string; root: string } | null => {
    if (typeof projectId !== "string" || !PROJECT_ID.test(projectId) || projectId === "." || projectId === "..") {
      res.status(400).json({ ok: false, error: "invalid_projectId" });
      return null;
    }
    const root = dependencies.projectRoot(projectId);
    if (!root) {
      res.status(404).json({ ok: false, error: "project_not_found", projectId });
      return null;
    }
    const decision = dependencies.authorize(req, projectId, action);
    if (!decision.ok) {
      res.status(decision.status).json({ ok: false, error: decision.error, projectId });
      return null;
    }
    return { projectId, root };
  };

  app.post("/api/runtime/repository-audit/runs", requireRuntimeAccess, (req, res) => {
    const mode: AuditMode = req.body?.mode === "deep" ? "deep" : "scan";
    const target = project(req, res, req.body?.projectId, mode === "deep" ? "deep-audit" : "diagnose");
    if (!target) return;
    const running = runs.runningFor(target.projectId);
    if (running) return res.status(409).json({ ok: false, error: "repository_audit_already_running", runId: running.runId });
    const { run, done } = runs.start({ projectId: target.projectId, root: target.root, mode, checkAdvisories: req.body?.checkAdvisories !== false });
    done.catch(() => undefined);
    return res.status(202).json({ ok: true, runId: run.runId, projectId: run.projectId, mode: run.mode });
  });

  app.get("/api/runtime/repository-audit/runs/:runId", requireRuntimeAccess, (req, res) => {
    const run = runs.get(String(req.params.runId));
    if (!run) return res.status(404).json({ ok: false, error: "repository_audit_run_not_found" });
    if (!project(req, res, run.projectId, "read-report")) return;
    return res.json({ ok: true, run });
  });

  app.get("/api/runtime/repository-audit/runs/:runId/events", requireRuntimeAccess, (req, res) => {
    const run = runs.get(String(req.params.runId));
    if (!run) return res.status(404).json({ ok: false, error: "repository_audit_run_not_found" });
    if (!project(req, res, run.projectId, "read-report")) return;
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    let closed = false;
    const unsubscribe = runs.subscribe(run.runId, (event) => {
      if (closed) return;
      res.write(`id: ${event.sequence}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      if (event.type !== "progress") {
        closed = true;
        res.end();
      }
    });
    req.on("close", () => {
      closed = true;
      unsubscribe();
    });
  });

  app.get("/api/runtime/repository-audit/:projectId/latest", requireRuntimeAccess, (req, res) => {
    const target = project(req, res, req.params.projectId, "read-report");
    if (!target) return;
    const report = store.latestReport(target.projectId);
    if (!report) return res.status(404).json({ ok: false, error: "repository_audit_report_not_found" });
    return res.json({ ok: true, report, running: runs.runningFor(target.projectId)?.runId ?? null });
  });

  app.get("/api/runtime/repository-audit/:projectId/reports", requireRuntimeAccess, (req, res) => {
    const target = project(req, res, req.params.projectId, "read-report");
    if (!target) return;
    return res.json({ ok: true, reports: store.listReports(target.projectId) });
  });

  app.get("/api/runtime/repository-audit/:projectId/reports/:reportId", requireRuntimeAccess, (req, res) => {
    const target = project(req, res, req.params.projectId, "read-report");
    if (!target) return;
    const report = store.loadReport(target.projectId, String(req.params.reportId));
    if (!report) return res.status(404).json({ ok: false, error: "repository_audit_report_not_found" });
    return res.json({ ok: true, report });
  });

  app.get("/api/runtime/repository-audit/:projectId/reports/:reportId/fix-plan", requireRuntimeAccess, (req, res) => {
    const target = project(req, res, req.params.projectId, "repair");
    if (!target) return;
    const report = store.loadReport(target.projectId, String(req.params.reportId));
    if (!report) return res.status(404).json({ ok: false, error: "repository_audit_report_not_found" });
    return res.json({ ok: true, reportId: report.reportId, steps: buildFixPlan(report) });
  });
}
