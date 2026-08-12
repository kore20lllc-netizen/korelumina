import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  ExecutiveDelegationActionReadinessService,
} from "../executive/action/index.js";

import type {
  ExecutiveDelegationService,
} from "../executive/delegation/index.js";

export interface ExecutiveDelegationRouteDependencies {
  delegationService:
    ExecutiveDelegationService;

  readinessService:
    ExecutiveDelegationActionReadinessService;
}

function readString(
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
      : "executive_delegation_acceptance_failed";

  if (
    message ===
      "executive_delegation_not_found" ||
    message ===
      "executive_action_not_found"
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
      "executive_delegation_not_assigned" ||
    message ===
      "executive_action_not_planned" ||
    message ===
      "executive_action_delegation_mismatch" ||
    message ===
      "executive_action_owner_mismatch"
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
      "executive_delegation_acceptor_required"
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
      "executive_delegation_acceptor_not_authorized"
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

  console.error(
    "[executive/delegation/accept]",
    error,
  );

  return res.status(
    500,
  ).json({
    ok:
      false,

    error:
      "executive_delegation_acceptance_failed",
  });
}

export function registerExecutiveDelegationRoute(
  app: Express,
  dependencies:
    ExecutiveDelegationRouteDependencies,
): void {
  const {
    delegationService,
    readinessService,
  } =
    dependencies;

  app.get(
    "/api/executive/delegations/:id",
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
            "executive_delegation_id_required",
        });
      }

      const delegation =
        delegationService.get(
          id,
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

          id,
        });
      }

      return res.json({
        ok:
          true,

        delegation,
      });
    },
  );

  app.post(
    "/api/executive/delegations/:id/accept",
    (
      req: Request,
      res: Response,
    ) => {
      const delegationId =
        readString(
          req.params.id,
        );

      const actionId =
        readString(
          req.body?.actionId,
        );

      const actorId =
        readString(
          req.body?.actorId,
        );

      if (
        delegationId.length ===
        0
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "executive_delegation_id_required",
        });
      }

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
            "executive_delegation_acceptor_required",
        });
      }

      try {
        const result =
          readinessService
            .accept({
              delegationId,
              actionId,
              actorId,
            });

        return res.json({
          ok:
            true,

          delegation:
            result.delegation,

          action:
            result.action,
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
