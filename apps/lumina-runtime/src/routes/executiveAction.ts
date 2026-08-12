import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveActionService,
} from "../executive/action/index.js";

function readString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

export function registerExecutiveActionRoute(
  app: Express,
  actionService:
    ExecutiveActionService,
): void {
  app.get(
    "/api/executive/actions/:id",
    (
      req: Request,
      res: Response,
    ) => {
      const id =
        readString(
          req.params.id,
        );

      if (
        id.length === 0
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_action_id_required",
        });
      }

      const action =
        actionService.get(
          id,
        );

      if (
        !action
      ) {
        return res.status(
          404,
        ).json({
          ok:
            false,

          error:
            "executive_action_not_found",

          id,
        });
      }

      return res.json({
        ok:
          true,

        action,
      });
    },
  );
}
