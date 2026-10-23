import type { Express } from "express";

import { allowAuditAction } from "./auditPolicy.js";

import { auditProject } from "../audit/auditProject.js";
import { getDraft, markDraftReverted } from "../drafts/draftStore.js";
import { revertDraft } from "../drafts/revertDraft.js";
import { getProjectPath } from "../projects/getProjectPath.js";

function readDraftId(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

export function registerRevertDraftRoute(app: Express) {
  app.post("/api/runtime/revert-draft", async (req, res) => {
    try {
      const draftId = readDraftId(req.body?.draftId);

      if (!draftId) {
        return res.status(400).json({
          ok: false,
          error: "missing_draftId",
        });
      }

      const draft = getDraft(draftId);

      if (!draft) {
        return res.status(404).json({
          ok: false,
          error: "draft_not_found",
        });
      }

      /* ADR-0046, F-44: only the project's managers and staff change its files. */
      if (!allowAuditAction(req, res, draft.projectId, "edit")) return;

      if (draft.status !== "applied") {
        return res.status(409).json({
          ok: false,
          error: "draft_not_applied",
          status: draft.status,
        });
      }

      const projectPath = getProjectPath(draft.projectId);
      const beforeAudit = auditProject(draft.projectId, projectPath);
      const result = revertDraft(projectPath, draft);

      /* MS-2026-0011: never undo over work done after the draft. */
      if (result.refused) {
        return res.status(409).json({
          ok: false,
          error: "files_changed_since_apply",
          errors: result.errors,
        });
      }

      markDraftReverted(draftId);
      const afterAudit = auditProject(draft.projectId, projectPath);

      return res.json({
        ok: true,
        draftId,
        projectId: draft.projectId,
        result,
        beforeScore: beforeAudit.complianceScore,
        afterScore: afterAudit.complianceScore,
        changedBy: afterAudit.complianceScore - beforeAudit.complianceScore,
        report: afterAudit,
      });
    } catch (error) {
      console.error("[runtime/revert-draft]", error);

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_revert_draft",
      });
    }
  });
}
