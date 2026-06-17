import type { Express } from "express";
import { rm } from "node:fs/promises";

import { getProjectPath } from "../projects/getProjectPath.js";
import { listProjects } from "../projects/listProjects.js";
import { stopRuntime } from "../runtime/registry.js";

function normalizeProjectId(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

export function registerProjectsRoute(
  app: Express,
) {
  app.get(
    "/api/runtime/projects",
    (_req, res) => {
      return res.json({
        ok: true,
        projects: listProjects(),
      });
    },
  );

  app.delete(
    "/api/runtime/projects/:projectId",
    async (req, res) => {
      try {
        const projectId =
          normalizeProjectId(
            req.params.projectId,
          );

        if (!projectId) {
          return res.status(400).json({
            ok: false,
            error: "missing_projectId",
          });
        }

        const projectExists =
          listProjects().some(
            (project) =>
              project.projectId === projectId,
          );

        if (!projectExists) {
          return res.status(404).json({
            ok: false,
            error: "project_not_found",
            projectId,
          });
        }

        const projectPath =
          getProjectPath(
            projectId,
          );

        await stopRuntime(
          projectId,
        );

        await rm(
          projectPath,
          {
            recursive: true,
            force: true,
          },
        );

        return res.json({
          ok: true,
          deleted: true,
          projectId,
        });
      } catch (error) {
        console.error(
          "[runtime/projects/delete]",
          error,
        );

        return res.status(500).json({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "failed_to_delete_project",
        });
      }
    },
  );
}
