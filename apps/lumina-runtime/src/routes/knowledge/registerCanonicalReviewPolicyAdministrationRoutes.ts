import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  CanonicalReviewPolicyAdministrationService,
  CreateCanonicalReviewPolicyInput,
} from "../../knowledge-preservation/review/index.js";

export interface CanonicalReviewPolicyAdministrationRuntime {
  service:
    CanonicalReviewPolicyAdministrationService;
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
      "canonical_review_policy_not_found:",
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
      "canonical_review_policy_already_exists:",
    ) ||
    message.startsWith(
      "canonical_review_policy_cannot_activate:",
    ) ||
    message.startsWith(
      "canonical_review_policy_cannot_revoke:",
    ) ||
    message.startsWith(
      "canonical_review_policy_cannot_supersede:",
    ) ||
    message ===
      "canonical_review_policy_supersession_id_mismatch"
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

function stringValue(
  value:
    unknown,
): string {
  return typeof value ===
    "string"
    ? value
    : "";
}

function policyInput(
  body:
    Record<
      string,
      unknown
    >,
): CreateCanonicalReviewPolicyInput {
  const rawRules =
    typeof body.rules ===
      "object" &&
    body.rules !==
      null
      ? body.rules as Record<
          string,
          unknown
        >
      : {};

  return {
    id:
      stringValue(
        body.id,
      ),

    version:
      stringValue(
        body.version,
      ),

    title:
      stringValue(
        body.title,
      ),

    authority:
      stringValue(
        body.authority,
      ),

    scope:
      stringValue(
        body.scope,
      ),

    owner:
      stringValue(
        body.owner,
      ),

    rules: {
      requireCompleteGovernanceIdentity:
        rawRules
          .requireCompleteGovernanceIdentity ===
        true,

      requireProvenance:
        rawRules
          .requireProvenance ===
        true,

      requireValidationPassed:
        rawRules
          .requireValidationPassed ===
        true,

      excludedAuthorities:
        Array.isArray(
          rawRules
            .excludedAuthorities,
        )
          ? rawRules
              .excludedAuthorities
              .filter(
                (
                  value,
                ): value is string =>
                  typeof value ===
                  "string",
              )
          : [],
    },
  };
}

function actor(
  body:
    Record<
      string,
      unknown
    >,
): {
  actorId:
    string;

  timestamp?:
    number;
} {
  return {
    actorId:
      stringValue(
        body.actorId,
      ),

    timestamp:
      typeof body.timestamp ===
        "number"
        ? body.timestamp
        : undefined,
  };
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

export function registerCanonicalReviewPolicyAdministrationRoutes(
  app:
    Express,

  runtime:
    CanonicalReviewPolicyAdministrationRuntime,
): void {
  app.post(
    "/api/knowledge/canonical-review/policies",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      try {
        const policy =
          runtime.service
            .createDraft(
              policyInput(
                req.body ?? {},
              ),
            );

        /*
         * Governance invariant:
         *
         * Policy creation produces DRAFT authority only.
         * It does not authorize packages.
         */
        return res.status(
          201,
        ).json({
          ok:
            true,

          policy,

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
    "/api/knowledge/canonical-review/policies/:policyId/:version/activate",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      try {
        const policy =
          runtime.service
            .activate(
              param(
                req.params
                  .policyId,
              ),

              param(
                req.params
                  .version,
              ),

              actor(
                req.body ?? {},
              ),
            );

        return res.json({
          ok:
            true,

          policy,

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
    "/api/knowledge/canonical-review/policies/:policyId/:version/revoke",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      try {
        const policy =
          runtime.service
            .revoke(
              param(
                req.params
                  .policyId,
              ),

              param(
                req.params
                  .version,
              ),

              actor(
                req.body ?? {},
              ),
            );

        return res.json({
          ok:
            true,

          policy,

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
    "/api/knowledge/canonical-review/policies/:policyId/:version/supersede",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const body =
        req.body ?? {};

      const replacement =
        typeof body.replacement ===
          "object" &&
        body.replacement !==
          null
          ? body.replacement as Record<
              string,
              unknown
            >
          : {};

      try {
        const result =
          runtime.service
            .supersede(
              param(
                req.params
                  .policyId,
              ),

              param(
                req.params
                  .version,
              ),

              policyInput(
                replacement,
              ),

              actor(
                body,
              ),
            );

        return res.json({
          ok:
            true,

          previous:
            result.previous,

          replacement:
            result.replacement,

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
}
