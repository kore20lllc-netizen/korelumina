import type { Express } from "express";

import { allowAuditAction } from "./auditPolicy.js";

import { getDraft } from "../drafts/draftStore.js";

export function registerDraftsRoute(app: Express) {
  app.get("/api/runtime/drafts/:draftId", (req, res) => {
    const draft = getDraft(req.params.draftId);

    if (!draft) {
      return res.status(404).json({
        ok: false,
        error: "draft_not_found",
      });
    }

    /* ADR-0046, F-44: a draft belongs to its project's managers and staff. */
    if (!allowAuditAction(req, res, draft.projectId, "edit")) return;

    return res.json({
      ok: true,
      draft,
    });
  });
}
