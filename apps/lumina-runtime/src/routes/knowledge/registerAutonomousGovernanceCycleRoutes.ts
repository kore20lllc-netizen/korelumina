import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  AutonomousGovernanceCycleInput,
  AutonomousGovernanceCycleResult,
} from "../../knowledge-preservation/governance/index.js";

export interface AutonomousGovernanceCyclePort {
  execute(
    input:
      AutonomousGovernanceCycleInput,
  ):
    AutonomousGovernanceCycleResult;
}

export interface AutonomousGovernanceCycleRuntime {
  orchestrator:
    AutonomousGovernanceCyclePort;
}

function stringValue(
  value:
    unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function errorResponse(
  error:
    unknown,

  res:
    Response,
) {
  const message =
    error instanceof Error
      ? error.message
      : String(
          error,
        );

  if (
    message.startsWith(
      "autonomous_governance_cycle_policy_not_found:",
    )
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
    message.startsWith(
      "autonomous_governance_cycle_policy_not_active:",
    )
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

  return res.status(
    400,
  ).json({
    ok:
      false,

    error:
      message,
  });
}

export function registerAutonomousGovernanceCycleRoutes(
  app:
    Express,

  runtime:
    AutonomousGovernanceCycleRuntime,
): void {
  app.post(
    "/api/knowledge/governance/autonomous-cycle",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const body =
        req.body ??
        {};

      const policyId =
        stringValue(
          body.policyId,
        );

      const policyVersion =
        stringValue(
          body.policyVersion,
        );

      const actorId =
        stringValue(
          body.actorId,
        );

      if (!policyId) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "autonomous_governance_cycle_policy_id_required",
        });
      }

      if (!policyVersion) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "autonomous_governance_cycle_policy_version_required",
        });
      }

      if (!actorId) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "autonomous_governance_cycle_actor_id_required",
        });
      }

      try {
        const result =
          runtime.orchestrator
            .execute({
              policyId,
              policyVersion,
              actorId,

              executedAt:
                typeof body.executedAt ===
                  "number"
                  ? body.executedAt
                  : undefined,
            });

        return res.json({
          ok:
            true,

          ...result,
        });
      } catch (
        error
      ) {
        return errorResponse(
          error,
          res,
        );
      }
    },
  );
}
