import { lstatSync } from "node:fs";
import path from "node:path";
import type { Express } from "express";
import { getProjectPath } from "../projects/getProjectPath.js";
import { getProjectMetadata, type ProjectMetadata } from "../projects/projectMetadataStore.js";
import { getProjectsRoot } from "../projects/workspacePaths.js";
import { takeRepositorySnapshotAsync, type RepositorySnapshot } from "../repository-intelligence/RepositorySnapshot.js";
import { analyzeMobileCompatibility } from "../mobile/analyzeMobileCompatibility.js";
import { MobileCompatibilityInputError } from "../mobile/MobileCompatibility.js";
import { decideProjectAccess } from "./projectAccess.js";
import { resolveRuntimeCallerFor } from "./runtimeCaller.js";

export interface MobileCompatibilityRouteDependencies {
  metadata(projectId: string): ProjectMetadata | null;
  projectRoot(projectId: string): string;
  snapshot(root: string): Promise<RepositorySnapshot>;
}

export const mobileCompatibilityRouteDependencies: MobileCompatibilityRouteDependencies = {
  metadata: getProjectMetadata,
  projectRoot: projectId => {
    // A project-directory alias must not expose a different project's repository.
    const entry = path.join(getProjectsRoot(), projectId);
    if (lstatSync(entry).isSymbolicLink()) throw new Error("unsafe_project_root");
    return getProjectPath(projectId);
  },
  snapshot: takeRepositorySnapshotAsync,
};

/** Read-only static evidence; no build, audit run, job, or report persistence. */
export function registerMobileCompatibilityRoute(
  app: Express,
  dependencies: MobileCompatibilityRouteDependencies = mobileCompatibilityRouteDependencies,
): void {
  app.get("/api/runtime/mobile/:projectId/compatibility", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const identity = resolveRuntimeCallerFor(req);
    if (!identity.caller.userId || !["verified-token", "internal-token"].includes(identity.source)) {
      return res.status(401).json({ ok: false, error: "authentication_required" });
    }
    const projectId = req.params.projectId;
    if (typeof projectId !== "string" || !/^[a-zA-Z0-9._-]{1,128}$/.test(projectId) || projectId === "." || projectId === "..") {
      return res.status(400).json({ ok: false, error: "invalid_projectId" });
    }
    const applicationRoot = req.query.applicationRoot;
    if (Object.keys(req.query).some(key => key !== "applicationRoot") || (applicationRoot !== undefined &&
      (typeof applicationRoot !== "string" || applicationRoot.length > 4096 || !applicationRoot ||
        (applicationRoot !== "." && (/[\\\x00-\x1f\x7f:%]/.test(applicationRoot) ||
          applicationRoot.split("/").some(part => !part || part === "." || part === "..")))))) {
      return res.status(400).json({ ok: false, error: "invalid_applicationRoot" });
    }
    try {
      const decision = decideProjectAccess(identity.caller, dependencies.metadata(projectId), "view");
      if (!decision.ok) return res.status(decision.status).json({ ok: false, error: decision.error });
      let root: string;
      try { root = dependencies.projectRoot(projectId); }
      catch { return res.status(404).json({ ok: false, error: "project_not_found" }); }
      const snapshot = await dependencies.snapshot(root);
      const report = analyzeMobileCompatibility(snapshot, applicationRoot === undefined ? {} : { applicationRoot });
      if (report.selection !== "selected") {
        const ambiguous = report.blockers.some(blocker => blocker.code === "ambiguous-application-root");
        return res.status(ambiguous ? 409 : 422).json({ ok: false,
          error: ambiguous ? "ambiguous_application_root" : "application_root_not_found", projectId, report });
      }
      return res.json({ ok: true, projectId, report });
    } catch (error) {
      // Never serialize exceptions, source text, absolute paths, or credentials.
      if (error instanceof MobileCompatibilityInputError) {
        return res.status(422).json({ ok: false, error: error.code });
      }
      return res.status(422).json({ ok: false, error: "repository_snapshot_unavailable" });
    }
  });
}
