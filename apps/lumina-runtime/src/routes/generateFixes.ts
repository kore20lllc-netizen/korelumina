import type { Express } from "express";

import { auditProject } from "../audit/auditProject.js";
import { generateFixPlan } from "../autofix/generateFixPlan.js";
import { createDraft } from "../drafts/draftStore.js";
import { generateDraftPatches } from "../drafts/generateFixDrafts.js";
import { getProjectPath } from "../projects/getProjectPath.js";

function readProjectId(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

export function registerGenerateFixesRoute(app: Express) {
  app.post("/api/runtime/generate-fixes", async (req, res) => {
    try {
      const projectId = readProjectId(req.body?.projectId);

      if (!projectId) {
        return res.status(400).json({
          ok: false,
          error: "missing_projectId",
        });
      }

      if (!/^[a-zA-Z0-9._-]+$/.test(projectId)) {
        return res.status(400).json({
          ok: false,
          error: "invalid_projectId",
        });
      }

      const projectPath = getProjectPath(projectId);
      const report = auditProject(projectId, projectPath);
      const plan = generateFixPlan(report);
      const patches = generateDraftPatches(projectPath, plan);
      const draft = createDraft(projectId, patches);

      return res.json({
        ok: true,
        report,
        plan,
        draft,
      });
    } catch (error) {
      console.error("[runtime/generate-fixes]", error);

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_generate_fixes",
      });
    }
  });
}
