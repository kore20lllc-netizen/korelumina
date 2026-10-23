import { getCurrentRole, type WorkspaceRole } from "@/services/workspaceAccessService";

/*
 * ADR-0046: what Repo Audit offers the person signed in. Runtime decides
 * every request; this only shapes what the Builder shows.
 * - engineer: in-house developers, admins and super admins: everything.
 * - diagnosis: Business and Enterprise: scans and reports of imported
 *   projects; repairs are done by KoreLumina engineers.
 */
export type RepoAuditAccess = "engineer" | "diagnosis" | null;

export function repoAuditAccess(role: WorkspaceRole = getCurrentRole()): RepoAuditAccess {
  if (role === "inhouse-dev" || role === "admin" || role === "super_admin") return "engineer";
  if (role === "business" || role === "enterprise") return "diagnosis";
  return null;
}
