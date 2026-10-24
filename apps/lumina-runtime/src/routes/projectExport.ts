import type { Express } from "express";

import { selectExportFiles, writeProjectZip } from "../export/ProjectExport.js";
import { getProjectPath } from "../projects/getProjectPath.js";
import { requireProjectAccess } from "./projectAccess.js";

/*
 * MS-2026-0017: download a project. Open to whoever manages it, on every
 * plan (ADR-0047: the code is the customer's).
 *
 * GET /api/runtime/projects/:projectId/export          what the download will hold
 * GET /api/runtime/projects/:projectId/export.zip      the download
 */

function safeId(value: unknown): string {
  const id = String(value ?? "");
  return /^[a-zA-Z0-9._-]+$/.test(id) ? id : "";
}

export function registerProjectExportRoutes(app: Express) {
  app.get("/api/runtime/projects/:projectId/export", requireProjectAccess("manage"), (req, res) => {
    const projectId = safeId(req.params.projectId);
    if (!projectId) return res.status(400).json({ ok: false, error: "invalid_projectId" });
    try {
      const selection = selectExportFiles(getProjectPath(projectId));
      return res.json({
        ok: true,
        projectId,
        fileCount: selection.files.length,
        totalBytes: selection.totalBytes,
        leftOutSecrets: selection.leftOutSecrets,
        leftOutLinks: selection.leftOutLinks,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "export_failed";
      return res.status(code.startsWith("export_too") ? 413 : 500).json({ ok: false, error: code.startsWith("export_") ? code : "export_failed" });
    }
  });

  app.get("/api/runtime/projects/:projectId/export.zip", requireProjectAccess("manage"), (req, res) => {
    const projectId = safeId(req.params.projectId);
    if (!projectId) return res.status(400).json({ ok: false, error: "invalid_projectId" });
    let selection;
    try {
      selection = selectExportFiles(getProjectPath(projectId));
    } catch (error) {
      const code = error instanceof Error ? error.message : "export_failed";
      return res.status(code.startsWith("export_too") ? 413 : 500).json({ ok: false, error: code.startsWith("export_") ? code : "export_failed" });
    }
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${projectId}.zip"`);
    res.setHeader("Cache-Control", "no-store");
    try {
      writeProjectZip(getProjectPath(projectId), projectId, selection, (chunk) => res.write(chunk));
      res.end();
    } catch (error) {
      console.error(`[runtime/export] ${projectId}:`, error instanceof Error ? error.message : error);
      res.destroy();
    }
  });
}
