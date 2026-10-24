import type { Express, Request, Response } from "express";

import { resolveTextModel } from "../ai/AIOrchestrator.js";
import type { TextGenerationClient } from "../ai/model/index.js";
import { getProjectMetadata, type ProjectMetadata } from "../projects/projectMetadataStore.js";
import { getProjectPath } from "../projects/getProjectPath.js";
import { analyzeWebsiteTarget } from "../transform/websiteAnalysis.js";
import { getBuildJob, startWebsiteBuild } from "../transform/websiteBuild.js";
import { planWebsite, revalidatePages } from "../transform/websitePlan.js";
import { decideProjectAccess } from "./projectAccess.js";
import { getRuntimeCaller, type RuntimeCaller } from "./runtimeCaller.js";

/*
 * MS-2026-0011: Transform App -> Website.
 *
 * Who: the project's manager (or KoreLumina staff), on Pro, Business or
 * Enterprise. The landing page also sells a $49 one-time unlock for Free;
 * until Stripe checkout is wired (MS-2026-0003) Free accounts are told it
 * is not available yet, rather than given it or charged nothing.
 *
 * analysis -> plan (model) -> build job (model, one step per file) -> a
 * draft, applied or undone through the draft routes.
 */

type ModelResolver = () => { client: TextGenerationClient; provider: string; model: string | null } | null;

export type TransformDecision = { ok: true } | { ok: false; status: number; error: string };

export function decideTransformAccess(caller: RuntimeCaller, metadata: ProjectMetadata | null): TransformDecision {
  const project = decideProjectAccess(caller, metadata, "manage");
  if (!project.ok) return project;
  if (caller.supportAccess || caller.role !== "user") return { ok: true };
  return { ok: false, status: 402, error: "transform_requires_pro" };
}

function projectIdFrom(req: Request): string {
  const value = req.query.projectId ?? req.body?.projectId;
  return typeof value === "string" && /^[a-zA-Z0-9._-]+$/.test(value.trim()) ? value.trim() : "";
}

function allow(req: Request, res: Response, projectId: string): boolean {
  if (!projectId) {
    res.status(400).json({ ok: false, error: "missing_projectId" });
    return false;
  }
  const decision = decideTransformAccess(getRuntimeCaller(req), getProjectMetadata(projectId));
  if (decision.ok) return true;
  res.status(decision.status).json({ ok: false, error: decision.error, projectId });
  return false;
}

function failure(res: Response, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return res.status(message === "project_not_supported" ? 422 : 500).json({ ok: false, error: message });
}

export function registerWebsiteTransformRoutes(
  app: Express,
  deps: { model?: ModelResolver } = {},
) {
  const model = deps.model ?? resolveTextModel;

  app.get("/api/runtime/transform/analysis", (req, res) => {
    const projectId = projectIdFrom(req);
    if (!allow(req, res, projectId)) return;
    try {
      const resolved = model();
      return res.json({
        ok: true,
        analysis: analyzeWebsiteTarget(getProjectPath(projectId)),
        ai: resolved ? { provider: resolved.provider, model: resolved.model } : null,
      });
    } catch (error) {
      return failure(res, error, "failed_to_analyze");
    }
  });

  app.post("/api/runtime/transform/plan", async (req, res) => {
    const projectId = projectIdFrom(req);
    if (!allow(req, res, projectId)) return;
    const resolved = model();
    if (!resolved) return res.status(503).json({ ok: false, error: "transform_needs_ai_model" });
    try {
      const projectPath = getProjectPath(projectId);
      const analysis = analyzeWebsiteTarget(projectPath);
      const plan = await planWebsite(analysis, projectPath, resolved.client);
      return res.json({ ok: true, analysis, plan });
    } catch (error) {
      return failure(res, error, "failed_to_plan");
    }
  });

  app.post("/api/runtime/transform/build", (req, res) => {
    const projectId = projectIdFrom(req);
    if (!allow(req, res, projectId)) return;
    const resolved = model();
    if (!resolved) return res.status(503).json({ ok: false, error: "transform_needs_ai_model" });
    try {
      const projectPath = getProjectPath(projectId);
      const analysis = analyzeWebsiteTarget(projectPath);
      if (!analysis.supported) return res.status(422).json({ ok: false, error: "project_not_supported" });
      const { pages, problems } = revalidatePages(req.body?.pages, analysis, projectPath);
      if (problems.length > 0 || pages.length === 0) {
        return res.status(409).json({ ok: false, error: pages.length === 0 ? "no_pages_chosen" : "plan_no_longer_fits", errors: problems });
      }
      const summary = typeof req.body?.summary === "string" ? req.body.summary.slice(0, 800) : "";
      const job = startWebsiteBuild({ projectId, projectPath, analysis, pages, summary, client: resolved.client });
      return res.status(202).json({ ok: true, job });
    } catch (error) {
      return failure(res, error, "failed_to_start_build");
    }
  });

  app.get("/api/runtime/transform/jobs/:jobId", (req, res) => {
    const job = getBuildJob(String(req.params.jobId));
    if (!job) return res.status(404).json({ ok: false, error: "job_not_found" });
    if (!allow(req, res, job.projectId)) return;
    return res.json({ ok: true, job });
  });
}
