import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  KnowledgePackageService,
} from "../../knowledge-preservation/package/index.js";

import {
  CanonicalReviewService,
  classifyCanonicalReview,
} from "../../knowledge-preservation/review/index.js";

export interface CanonicalReviewRuntime {
  reviewService:
    CanonicalReviewService;

  packageService:
    KnowledgePackageService;
}

function reviewStatus(
  state:
    string,

  approvalState:
    string,
):
  | "pending"
  | "approved"
  | "rejected"
  | "remediation_required"
  | "not_reviewable" {
  if (
    state ===
      "awaiting_review" &&
    approvalState ===
      "pending_review"
  ) {
    return "pending";
  }

  if (
    state ===
      "approved" &&
    approvalState ===
      "approved"
  ) {
    return "approved";
  }

  if (
    state ===
      "rejected" &&
    approvalState ===
      "rejected"
  ) {
    return "rejected";
  }

  if (
    approvalState ===
      "remediation_required"
  ) {
    return "remediation_required";
  }

  return "not_reviewable";
}

export function registerCanonicalReviewRoutes(
  app:
    Express,

  runtime:
    CanonicalReviewRuntime,
): void {
  app.get(
    "/api/knowledge/canonical-review",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      const packages =
        runtime.packageService
          .list()
          .map(
            (
              knowledgePackage,
            ) => ({
              ...knowledgePackage,

              reviewStatus:
                reviewStatus(
                  knowledgePackage.state,
                  knowledgePackage.approvalState,
                ),

              reviewClassification:
                knowledgePackage.state ===
                    "awaiting_review" &&
                  knowledgePackage.approvalState ===
                    "pending_review"
                  ? classifyCanonicalReview(
                      knowledgePackage,
                    )
                  : null,
            }),
          )
          .filter(
            (
              knowledgePackage,
            ) =>
              knowledgePackage
                .reviewStatus !==
              "not_reviewable",
          )
          .sort(
            (
              left,
              right,
            ) =>
              right.updatedAt -
              left.updatedAt,
          );

      return res.json({
        ok:
          true,

        packages,

        summary: {
          total:
            packages.length,

          pending:
            packages.filter(
              (item) =>
                item.reviewStatus ===
                "pending",
            ).length,

          approved:
            packages.filter(
              (item) =>
                item.reviewStatus ===
                "approved",
            ).length,

          rejected:
            packages.filter(
              (item) =>
                item.reviewStatus ===
                "rejected",
            ).length,

          remediationRequired:
            packages.filter(
              (item) =>
                item.reviewStatus ===
                "remediation_required",
            ).length,

          individual:
            packages.filter(
              (item) =>
                item.reviewClassification
                  ?.mode ===
                "individual",
            ).length,

          batchCandidates:
            packages.filter(
              (item) =>
                item.reviewClassification
                  ?.mode ===
                "batch_candidate",
            ).length,

          policyCandidates:
            packages.filter(
              (item) =>
                item.reviewClassification
                  ?.mode ===
                "policy_candidate",
            ).length,

          blocked:
            packages.filter(
              (item) =>
                item.reviewClassification
                  ?.mode ===
                "blocked",
            ).length,
        },
      });
    },
  );

  app.post(
    "/api/knowledge/canonical-review",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const body =
        req.body ?? {};

      try {
        const decision =
          body.decision;

        if (
          decision !==
            "approved" &&
          decision !==
            "rejected" &&
          decision !==
            "remediation_required"
        ) {
          return res.status(
            400,
          ).json({
            ok:
              false,

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

        const evidenceConsidered =
          Array.isArray(
            body.evidenceConsidered,
          )
            ? body.evidenceConsidered.filter(
                (
                  value:
                    unknown,
                ): value is string =>
                  typeof value ===
                  "string",
              )
            : undefined;

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

              evidenceConsidered,

              reason:
                typeof body.reason ===
                  "string"
                  ? body.reason
                  : undefined,
            });

        /*
         * Constitutional boundary:
         *
         * Canonical Review records a human governance
         * decision only.
         *
         * It MUST NOT promote Canonical Knowledge.
         *
         * Promotion belongs exclusively to the governed
         * canonical-promotion boundary.
         */
        return res.json({
          ok:
            true,

          review,

          promotion:
            null,
        });
      } catch (
        error
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            error instanceof Error
              ? error.message
              : String(
                  error,
                ),
        });
      }
    },
  );
}
