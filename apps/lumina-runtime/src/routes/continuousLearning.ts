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

/*
 * ADR-0042 Decision 4 (CL-1d): the owner's one-time setup that lets Learning
 * Records become canonical automatically. It creates and activates the
 * learning review policy and records the standing promotion authorization.
 * Both are human acts; agents are refused.
 */
export interface LearningGovernanceRouteDependencies {
  status(): unknown;
  setup(actorId: string): unknown;
  revoke(actorId: string): unknown;
}

export function registerLearningGovernanceRoutes(
  app: Express,
  dependencies: LearningGovernanceRouteDependencies,
): void {
  app.get("/api/learning/governance", (_req: Request, res: Response) => {
    try {
      return res.json({ ok: true, ...(dependencies.status() as object) });
    } catch (error) {
      return res.status(500).json({ ok: false, error: (error as Error).message });
    }
  });

  for (const [path, action] of [
    ["/api/learning/governance", "setup"],
    ["/api/learning/governance/revoke", "revoke"],
  ] as const) {
    app.post(path, requireRuntimeAccess, (req: Request, res: Response) => {
      const actorId =
        typeof req.body?.actorId === "string" ? req.body.actorId.trim() : "";
      if (!actorId.toLowerCase().startsWith("human:")) {
        return res.status(403).json({
          ok: false,
          error: "learning_governance_requires_human_actor",
        });
      }
      try {
        return res.json({
          ok: true,
          ...(dependencies[action](actorId) as object),
        });
      } catch (error) {
        return res.status(409).json({ ok: false, error: (error as Error).message });
      }
    });
  }
}
