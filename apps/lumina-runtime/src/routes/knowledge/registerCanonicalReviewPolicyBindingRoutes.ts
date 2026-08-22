import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  BindCanonicalReviewPolicyInput,
  BindCanonicalReviewPolicyResult,
} from "../../knowledge-preservation/review/index.js";

export interface CanonicalReviewPolicyBindingPort {
  bind(
    input:
      BindCanonicalReviewPolicyInput,
  ):
    BindCanonicalReviewPolicyResult;
}

export interface CanonicalReviewPolicyBindingRuntime {
  service:
    CanonicalReviewPolicyBindingPort;
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
    return value[0] ??
      "";
  }

  return value ??
    "";
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
    message ===
      "knowledge_package_not_found" ||
    message.startsWith(
      "canonical_review_policy_binding_policy_not_found:",
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
      "canonical_review_policy_binding_conflict:",
    ) ||
    message.startsWith(
      "canonical_review_policy_binding_policy_not_active:",
    ) ||
    message ===
      "canonical_review_policy_binding_package_not_awaiting_review" ||
    message ===
      "canonical_review_policy_binding_constitutional_authority_requires_individual_review" ||
    message ===
      "canonical_review_policy_binding_governance_identity_incomplete" ||
    message ===
      "canonical_review_policy_binding_provenance_incomplete" ||
    message ===
      "canonical_review_policy_binding_validation_not_passed" ||
    message ===
      "canonical_review_policy_binding_authority_mismatch" ||
    message ===
      "canonical_review_policy_binding_scope_mismatch" ||
    message ===
      "canonical_review_policy_binding_authority_excluded"
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

export function registerCanonicalReviewPolicyBindingRoutes(
  app:
    Express,

  runtime:
    CanonicalReviewPolicyBindingRuntime,
): void {
  app.post(
    "/api/knowledge/canonical-review/packages/:packageId/policy-binding",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const body =
        req.body ??
        {};

      const packageId =
        param(
          req.params
            .packageId,
        ).trim();

      const policyId =
        stringValue(
          body.policyId,
        );

      const policyVersion =
        stringValue(
          body.policyVersion,
        );

      const boundBy =
        stringValue(
          body.boundBy,
        );

      if (!packageId) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "canonical_review_policy_binding_package_id_required",
        });
      }

      if (!policyId) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "canonical_review_policy_binding_policy_id_required",
        });
      }

      if (!policyVersion) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "canonical_review_policy_binding_policy_version_required",
        });
      }

      if (!boundBy) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "canonical_review_policy_binding_actor_id_required",
        });
      }

      try {
        const result =
          runtime.service
            .bind({
              packageId,
              policyId,
              policyVersion,
              boundBy,

              boundAt:
                typeof body.boundAt ===
                  "number"
                  ? body.boundAt
                  : undefined,
            });

        return res.json({
          ok:
            true,

          ...result,

          /*
           * Governance boundary:
           * binding establishes policy jurisdiction only.
           */
          reviewDecision:
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
}
