import type { Express } from "express";

import { auditProject } from "../audit/auditProject.js";
import { generateFixPlan } from "../autofix/generateFixPlan.js";
import { getProjectPath } from "../projects/getProjectPath.js";

function readProjectId(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

async function handleFixPlan(projectId: string) {
  if (!projectId) {
    return {
      status: 400,
      body: {
        ok: false,
        error: "missing_projectId",
      },
    };
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(projectId)) {
    return {
      status: 400,
      body: {
        ok: false,
        error: "invalid_projectId",
      },
    };
  }

  const projectPath = getProjectPath(projectId);
  const report = auditProject(projectId, projectPath);
  const plan = generateFixPlan(report);

  return {
    status: 200,
    body: {
      ok: true,
      report,
      plan,
    },
  };
}

export function registerFixPlanRoute(app: Express) {
  app.get("/api/runtime/fix-plan", async (req, res) => {
    try {
      const result = await handleFixPlan(readProjectId(req.query.projectId));
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("[runtime/fix-plan]", error);

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_generate_fix_plan",
      });
    }
  });

  app.post("/api/runtime/fix-plan", async (req, res) => {
    try {
      const result = await handleFixPlan(readProjectId(req.body?.projectId));
      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error("[runtime/fix-plan]", error);

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_generate_fix_plan",
      });
    }
  });
}
