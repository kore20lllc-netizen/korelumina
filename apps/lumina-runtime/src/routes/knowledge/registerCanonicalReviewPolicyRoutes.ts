import type {
  Express,
  Request,
  Response,
} from "express";

import {
  listCanonicalReviewPolicies,
} from "../../knowledge-preservation/review/index.js";

export function registerCanonicalReviewPolicyRoutes(
  app:
    Express,
): void {
  app.get(
    "/api/knowledge/canonical-review/policies",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      const policies =
        listCanonicalReviewPolicies();

      return res.json({
        ok:
          true,

        policies,

        summary: {
          total:
            policies.length,

          active:
            policies.filter(
              (policy) =>
                policy.status ===
                "active",
            ).length,

          draft:
            policies.filter(
              (policy) =>
                policy.status ===
                "draft",
            ).length,

          revoked:
            policies.filter(
              (policy) =>
                policy.status ===
                "revoked",
            ).length,

          superseded:
            policies.filter(
              (policy) =>
                policy.status ===
                "superseded",
            ).length,
        },
      });
    },
  );
}
