import type { Express } from "express";

import {
  setProjectMetadata,
} from "../projects/projectMetadataStore.js";

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

        const record =
          setProjectMetadata({
            projectId,
            ownerId: normalizeString(
              req.body?.ownerId,
            ),
            teamId: normalizeString(
              req.body?.teamId,
            ),
            createdBy: normalizeString(
              req.body?.createdBy,
            ),
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
