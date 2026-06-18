import type { Express } from "express";
import { rm } from "node:fs/promises";

import { getProjectPath } from "../projects/getProjectPath.js";
import { listProjects } from "../projects/listProjects.js";

import { getProjectMetadata } from "../projects/projectMetadataStore.js";
import { getRuntimeCaller } from "./runtimeCaller.js";
import {
  canViewProject,
  canManageProject,
} from "./runtimeAuthorization.js";

import { stopRuntime } from "../runtime/registry.js";
import { requireRuntimeAccess } from "./runtimeAccess.js";

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
    requireRuntimeAccess,
    (req, res) => {
      const caller =
        getRuntimeCaller(req);

      const projects =
        listProjects().filter(
          (project) =>
            canViewProject(
              caller,
              getProjectMetadata(
                project.projectId,
              ),
            ),
        );

      return res.json({
        ok: true,
        projects,
      });
    },
  );

  app.delete(
    "/api/runtime/projects/:projectId",
    requireRuntimeAccess,
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

        const caller =
          getRuntimeCaller(req);

        const metadata =
          getProjectMetadata(
            projectId,
          );

        if (
          !canManageProject(
            caller,
            metadata,
          )
        ) {
          return res.status(403).json({
            ok: false,
            error: "forbidden",
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
