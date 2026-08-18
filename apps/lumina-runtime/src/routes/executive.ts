import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveOrchestratorRuntime,
} from "../executive/orchestrator/index.js";

import {
  createExecutiveEvent,
} from "../executive/events/index.js";

export function registerExecutiveRoute(
  app: Express,
  runtime:
    ExecutiveOrchestratorRuntime,
): void {
  app.post(
    "/api/executive/events",
    async (
      req: Request,
      res: Response,
    ) => {
      const body =
        req.body ?? {};

      try {
        const event =
          createExecutiveEvent({
            id:
              String(
                body.id ?? "",
              ),

            type:
              String(
                body.type ?? "",
              ),

            category:
              body.category,

            source:
              String(
                body.source ?? "",
              ),

            workspace:
              body.workspace,

            organizationId:
              typeof body.organizationId ===
                "string"
                ? body.organizationId
                : undefined,

            actor:
              body.actor,

            projectId:
              body.projectId,

            missionId:
              body.missionId,

            confidence:
              body.confidence,

            evidence:
              Array.isArray(
                body.evidence,
              )
                ? body.evidence
                : [],

            payload:
              body.payload &&
              typeof body.payload ===
                "object"
                ? body.payload
                : {},

            correlationId:
              body.correlationId,

            causationId:
              body.causationId,
          });

        const result =
          await runtime
            .orchestrator
            .publish(event);

        const status =
          result.lifecycle.stage ===
          "rejected"
            ? 400
            : result.lifecycle.stage ===
                "failed"
              ? 500
              : 200;

        return res.status(
          status,
        ).json({
          ok:
            result.lifecycle.stage ===
            "completed",

          ...result,
        });
      } catch (error) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    },
  );
}
