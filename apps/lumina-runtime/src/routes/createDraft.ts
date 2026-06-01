import type { Express } from "express";

import { auditProject } from "../audit/auditProject.js";
import { generateFixPlan } from "../autofix/generateFixPlan.js";
import { createDraft } from "../drafts/draftStore.js";
import { generateDraftPatches } from "../drafts/generateFixDrafts.js";
import { getProjectPath } from "../projects/getProjectPath.js";

function readString(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

export function registerCreateDraftRoute(app: Express) {
  app.post("/api/runtime/drafts/create", async (req, res) => {
    try {
      const projectId = readString(req.body?.projectId);
      const prompt = readString(req.body?.prompt);

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

      if (!prompt) {
        return res.status(400).json({
          ok: false,
          error: "missing_prompt",
        });
      }

      const projectPath = getProjectPath(projectId);
      const report = auditProject(projectId, projectPath);
      const plan = generateFixPlan(report);
      const patches = generateDraftPatches(projectPath, plan);
      const draft = createDraft(projectId, patches);

      return res.json({
        ok: true,
        mode: "rule_based_draft",
        note:
          "AI provider is not wired yet. This endpoint creates a safe rule-based draft from audit findings.",
        prompt,
        report,
        plan,
        draft,
      });
    } catch (error) {
      console.error("[runtime/drafts/create]", error);

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_create_draft",
      });
    }
  });
}
