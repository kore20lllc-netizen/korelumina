import type { Express } from "express";

import { getRuntime } from "../runtime/registry.js";
import { restartProject } from "../runtime/startProject.js";
import { getRuntimeProject } from "../runtime/projectRegistry.js";

import { requireRuntimeAccess } from "./runtimeAccess.js";

function normalizeProjectId(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function registerRestartRoute(
  app: Express,
) {
  app.post(
    "/api/runtime/restart",
    requireRuntimeAccess,
    async (req, res) => {
      try {
        const projectId = normalizeProjectId(
          req.body?.projectId,
        );

        if (!projectId) {
          return res.status(400).json({
            ok: false,
            error: "missing_projectId",
          });
        }

        // Validate through the Runtime Project Registry façade.
        // Preserve existing behavior by still returning
        // runtime_not_found when no runtime exists.
        getRuntimeProject(projectId);

        await restartProject(projectId);

        const runtime = getRuntime(projectId);

        return res.json({
          ok: true,
          restarted: true,
          runtime,
        });
      } catch (error) {
        console.error(
          "[runtime/restart]",
          error,
        );

        return res.status(500).json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "failed_to_restart_runtime",
        });
      }
    },
  );
}
