import type { Express, Request, Response } from "express";

import {
  MissionTransitionError,
  type MissionActor,
  type MissionProposalService,
  type MissionTaskStatus,
  type MissionValidationService,
  type MissionService,
  type MissionTransitionName,
} from "../executive/mission/index.js";

/*
 * MS-1 (ADR-0044): mission routes. Like every /api/executive route they
 * sit behind the Runtime access boundary; owner-only steps are also on
 * the human-only route list, so an agent actor is refused before the
 * mission lifecycle refuses it again.
 */

function actorFrom(body: any): MissionActor {
  const id = typeof body?.actorId === "string" ? body.actorId.trim() : "";
  if (id === "chief-agent") return { id, type: "chief-agent" };
  return { id, type: "human" };
}

const STATUS: Record<string, number> = {
  mission_not_found: 404,
};

function fail(res: Response, error: unknown) {
  if (error instanceof MissionTransitionError) {
    return res.status(STATUS[error.code] ?? (error.code.includes("not_allowed") || error.code.includes("actor_required") ? 403 : 409)).json({
      ok: false,
      error: error.code,
    });
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith("executive_approval_") || message.startsWith("executive_decision_")) {
    return res.status(409).json({ ok: false, error: message });
  }
  return res.status(500).json({ ok: false, error: message });
}

const OWNER_STEPS: readonly MissionTransitionName[] = ["approve", "reject", "block", "unblock", "cancel", "archive"];
const PROPOSER_STEPS: readonly MissionTransitionName[] = ["submit"];

export function registerExecutiveMissionRoutes(
  app: Express,
  missions: MissionService,
  /* MS-3: owner steps on a proposed mission go through its approval. */
  proposals?: MissionProposalService,
  /* MS-4: validation evidence and completion. */
  validation?: MissionValidationService,
): void {
  if (validation) {
    app.get("/api/executive/missions/:id/validation", (req: Request, res: Response) => {
      try {
        return res.json({ ok: true, checks: validation.checks(String(req.params.id)) });
      } catch (error) {
        return fail(res, error);
      }
    });

    app.post("/api/executive/missions/:id/tasks/:taskId", (req: Request, res: Response) => {
      try {
        return res.json({
          ok: true,
          mission: validation.setTaskStatus(
            String(req.params.id),
            String(req.params.taskId),
            req.body?.status as MissionTaskStatus,
            actorFrom(req.body),
            req.body?.reason,
          ),
        });
      } catch (error) {
        return fail(res, error);
      }
    });

    app.post("/api/executive/missions/:id/verifications", (req: Request, res: Response) => {
      try {
        return res.json({
          ok: true,
          mission: validation.recordVerification(String(req.params.id), req.body ?? {}, actorFrom(req.body)),
        });
      } catch (error) {
        return fail(res, error);
      }
    });

    /* Re-reads the evidence; only Runtime takes the resulting steps. */
    app.post("/api/executive/missions/:id/evaluate", (req: Request, res: Response) => {
      try {
        return res.json({ ok: true, mission: validation.evaluate(String(req.params.id)) });
      } catch (error) {
        return fail(res, error);
      }
    });
  }

  app.get("/api/executive/missions", (_req: Request, res: Response) =>
    res.json({ ok: true, missions: missions.list() }),
  );

  app.get("/api/executive/missions/:id", (req: Request, res: Response) => {
    const mission = missions.get(String(req.params.id));
    return mission
      ? res.json({ ok: true, mission })
      : res.status(404).json({ ok: false, error: "mission_not_found" });
  });

  app.post("/api/executive/missions", (req: Request, res: Response) => {
    try {
      return res.json({ ok: true, mission: missions.create(req.body ?? {}, actorFrom(req.body)) });
    } catch (error) {
      return fail(res, error);
    }
  });

  app.post("/api/executive/missions/:id/plan", (req: Request, res: Response) => {
    try {
      return res.json({ ok: true, mission: missions.setPlan(String(req.params.id), req.body?.plan, actorFrom(req.body)) });
    } catch (error) {
      return fail(res, error);
    }
  });

  for (const step of [...PROPOSER_STEPS, ...OWNER_STEPS]) {
    app.post(`/api/executive/missions/:id/${step}`, (req: Request, res: Response) => {
      try {
        return res.json({
          ok: true,
          mission: proposals && OWNER_STEPS.includes(step)
            ? proposals.decide(String(req.params.id), step, actorFrom(req.body), req.body?.reason)
            : missions.transition(String(req.params.id), step, actorFrom(req.body), req.body?.reason),
        });
      } catch (error) {
        return fail(res, error);
      }
    });
  }
}
