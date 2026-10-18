import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ChiefAgentActivationGate,
  ChiefAgentActivationService,
} from "../executive/activation/index.js";

/*
 * ADR-0041 (KO-5b, KO-5c): activation status and the Activation
 * Authority's decisions. GET is read-only. PUT records a human decision
 * (ACTIVATE, SUSPEND, RESUME, REVOKE); it previews unless confirm is true.
 * The route sits under /api/executive, so it requires Runtime access.
 */
export function registerExecutiveActivationRoute(
  app:
    Express,

  gate:
    ChiefAgentActivationGate,

  service?:
    ChiefAgentActivationService,
): void {
  app.get(
    "/api/executive/activation",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      /*
       * Prerequisite reads rebuild certification candidates and can take
       * tens of seconds, so they are reported only when asked for.
       */
      const includePrerequisites =
        req.query.prerequisites ===
        "true";

      let history:
        unknown[] = [];

      try {
        history =
          service?.history() ?? [];
      } catch {
        history = [];
      }

      return res.json({
        ok:
          true,
        activation:
          gate.status({
            includePrerequisites,
          }),
        history,
      });
    },
  );

  if (!service) {
    return;
  }

  app.put(
    "/api/executive/activation",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      try {
        const result =
          service.decide(
            req.body ?? {},
          );

        const status =
          result.outcome ===
            "REFUSED"
            ? 409
            : 200;

        return res
          .status(
            status,
          )
          .json({
            ok:
              result.outcome !==
              "REFUSED",
            ...result,
            activation:
              gate.status({
                includePrerequisites:
                  false,
              }),
          });
      } catch (error) {
        return res
          .status(
            409,
          )
          .json({
            ok:
              false,
            outcome:
              "REFUSED",
            reasons: [
              error instanceof Error
                ? error.message
                : String(error),
            ],
          });
      }
    },
  );
}
