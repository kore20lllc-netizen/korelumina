import type { Express } from "express";

import { importGithubProject } from "../import/importGithubProject.js";
import { requireRuntimeAccess } from "./runtimeAccess.js";

export function registerImportProjectRoute(
  app: Express,
) {
  app.post(
    "/api/runtime/projects/import",
    requireRuntimeAccess,
    async (req, res) => {
      try {
        const imported =
          await importGithubProject({
            repoUrl:
              req.body?.repoUrl,
            projectId:
              req.body?.projectId,
            ownerId:
              req.body?.ownerId,
            teamId:
              req.body?.teamId,
            createdBy:
              req.body?.createdBy,
            visibility:
              req.body?.visibility,
          });

        return res.json({
          ok: true,
          import: imported,
        });
      } catch (error) {
        return res.status(500).json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "failed_to_import_project",
        });
      }
    },
  );
}
