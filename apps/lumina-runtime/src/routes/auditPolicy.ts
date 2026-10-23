import type { Request, Response } from "express";

import { getProjectMetadata, type ProjectMetadata } from "../projects/projectMetadataStore.js";
import { isImportedProject } from "../projects/projectOrigin.js";
import { canManageProject, canViewProject } from "./runtimeAuthorization.js";
import { getRuntimeCaller, type RuntimeCaller } from "./runtimeCaller.js";

/*
 * ADR-0046 (customer diagnosis, in-house repair): one policy for every
 * audit and repair route, decided from the verified caller (ADR-0043) and
 * the project's metadata.
 *
 * - diagnose, read-report: Business and Enterprise, on an imported project
 *   they can view; staff on any project.
 * - deep-audit, repair: staff only (in-house engineers, admins, super
 *   admins). The deep audit runs the project's own code; repair is the fix
 *   plan and turning findings into fixes.
 * - edit (AI Builder drafts): whoever manages the project, and staff.
 */

export type AuditAction = "diagnose" | "read-report" | "deep-audit" | "repair" | "edit";

export type AuditDecision = { ok: true } | { ok: false; status: number; error: string };

const DIAGNOSIS_PLANS = new Set(["business", "enterprise"]);

export function decideAuditAccess(caller: RuntimeCaller, metadata: ProjectMetadata | null, action: AuditAction): AuditDecision {
  if (caller.supportAccess) return { ok: true };
  if (action === "edit") {
    return canManageProject(caller, metadata) ? { ok: true } : { ok: false, status: 403, error: "forbidden" };
  }
  if (action === "deep-audit" || action === "repair") {
    return { ok: false, status: 403, error: "repair_is_done_by_korelumina_engineers" };
  }
  if (!DIAGNOSIS_PLANS.has(caller.role)) {
    return { ok: false, status: 403, error: "diagnosis_requires_business_or_enterprise" };
  }
  if (!canViewProject(caller, metadata)) return { ok: false, status: 403, error: "forbidden" };
  if (!isImportedProject(metadata)) return { ok: false, status: 403, error: "diagnosis_is_for_imported_projects" };
  return { ok: true };
}

/* Answers the refusal and returns false when the caller may not act on the project. */
export function allowAuditAction(req: Request, res: Response, projectId: string, action: AuditAction): boolean {
  const decision = decideAuditAccess(getRuntimeCaller(req), getProjectMetadata(projectId), action);
  if (decision.ok) return true;
  res.status(decision.status).json({ ok: false, error: decision.error, projectId });
  return false;
}
