import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveActionExecutionAuthorizationService,
  ExecutiveActionExecutionOutcomeService,
  ExecutiveActionExecutionStartService,
  ExecutiveActionService,
} from "../executive/action/index.js";

import type {
  ExecutiveDelegationService,
} from "../executive/delegation/index.js";

function readString(
  value: unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

export interface ExecutiveActionRouteDependencies {
  actionService:
    ExecutiveActionService;

  delegationService:
    ExecutiveDelegationService;

  executionAuthorizationService:
    ExecutiveActionExecutionAuthorizationService;

  executionStartService:
    ExecutiveActionExecutionStartService;

  executionOutcomeService:
    ExecutiveActionExecutionOutcomeService;
}

function respondAuthorizationError(
  res: Response,
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : "executive_execution_authorization_failed";

  if (
    message ===
      "executive_action_not_found" ||
    message ===
      "executive_delegation_not_found"
  ) {
    return res.status(
      404,
    ).json({
      ok: false,
      error: message,
    });
  }

  if (
    message ===
      "executive_execution_authorizer_required"
  ) {
    return res.status(
      400,
    ).json({
      ok: false,
      error: message,
    });
  }

  if (
    message ===
      "executive_execution_authorizer_not_authorized"
  ) {
    return res.status(
      403,
    ).json({
      ok: false,
      error: message,
    });
  }

  if (
    message ===
      "executive_action_not_ready_for_execution_authorization" ||
    message ===
      "executive_delegation_not_accepted_for_execution_authorization" ||
    message ===
      "executive_execution_authorization_delegation_mismatch" ||
    message ===
      "executive_execution_authorization_owner_mismatch" ||
    message ===
      "executive_execution_authorization_evidence_required" ||
    message ===
      "executive_execution_authorization_already_exists" ||
    message ===
      "executive_action_already_execution_authorized"
  ) {
    return res.status(
      409,
    ).json({
      ok: false,
      error: message,
    });
  }

  console.error(
    "[executive/action/authorize-execution]",
    error,
  );

  return res.status(
    500,
  ).json({
    ok: false,
    error:
      "executive_execution_authorization_failed",
  });
}

function respondExecutionOutcomeError(
  res: Response,
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : "executive_execution_outcome_failed";

  if (
    message ===
      "executive_action_not_found" ||
    message ===
      "executive_delegation_not_found" ||
    message ===
      "executive_execution_start_audit_not_found"
  ) {
    return res.status(
      404,
    ).json({
      ok: false,
      error: message,
    });
  }

  if (
    message ===
      "executive_execution_outcome_actor_required" ||
    message ===
      "executive_execution_start_audit_id_required" ||
    message ===
      "executive_execution_result_summary_required" ||
    message ===
      "executive_execution_failure_reason_required" ||
    message ===
      "executive_execution_compensation_plan_required"
  ) {
    return res.status(
      400,
    ).json({
      ok: false,
      error: message,
    });
  }

  if (
    message ===
      "executive_execution_outcome_actor_not_authorized" ||
    message ===
      "executive_execution_start_audit_actor_mismatch"
  ) {
    return res.status(
      403,
    ).json({
      ok: false,
      error: message,
    });
  }

  if (
    message ===
      "executive_action_not_running_for_execution_outcome" ||
    message ===
      "executive_execution_outcome_delegation_required" ||
    message ===
      "executive_delegation_not_in_progress_for_execution_outcome" ||
    message ===
      "executive_execution_outcome_owner_mismatch" ||
    message ===
      "executive_execution_start_audit_invalid" ||
    message ===
      "executive_execution_start_audit_action_mismatch" ||
    message ===
      "executive_execution_start_audit_delegation_mismatch" ||
    message ===
      "executive_execution_outcome_evidence_required"
  ) {
    return res.status(
      409,
    ).json({
      ok: false,
      error: message,
    });
  }

  console.error(
    "[executive/action/execution-outcome]",
    error,
  );

  return res.status(
    500,
  ).json({
    ok: false,
    error:
      "executive_execution_outcome_failed",
  });
}

function respondExecutionStartError(
  res: Response,
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : "executive_execution_start_failed";

  if (
    message ===
      "executive_action_not_found" ||
    message ===
      "executive_delegation_not_found" ||
    message ===
      "executive_execution_authorization_not_found"
  ) {
    return res.status(
      404,
    ).json({
      ok: false,
      error: message,
    });
  }

  if (
    message ===
      "executive_execution_starter_required"
  ) {
    return res.status(
      400,
    ).json({
      ok: false,
      error: message,
    });
  }

  if (
    message ===
      "executive_execution_starter_not_authorized" ||
    message ===
      "executive_execution_start_actor_authorization_mismatch"
  ) {
    return res.status(
      403,
    ).json({
      ok: false,
      error: message,
    });
  }

  if (
    message ===
      "executive_action_not_ready_for_execution_start" ||
    message ===
      "executive_execution_start_delegation_required" ||
    message ===
      "executive_delegation_not_accepted_for_execution_start" ||
    message ===
      "executive_execution_start_owner_mismatch" ||
    message ===
      "executive_execution_authorization_already_consumed" ||
    message ===
      "executive_execution_start_action_authorization_mismatch" ||
    message ===
      "executive_execution_start_delegation_authorization_mismatch" ||
    message ===
      "executive_execution_start_evidence_required"
  ) {
    return res.status(
      409,
    ).json({
      ok: false,
      error: message,
    });
  }

  console.error(
    "[executive/action/start-execution]",
    error,
  );

  return res.status(
    500,
  ).json({
    ok: false,
    error:
      "executive_execution_start_failed",
  });
}

export function registerExecutiveActionRoute(
  app: Express,
  dependencies:
    ExecutiveActionRouteDependencies,
): void {
  const {
    actionService,
    delegationService,
    executionAuthorizationService,
    executionStartService,
    executionOutcomeService,
  } =
    dependencies;

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
        id.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok: false,
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
          ok: false,
          error:
            "executive_action_not_found",
          id,
        });
      }

      return res.json({
        ok: true,
        action,
      });
    },
  );

  app.post(
    "/api/executive/actions/:id/authorize-execution",
    (
      req: Request,
      res: Response,
    ) => {
      const actionId =
        readString(
          req.params.id,
        );

      const actorId =
        readString(
          req.body?.actorId,
        );

      const authorizationId =
        readString(
          req.body?.authorizationId,
        );

      if (
        actionId.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok: false,
          error:
            "executive_action_id_required",
        });
      }

      if (
        actorId.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok: false,
          error:
            "executive_execution_authorizer_required",
        });
      }

      const action =
        actionService.get(
          actionId,
        );

      if (
        !action
      ) {
        return res.status(
          404,
        ).json({
          ok: false,
          error:
            "executive_action_not_found",
        });
      }

      const delegationId =
        readString(
          action.delegationId,
        );

      if (
        delegationId.length ===
        0
      ) {
        return res.status(
          409,
        ).json({
          ok: false,
          error:
            "executive_execution_authorization_delegation_required",
        });
      }

      const delegation =
        delegationService.get(
          delegationId,
        );

      if (
        !delegation
      ) {
        return res.status(
          404,
        ).json({
          ok: false,
          error:
            "executive_delegation_not_found",
        });
      }

      try {
        const authorization =
          executionAuthorizationService
            .authorize({
              action,
              delegation,
              actorId,

              authorizationId:
                authorizationId.length >
                0
                  ? authorizationId
                  : undefined,
            });

        return res.json({
          ok: true,
          authorization,

          action:
            actionService.get(
              action.id,
            ),

          delegation:
            delegationService.get(
              delegation.id,
            ),
        });
      } catch (error) {
        return respondAuthorizationError(
          res,
          error,
        );
      }
    },
  );

  app.post(
    "/api/executive/actions/:id/start-execution",
    (
      req: Request,
      res: Response,
    ) => {
      const actionId =
        readString(
          req.params.id,
        );

      const actorId =
        readString(
          req.body?.actorId,
        );

      const authorizationId =
        readString(
          req.body?.authorizationId,
        );

      if (
        actionId.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok: false,
          error:
            "executive_action_id_required",
        });
      }

      if (
        actorId.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok: false,
          error:
            "executive_execution_starter_required",
        });
      }

      if (
        authorizationId.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok: false,
          error:
            "executive_execution_authorization_id_required",
        });
      }

      try {
        const result =
          executionStartService
            .start({
              actionId,
              authorizationId,
              actorId,
            });

        return res.json({
          ok: true,

          action:
            result.action,

          delegation:
            result.delegation,

          authorization:
            result.authorization,

          audit:
            result.audit,
        });
      } catch (error) {
        return respondExecutionStartError(
          res,
          error,
        );
      }
    },
  );

  app.post(
    "/api/executive/actions/:id/complete-execution",
    (
      req: Request,
      res: Response,
    ) => {
      const actionId =
        readString(
          req.params.id,
        );

      const actorId =
        readString(
          req.body?.actorId,
        );

      const startAuditId =
        readString(
          req.body?.startAuditId,
        );

      const resultSummary =
        readString(
          req.body?.resultSummary,
        );

      const evidence =
        Array.isArray(
          req.body?.evidence,
        )
          ? req.body.evidence.filter(
              (
                value: unknown,
              ): value is string =>
                typeof value ===
                "string",
            )
          : undefined;

      if (!actionId) {
        return res.status(400).json({
          ok: false,
          error:
            "executive_action_id_required",
        });
      }

      try {
        const result =
          executionOutcomeService
            .complete({
              actionId,
              actorId,
              startAuditId,
              resultSummary,
              evidence,
            });

        return res.json({
          ok: true,
          action:
            result.action,
          delegation:
            result.delegation,
          audit:
            result.audit,
        });
      } catch (error) {
        return respondExecutionOutcomeError(
          res,
          error,
        );
      }
    },
  );

  app.post(
    "/api/executive/actions/:id/fail-execution",
    (
      req: Request,
      res: Response,
    ) => {
      const actionId =
        readString(
          req.params.id,
        );

      const actorId =
        readString(
          req.body?.actorId,
        );

      const startAuditId =
        readString(
          req.body?.startAuditId,
        );

      const failureReason =
        readString(
          req.body?.failureReason,
        );

      const compensationPlan =
        readString(
          req.body?.compensationPlan,
        );

      const compensationRequired =
        req.body?.compensationRequired ===
        true;

      const evidence =
        Array.isArray(
          req.body?.evidence,
        )
          ? req.body.evidence.filter(
              (
                value: unknown,
              ): value is string =>
                typeof value ===
                "string",
            )
          : undefined;

      if (!actionId) {
        return res.status(400).json({
          ok: false,
          error:
            "executive_action_id_required",
        });
      }

      try {
        const result =
          executionOutcomeService
            .fail({
              actionId,
              actorId,
              startAuditId,
              failureReason,
              compensationRequired,

              compensationPlan:
                compensationPlan.length >
                0
                  ? compensationPlan
                  : undefined,

              evidence,
            });

        return res.json({
          ok: true,
          action:
            result.action,
          delegation:
            result.delegation,
          audit:
            result.audit,
        });
      } catch (error) {
        return respondExecutionOutcomeError(
          res,
          error,
        );
      }
    },
  );

}
