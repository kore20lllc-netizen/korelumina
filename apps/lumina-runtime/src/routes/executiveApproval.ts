import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveApprovalService,
} from "../executive/approval/index.js";

export function registerExecutiveApprovalRoute(
  app: Express,
  approvalService:
    ExecutiveApprovalService,
): void {
  app.get(
    "/api/executive/approvals/:id",
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
            "executive_approval_id_required",
        });
      }

      const approval =
        approvalService.get(
          id,
        );

      if (
        !approval
      ) {
        return res.status(
          404,
        ).json({
          ok:
            false,

          error:
            "executive_approval_not_found",

          id,
        });
      }

      return res.json({
        ok:
          true,

        approval,
      });
    },
  );
}
