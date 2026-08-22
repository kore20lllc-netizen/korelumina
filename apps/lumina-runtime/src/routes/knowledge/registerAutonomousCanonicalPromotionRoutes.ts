import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  AutonomousGovernedCanonicalPromotionInput,
  AutonomousGovernedCanonicalPromotionResult,
} from "../../knowledge-preservation/promotion/index.js";

export interface AutonomousCanonicalPromotionExecutorPort {
  execute(
    input:
      AutonomousGovernedCanonicalPromotionInput,
  ):
    AutonomousGovernedCanonicalPromotionResult;
}

export interface AutonomousCanonicalPromotionRuntime {
  executor:
    AutonomousCanonicalPromotionExecutorPort;
}

function requiredString(
  value:
    unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

export function registerAutonomousCanonicalPromotionRoutes(
  app:
    Express,

  runtime:
    AutonomousCanonicalPromotionRuntime,
): void {
  app.post(
    "/api/knowledge/canonical-promotion/autonomous",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const body =
        req.body ?? {};

      const policyId =
        requiredString(
          body.policyId,
        );

      const policyVersion =
        requiredString(
          body.policyVersion,
        );

      const actorId =
        requiredString(
          body.actorId,
        );

      if (!policyId) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "autonomous_canonical_promotion_policy_id_required",
        });
      }

      if (!policyVersion) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "autonomous_canonical_promotion_policy_version_required",
        });
      }

      if (!actorId) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "autonomous_canonical_promotion_actor_id_required",
        });
      }

      try {
        const result =
          runtime.executor.execute({
            policyId,
            policyVersion,
            actorId,
          });

        return res.json({
          ok:
            true,

          ...result,
        });
      } catch (
        error
      ) {
        const message =
          error instanceof
            Error
            ? error.message
            : String(
                error,
              );

        if (
          message.startsWith(
            "autonomous_canonical_promotion_policy_not_found:",
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
            "autonomous_canonical_promotion_policy_not_active:",
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
    },
  );
}
