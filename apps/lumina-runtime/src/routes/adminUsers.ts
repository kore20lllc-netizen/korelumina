import type { Express, Request, Response } from "express";

import type { RoleAssignmentService, UserDirectory, FileRoleAssignmentLedger } from "../governance/roles/RoleAssignment.js";
import { resolveRuntimeCallerFor } from "./runtimeCaller.js";

/*
 * SEC-1e (ADR-0043 Decision 3): the owner's user directory and staff role
 * assignment. Only a super admin identified by a verified session (or the
 * configured development identity on this machine) may use it.
 */
function requireSuperAdmin(req: Request, res: Response): string | null {
  const resolution = resolveRuntimeCallerFor(req);
  const allowedSource =
    resolution.source === "verified-token" ||
    resolution.source === "development-identity";
  if (!allowedSource || resolution.caller.role !== "super_admin" || !resolution.caller.userId) {
    res.status(403).json({ ok: false, error: "super_admin_required", source: resolution.source });
    return null;
  }
  return resolution.caller.userId;
}

export function registerAdminUserRoutes(
  app: Express,
  dependencies: {
    directory: UserDirectory;
    roles: RoleAssignmentService;
    ledger: FileRoleAssignmentLedger;
  },
): void {
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    if (!requireSuperAdmin(req, res)) return;
    if (!dependencies.directory.configured) {
      return res.status(503).json({ ok: false, error: "user_directory_not_configured" });
    }
    try {
      const users = await dependencies.directory.list();
      return res.json({
        ok: true,
        users: users.map(({ appMetadata: _appMetadata, ...user }) => user),
        assignments: dependencies.ledger.list().slice(-50).reverse(),
      });
    } catch (error) {
      return res.status(502).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/admin/users/:id/role", async (req: Request, res: Response) => {
    const assignedBy = requireSuperAdmin(req, res);
    if (!assignedBy) return;
    try {
      const result = await dependencies.roles.assign({
        userId: String(req.params.id ?? ""),
        role: String(req.body?.role ?? ""),
        reason: String(req.body?.reason ?? ""),
        assignedBy,
      });
      if (!result.ok) return res.status(result.status).json({ ok: false, error: result.error });
      const { appMetadata: _appMetadata, ...user } = result.user;
      return res.json({ ok: true, user, record: result.record });
    } catch (error) {
      return res.status(502).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  });
}
