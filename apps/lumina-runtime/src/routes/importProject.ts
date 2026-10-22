import express, { type Express } from "express";

import { importRepository } from "../import/importRepository.js";
import { RepositorySourceError } from "../import/RepositorySource.js";
import { ArchiveError } from "../import/ArchiveExtract.js";
import { importArchive, MAX_ARCHIVE_UPLOAD_BYTES } from "../import/importArchive.js";
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
        /* MS-2026-0013: git's own words, already scrubbed of any token, for whoever runs Runtime. */
        console.error(
          "[import] failed",
          error instanceof Error ? error.message : String(error),
          (error as { detail?: string })?.detail ?? "",
        );
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

  /*
   * MS-2026-0013: upload a .zip, .tar.gz or .tgz as the raw request body,
   * named by ?name=. Ownership is set afterwards through the metadata
   * route, as for git imports.
   */
  app.post(
    "/api/runtime/projects/import-archive",
    requireRuntimeAccess,
    express.raw({ type: () => true, limit: MAX_ARCHIVE_UPLOAD_BYTES }),
    async (req, res) => {
      try {
        const imported = await importArchive({
          fileName: req.query.name,
          data: Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0),
          projectId: req.query.projectId,
        });
        return res.json({ ok: true, import: imported });
      } catch (error) {
        console.error("[import] archive failed", error instanceof Error ? error.message : String(error));
        return res.status(error instanceof ArchiveError ? 400 : 500).json({
          ok: false,
          error: error instanceof Error ? error.message : "failed_to_import_archive",
        });
      }
    },
  );
}
