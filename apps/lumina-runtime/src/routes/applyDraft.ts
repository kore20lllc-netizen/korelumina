import type { Express } from "express";

import { auditProject } from "../audit/auditProject.js";
import { applyDraft } from "../drafts/applyDraft.js";
import { getDraft, markDraftApplied } from "../drafts/draftStore.js";
import { getProjectPath } from "../projects/getProjectPath.js";

function readDraftId(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

export function registerApplyDraftRoute(app: Express) {
  app.post("/api/runtime/apply-draft", async (req, res) => {
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

      if (draft.status !== "draft") {
        return res.status(409).json({
          ok: false,
          error: "draft_not_applyable",
          status: draft.status,
        });
      }

      const projectPath = getProjectPath(draft.projectId);
      const beforeAudit = auditProject(draft.projectId, projectPath);
      const result = applyDraft(projectPath, draft);
      markDraftApplied(draftId, result.snapshots);
      const afterAudit = auditProject(draft.projectId, projectPath);

      return res.json({
        ok: true,
        draftId,
        projectId: draft.projectId,
        result: {
          applied: result.applied,
          skipped: result.skipped,
          files: result.files,
          errors: result.errors,
          snapshots: result.snapshots.length,
        },
        beforeScore: beforeAudit.complianceScore,
        afterScore: afterAudit.complianceScore,
        improvedBy: afterAudit.complianceScore - beforeAudit.complianceScore,
        report: afterAudit,
      });
    } catch (error) {
      console.error("[runtime/apply-draft]", error);

      return res.status(500).json({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "failed_to_apply_draft",
      });
    }
  });
}
