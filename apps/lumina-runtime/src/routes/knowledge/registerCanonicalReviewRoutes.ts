import type {
  Express,
  Request,
  Response,
} from "express";

import {
  CanonicalReviewService,
} from "../../knowledge-preservation/review/index.js";

import {
  GovernedCanonicalPromotionService,
} from "../../knowledge-preservation/promotion/index.js";

export interface CanonicalReviewRuntime {
  reviewService:
    CanonicalReviewService;

  promotionService:
    GovernedCanonicalPromotionService;
}

export function registerCanonicalReviewRoutes(
  app: Express,
  runtime:
    CanonicalReviewRuntime,
): void {
  app.post(
    "/api/knowledge/canonical-review",
    (
      req: Request,
      res: Response,
    ) => {
      const body =
        req.body ?? {};

      try {
        const decision =
          body.decision;

        if (
          decision !== "approved" &&
          decision !== "rejected"
        ) {
          return res.status(
            400,
          ).json({
            ok: false,
            error:
              "canonical_review_decision_invalid",
          });
        }

        const reviewerId =
          typeof body.reviewerId ===
            "string"
            ? body.reviewerId
            : "";

        const packageId =
          typeof body.packageId ===
            "string"
            ? body.packageId
            : "";

        const review =
          runtime.reviewService
            .review({
              packageId,
              decision,
              reviewerId,
              reviewedAt:
                typeof body.reviewedAt ===
                  "number"
                  ? body.reviewedAt
                  : undefined,
              reason:
                typeof body.reason ===
                  "string"
                  ? body.reason
                  : undefined,
            });

        if (
          decision ===
          "rejected"
        ) {
          return res.json({
            ok: true,
            review,
            promotion: null,
          });
        }

        const organizationId =
          typeof body.organizationId ===
            "string"
            ? body.organizationId.trim()
            : "";

        if (
          !organizationId
        ) {
          return res.status(
            400,
          ).json({
            ok: false,
            error:
              "canonical_promotion_organization_required",
          });
        }

        const promotion =
          runtime.promotionService
            .promoteApprovedPackage(
              packageId,
              {
                organizationId,

                projectId:
                  typeof body.projectId ===
                    "string"
                    ? body.projectId
                    : undefined,

                teamId:
                  typeof body.teamId ===
                    "string"
                    ? body.teamId
                    : undefined,
              },
            );

        return res.json({
          ok: true,
          review,
          promotion,
        });
      } catch (error) {
        return res.status(
          400,
        ).json({
          ok: false,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    },
  );
}
