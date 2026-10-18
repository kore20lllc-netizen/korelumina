import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ChiefAgentActivationGate,
} from "../executive/activation/index.js";

/*
 * ADR-0041 Decision 8 (KO-5b): read-only activation status. It reports
 * the gate and, for information, the education prerequisites. It cannot
 * change anything.
 */
export function registerExecutiveActivationRoute(
  app:
    Express,

  gate:
    ChiefAgentActivationGate,
): void {
  app.get(
    "/api/executive/activation",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      return res.json({
        ok:
          true,
        activation:
          gate.status(),
      });
    },
  );
}
