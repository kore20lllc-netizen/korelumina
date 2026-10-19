import type { Express, Request, Response } from "express";

import type {
  ChiefAgentOperationalStateReader,
} from "../executive/reasoning/index.js";

/*
 * EW-2 (F-24): the owner can see exactly what live state the Chief Agent
 * is given when it reasons. Read-only; behind the /api/executive access
 * boundary like every executive route.
 */
export function registerExecutiveOperationalStateRoute(
  app: Express,
  reader: ChiefAgentOperationalStateReader,
): void {
  app.get(
    "/api/executive/operational-state",
    (_req: Request, res: Response) => {
      try {
        return res.json({ ok: true, state: reader.read() });
      } catch (error) {
        return res.status(500).json({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );
}
