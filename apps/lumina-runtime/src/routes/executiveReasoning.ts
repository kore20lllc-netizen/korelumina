import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveReasoningService,
} from "../executive/reasoning/index.js";

export function registerExecutiveReasoningRoute(
  app: Express,
  reasoningService:
    ExecutiveReasoningService,
): void {
  app.get(
    "/api/executive/reasoning/:id",
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
            "executive_reasoning_id_required",
        });
      }

      const reasoning =
        reasoningService.get(
          id,
        );

      if (
        !reasoning
      ) {
        return res.status(
          404,
        ).json({
          ok:
            false,

          error:
            "executive_reasoning_not_found",

          id,
        });
      }

      return res.json({
        ok:
          true,

        reasoning,
      });
    },
  );
}
