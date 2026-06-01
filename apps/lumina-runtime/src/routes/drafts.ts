import type { Express } from "express";

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

    return res.json({
      ok: true,
      draft,
    });
  });
}
