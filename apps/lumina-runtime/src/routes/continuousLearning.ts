import type { Express, Request, Response } from "express";

import type {
  ContinuousLearningCycleService,
} from "../continuous-learning/index.js";
import { requireRuntimeAccess } from "./runtimeAccess.js";

/*
 * ADR-0042: learning status, and "Learn now".
 */
export function registerContinuousLearningRoutes(
  app: Express,
  service: ContinuousLearningCycleService,
): void {
  app.get(
    "/api/learning/cycles",
    (_req: Request, res: Response) => {
      try {
        return res.json({ ok: true, ...service.status() });
      } catch (error) {
        return res.status(500).json({
          ok: false,
          error: (error as Error).message,
        });
      }
    },
  );

  app.post(
    "/api/learning/cycles",
    requireRuntimeAccess,
    async (_req: Request, res: Response) => {
      try {
        const cycle = await service.run("manual");
        return res
          .status(cycle.outcome === "FAILED" ? 500 : 200)
          .json({ ok: cycle.outcome !== "FAILED", cycle });
      } catch (error) {
        return res.status(500).json({
          ok: false,
          error: (error as Error).message,
        });
      }
    },
  );
}
