import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveApprovalDecisionService,
  ExecutiveApprovalService,
} from "../executive/approval/index.js";

export interface ExecutiveApprovalRouteDependencies {
  approvalService:
    ExecutiveApprovalService;

  approvalDecisionService:
    ExecutiveApprovalDecisionService;
}

function readId(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function respondDomainError(
  res: Response,
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : "executive_approval_operation_failed";

  if (
    message ===
    "executive_approval_not_found" ||
    message ===
    "executive_decision_not_found"
  ) {
    return res.status(
      404,
    ).json({
      ok:
        false,

      error:
        message,
    });
  }

  if (
    message ===
      "executive_approval_not_pending" ||
    message ===
      "executive_decision_not_proposed"
  ) {
    return res.status(
      409,
    ).json({
      ok:
        false,

      error:
        message,
    });
  }

  if (
    message ===
    "executive_approval_rejection_reason_required"
  ) {
    return res.status(
      400,
    ).json({
      ok:
        false,

      error:
        message,
    });
  }

  console.error(
    "[executive/approval]",
    error,
  );

  return res.status(
    500,
  ).json({
    ok:
      false,

    error:
      "executive_approval_operation_failed",
  });
}

export function registerExecutiveApprovalRoute(
  app: Express,
  dependencies:
    ExecutiveApprovalRouteDependencies,
): void {
  const {
    approvalService,
    approvalDecisionService,
  } =
    dependencies;

  app.get(
    "/api/executive/approvals/:id",
    (
      req: Request,
      res: Response,
    ) => {
      const id =
        readId(
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

  app.post(
    "/api/executive/approvals/:id/approve",
    (
      req: Request,
      res: Response,
    ) => {
      const approvalId =
        readId(
          req.params.id,
        );

      const actorId =
        readId(
          req.body?.actorId,
        );

      if (
        approvalId.length ===
        0
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

      if (
        actorId.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_approval_actor_required",
        });
      }

      const approval =
        approvalService.get(
          approvalId,
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

          id:
            approvalId,
        });
      }

      if (
        approval.approverId !==
        actorId
      ) {
        return res.status(
          403,
        ).json({
          ok:
            false,

          error:
            "executive_approval_actor_not_authorized",
        });
      }

      try {
        const result =
          approvalDecisionService
            .approve({
              approvalId,
            });

        return res.json({
          ok:
            true,

          approval:
            result.approval,

          decision:
            result.decision,
        });
      } catch (error) {
        return respondDomainError(
          res,
          error,
        );
      }
    },
  );

  app.post(
    "/api/executive/approvals/:id/reject",
    (
      req: Request,
      res: Response,
    ) => {
      const approvalId =
        readId(
          req.params.id,
        );

      const actorId =
        readId(
          req.body?.actorId,
        );

      const reason =
        readId(
          req.body?.reason,
        );

      if (
        approvalId.length ===
        0
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

      if (
        actorId.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_approval_actor_required",
        });
      }

      if (
        reason.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_approval_rejection_reason_required",
        });
      }

      const approval =
        approvalService.get(
          approvalId,
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

          id:
            approvalId,
        });
      }

      if (
        approval.approverId !==
        actorId
      ) {
        return res.status(
          403,
        ).json({
          ok:
            false,

          error:
            "executive_approval_actor_not_authorized",
        });
      }

      try {
        const result =
          approvalDecisionService
            .reject({
              approvalId,
              reason,
            });

        return res.json({
          ok:
            true,

          approval:
            result.approval,

          decision:
            result.decision,
        });
      } catch (error) {
        return respondDomainError(
          res,
          error,
        );
      }
    },
  );
}
