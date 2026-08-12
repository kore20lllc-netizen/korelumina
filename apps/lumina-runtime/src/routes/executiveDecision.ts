import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveDecisionService,
} from "../executive/decision/index.js";

export function registerExecutiveDecisionRoute(
  app: Express,
  decisionService:
    ExecutiveDecisionService,
): void {
  app.get(
    "/api/executive/decisions/:id",
    (
      req: Request,
      res: Response,
    ) => {
      const id =
        String(
          req.params.id ?? "",
        )
          .trim();

      if (
        id.length === 0
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_decision_id_required",
        });
      }

      const decision =
        decisionService.get(
          id,
        );

      if (
        !decision
      ) {
        return res.status(
          404,
        ).json({
          ok:
            false,

          error:
            "executive_decision_not_found",

          id,
        });
      }

      return res.json({
        ok:
          true,

        decision,
      });
    },
  );
}
