import type {
  Express,
  Request,
  Response,
} from "express";

import type {
  CanonicalReviewBatchService,
  CanonicalReviewDecision,
} from "../../knowledge-preservation/review/index.js";

import {
  listCanonicalReviewBatches,
} from "../../knowledge-preservation/review/index.js";

export interface CanonicalReviewBatchRuntime {
  batchService:
    CanonicalReviewBatchService;
}

function isDecision(
  value:
    unknown,
): value is CanonicalReviewDecision {
  return (
    value ===
      "approved" ||
    value ===
      "rejected" ||
    value ===
      "remediation_required"
  );
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
      "canonical_review_batch_not_found" ||
    message.startsWith(
      "knowledge_package_not_found:",
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
      "knowledge_package_not_batch_eligible:",
    ) ||
    message.startsWith(
      "knowledge_package_no_longer_batch_eligible:",
    ) ||
    message ===
      "canonical_review_batch_already_decided"
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

export function registerCanonicalReviewBatchRoutes(
  app:
    Express,

  runtime:
    CanonicalReviewBatchRuntime,
): void {
  app.get(
    "/api/knowledge/canonical-review/batches",
    (
      _req:
        Request,

      res:
        Response,
    ) => {
      const batches =
        listCanonicalReviewBatches();

      return res.json({
        ok:
          true,

        batches,

        summary: {
          total:
            batches.length,

          pending:
            batches.filter(
              (batch) =>
                batch.status ===
                "pending",
            ).length,

          approved:
            batches.filter(
              (batch) =>
                batch.status ===
                "approved",
            ).length,

          rejected:
            batches.filter(
              (batch) =>
                batch.status ===
                "rejected",
            ).length,

          remediationRequired:
            batches.filter(
              (batch) =>
                batch.status ===
                "remediation_required",
            ).length,
        },
      });
    },
  );

  app.post(
    "/api/knowledge/canonical-review/batches",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const packageIds =
        Array.isArray(
          req.body?.packageIds,
        )
          ? req.body.packageIds.filter(
              (
                value:
                  unknown,
              ): value is string =>
                typeof value ===
                "string",
            )
          : [];

      try {
        const batch =
          runtime.batchService
            .create(
              packageIds,
            );

        return res.status(
          201,
        ).json({
          ok:
            true,

          batch,
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
    "/api/knowledge/canonical-review/batches/:batchId/decision",
    (
      req:
        Request,

      res:
        Response,
    ) => {
      const decision =
        req.body?.decision;

      if (
        !isDecision(
          decision,
        )
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
        typeof req.body
          ?.reviewerId ===
          "string"
          ? req.body
              .reviewerId
              .trim()
          : "";

      if (
        !reviewerId
      ) {
        return res.status(
          400,
        ).json({
          ok:
            false,

          error:
            "canonical_review_reviewer_required",
        });
      }

      try {
        const batchIdParam =
          req.params
            .batchId;

        const batchId =
          Array.isArray(
            batchIdParam,
          )
            ? batchIdParam[0] ?? ""
            : batchIdParam ?? "";

        const batch =
          runtime.batchService
            .review(
              batchId,
              {
                decision,

                reviewerId,

                reason:
                  typeof req.body
                    ?.reason ===
                    "string"
                    ? req.body
                        .reason
                    : undefined,

                reviewedAt:
                  typeof req.body
                    ?.reviewedAt ===
                    "number"
                    ? req.body
                        .reviewedAt
                    : undefined,
              },
            );

        /*
         * Constitutional boundary:
         *
         * A batch decision delegates to CanonicalReviewService
         * for each package.
         *
         * This route MUST NOT perform canonical promotion.
         */
        return res.json({
          ok:
            true,

          batch,

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
