import type { Express } from "express";

import { allowAuditAction } from "./auditPolicy.js";

import { generateAIDraft } from "../ai/AIOrchestrator.js";
import { getProjectPath } from "../projects/getProjectPath.js";
import type { DraftFocus } from "../ai/AIProvider.js";
import { normalizePatchPath } from "../drafts/patchSafety.js";

function readString(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

function readLine(input: unknown): number | undefined {
  return typeof input === "number" && Number.isInteger(input) && input > 0
    ? input
    : undefined;
}

/* MS-2026-0011: the open file and selected lines the request is about. */
function readFocus(input: unknown): DraftFocus | undefined {
  if (!input || typeof input !== "object") return undefined;
  const focus = input as Record<string, unknown>;
  const file = normalizePatchPath(focus.file);
  if (!file) return undefined;
  const startLine = readLine(focus.startLine);
  const endLine = readLine(focus.endLine);
  return startLine !== undefined && endLine !== undefined && endLine >= startLine
    ? { file, startLine, endLine }
    : { file };
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

      /* ADR-0046, F-44: the AI Builder edits only projects the caller manages. */
      if (!allowAuditAction(req, res, projectId, "edit")) return;

      const projectPath = getProjectPath(projectId);

      const result = await generateAIDraft({
        projectId,
        projectPath,
        prompt,
        focus: readFocus(req.body?.focus),
      });

      return res.json({
        ok: true,
        ...result,
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
