import type { Express } from "express";

import {
  getProjectMetadata,
  setProjectMetadata,
} from "../projects/projectMetadataStore.js";
import { decideProjectOwnership, definedOnly } from "../projects/projectOwnership.js";
import { projectExists } from "../runtime/projectRegistry.js";
import { getRuntimeCaller } from "./runtimeCaller.js";

function normalizeString(
  value: unknown,
): string | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const trimmed =
    value.trim();

  return trimmed || undefined;
}

export function registerProjectMetadataRoute(
  app: Express,
) {
  app.post(
    "/api/runtime/projects/metadata",
    (req, res) => {
      try {
        const projectId =
          normalizeString(
            req.body?.projectId,
          );

        if (!projectId) {
          return res.status(400).json({
            ok: false,
            error: "missing_projectId",
          });
        }

        if (!projectExists(projectId)) {
          return res.status(404).json({ ok: false, error: "project_not_found" });
        }

        /* MS-2026-0013: only the owner (or an admin) changes a project; an unowned one is claimed by its signed-in caller. */
        const caller = getRuntimeCaller(req);
        const existing = getProjectMetadata(projectId);
        const decision = decideProjectOwnership(caller, existing, normalizeString(req.body?.ownerId));
        if (!decision.ok) {
          return res.status(decision.status).json({ ok: false, error: decision.error });
        }

        const record =
          setProjectMetadata({
            projectId,
            ...definedOnly({
              ownerId: decision.ownerId,
              teamId: normalizeString(req.body?.teamId),
              createdBy: existing?.createdBy ?? decision.ownerId,
            }),
            visibility:
              req.body?.visibility ===
                "team" ||
              req.body?.visibility ===
                "support"
                ? req.body.visibility
                : "private",
          });

        return res.json({
          ok: true,
          metadata: record,
        });
      } catch (error) {
        console.error(
          "[runtime/project-metadata]",
          error,
        );

        return res.status(500).json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "failed_to_save_project_metadata",
        });
      }
    },
  );
}
