import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveActionExecutionAuthorizationService,
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
      ok:
        false,

      error:
        message,
    });
  }

  if (
    message ===
      "executive_execution_authorizer_required"
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

  if (
    message ===
      "executive_execution_authorizer_not_authorized"
  ) {
    return res.status(
      403,
    ).json({
      ok:
        false,

      error:
        message,
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
      ok:
        false,

      error:
        message,
    });
  }

  console.error(
    "[executive/action/authorize-execution]",
    error,
  );

  return res.status(
    500,
  ).json({
    ok:
      false,

    error:
      "executive_execution_authorization_failed",
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
          ok:
            false,

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
          ok:
            false,

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
          ok:
            false,

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
          ok:
            false,

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
          ok:
            false,

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

        const currentAction =
          actionService.get(
            action.id,
          );

        const currentDelegation =
          delegationService.get(
            delegation.id,
          );

        return res.json({
          ok:
            true,

          authorization,

          action:
            currentAction,

          delegation:
            currentDelegation,
        });
      } catch (error) {
        return respondAuthorizationError(
          res,
          error,
        );
      }
    },
  );
}
