import type { NextFunction, Request, Response } from "express";

import { getProjectMetadata, type ProjectMetadata } from "../projects/projectMetadataStore.js";
import { canManageProject, canViewProject } from "./runtimeAuthorization.js";
import { getRuntimeCaller, type RuntimeCaller } from "./runtimeCaller.js";

/*
 * F-47 (MS-2026-0011): a project's files, process, logs and status belong
 * to the people who may see it. Before this, only the start and restart
 * routes checked anything, and only that the call came from this machine;
 * reading and writing files, logs, status and stopping were open to every
 * caller for every project. Now each route decides from the verified
 * caller (ADR-0043) and the project's owner:
 *
 * - view (read files, logs, status, live events): canViewProject
 * - manage (write files, start, stop, restart): canManageProject, or
 *   in-house engineers working on a project
 * - staff (process metrics, failure scenarios): engineers and admins
 *
 * A project the caller may not see answers exactly as one that does not
 * exist, so its name is not confirmed to strangers.
 */

export type ProjectAction = "view" | "manage";

export type ProjectAccessDecision =
  | { ok: true }
  | { ok: false; status: number; error: string };

export function decideProjectAccess(
  caller: RuntimeCaller,
  metadata: ProjectMetadata | null,
  action: ProjectAction,
): ProjectAccessDecision {
  if (!canViewProject(caller, metadata)) {
    return { ok: false, status: 404, error: "project_not_found" };
  }
  if (action === "view") return { ok: true };
  if (caller.supportAccess || canManageProject(caller, metadata)) return { ok: true };
  return { ok: false, status: 403, error: "forbidden" };
}

function requestedProjectId(req: Request): string {
  const candidates = [req.params?.projectId, req.query?.projectId, req.body?.projectId];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function callerMayViewProject(caller: RuntimeCaller, projectId: string): boolean {
  return decideProjectAccess(caller, getProjectMetadata(projectId), "view").ok;
}

/*
 * Express middleware. A request without a project id passes through, so
 * the route answers its own missing_projectId; one with an id is decided.
 */
export function requireProjectAccess(action: ProjectAction) {
  return (req: Request, res: Response, next: NextFunction) => {
    const projectId = requestedProjectId(req);
    if (!projectId) return next();
    const decision = decideProjectAccess(getRuntimeCaller(req), getProjectMetadata(projectId), action);
    if (decision.ok) return next();
    return res.status(decision.status).json({ ok: false, error: decision.error, projectId });
  };
}

export function requireStaff(req: Request, res: Response, next: NextFunction) {
  const caller = getRuntimeCaller(req);
  if (caller.supportAccess || caller.adminTools) return next();
  return res.status(403).json({ ok: false, error: "staff_only" });
}
