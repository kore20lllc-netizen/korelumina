import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  CanonicalReviewPolicyExecutionService,
} from "../../knowledge-preservation/review/index.js";

export interface CanonicalReviewPolicyExecutionRuntime {
  service:
    CanonicalReviewPolicyExecutionService;
}

function param(
  value:
    string |
    string[] |
    undefined,
): string {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function stringValue(
  value:
    unknown,
): string {
  return typeof value ===
    "string"
    ? value
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
      "canonical_review_policy_execution_policy_not_found:",
    )
  ) {
    return res.status(
      404,
    ).json({
      ok:
        false,

      error:
        message,

      promotion:
        null,
    });
  }

  if (
    message.startsWith(
      "canonical_review_policy_execution_policy_not_active:",
    )
  ) {
    return res.status(
      409,
    ).json({
      ok:
        false,

      error:
        message,

      promotion:
        null,
    });
  }

  return res.status(
    400,
  ).json({
    ok:
      false,

    error:
      message,

    promotion:
      null,
  });
}

export function registerCanonicalReviewPolicyExecutionRoutes(
  app:
    Express,

  runtime:
    CanonicalReviewPolicyExecutionRuntime,
): void {
  app.get(
    "/api/knowledge/canonical-review/policies/:policyId/:version/execution",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      try {
        const result =
          runtime.service
            .evaluate(
              param(
                req.params
                  .policyId,
              ),

              param(
                req.params
                  .version,
              ),
            );

        const evaluations =
          result.evaluations;

        return res.json({
          ok:
            true,

          policy: {
            id:
              result.policy.id,

            version:
              result.policy.version,

            status:
              result.policy.status,
          },

          eligiblePackages:
            evaluations.length,

          compliantPackages:
            evaluations.filter(
              (item) =>
                item.compliant,
            ).length,

          exceptions:
            evaluations.filter(
              (item) =>
                item.exceptions
                  .length >
                0,
            ).length,

          blocked:
            evaluations.filter(
              (item) =>
                item.blocked,
            ).length,

          evaluations,

          packageDecision:
            null,

          promotion:
            null,
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

  app.post(
    "/api/knowledge/canonical-review/policies/:policyId/:version/execute",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const body =
        req.body ?? {};

      try {
        const result =
          runtime.service
            .execute({
              policyId:
                param(
                  req.params
                    .policyId,
                ),

              policyVersion:
                param(
                  req.params
                    .version,
                ),

              actorId:
                stringValue(
                  body.actorId,
                ),

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

          /*
           * Explicit constitutional boundary:
           * execution may create review decisions,
           * but promotion is never performed here.
           */
          promotion:
            null,
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
