import type { Express, Request, Response } from "express";

import { AcknowledgementError, type ExecutiveAcknowledgementService } from "../executive/acknowledgement/index.js";

/* MS-2026-0004 (E2.T2): the owner acknowledges Critical notifications. */
export function registerExecutiveAcknowledgementRoutes(app: Express, acknowledgements: ExecutiveAcknowledgementService): void {
  app.get("/api/executive/acknowledgements", (_req: Request, res: Response) =>
    res.json({ ok: true, acknowledgements: acknowledgements.list() }),
  );

  app.post("/api/executive/acknowledgements", (req: Request, res: Response) => {
    try {
      const actorId = typeof req.body?.actorId === "string" ? req.body.actorId : "";
      return res.json({ ok: true, acknowledgement: acknowledgements.acknowledge(req.body ?? {}, actorId) });
    } catch (error) {
      if (error instanceof AcknowledgementError) {
        return res.status(error.code.includes("actor") ? 403 : 400).json({ ok: false, error: error.code });
      }
      return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  });
}
