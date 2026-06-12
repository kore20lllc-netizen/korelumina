import type { Express } from "express";
import { listProjects } from "../projects/listProjects.js";

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
}
