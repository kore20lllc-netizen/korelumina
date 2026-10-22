import type { Express } from "express";

import { importRepository } from "../import/importRepository.js";
import { RepositorySourceError } from "../import/RepositorySource.js";
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
          await importRepository({
            repoUrl:
              req.body?.repoUrl,
            accessToken:
              req.body?.accessToken,
            accessUsername:
              req.body?.accessUsername,
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
        /* MS-2026-0013: a bad URL is the caller's mistake, not a failure. */
        const invalid =
          error instanceof RepositorySourceError ||
          (error instanceof Error && /^invalid_access_/.test(error.message));
        return res.status(invalid ? 400 : 500).json({
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
