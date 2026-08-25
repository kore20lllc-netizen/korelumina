import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisConversationExpectedHistoryCandidateReviewService,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisConversationExpectedHistoryCandidateReviewRouteRuntime {
  service:
    GenesisConversationExpectedHistoryCandidateReviewService;
}


function record(
  value:
    unknown,
): Record<
  string,
  unknown
> {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "genesis_conversation_expected_history_candidate_review_body_invalid",
    );
  }

  return value as Record<
    string,
    unknown
  >;
}


export function createGenesisConversationExpectedHistoryCandidateReviewReadHandler(
  runtime:
    GenesisConversationExpectedHistoryCandidateReviewRouteRuntime,
): RequestHandler {
  return (
    _req:
      Request,

    res:
      Response,
  ) => {
    return res.json({
      ok:
        true,

      review:
        runtime.service
          .read(),
    });
  };
}


export function createGenesisConversationExpectedHistoryCandidateReviewDecisionHandler(
  runtime:
    GenesisConversationExpectedHistoryCandidateReviewRouteRuntime,
): RequestHandler {
  return (
    req:
      Request,

    res:
      Response,
  ) => {
    try {
      const body =
        record(
          req.body,
        );

      const rawOmissions =
        body.knownOmissions;

      const knownOmissions =
        rawOmissions ===
          undefined
          ? undefined
          : (
              Array.isArray(
                rawOmissions,
              )
                ? rawOmissions.map(
                    omission => {
                      const item =
                        record(
                          omission,
                        );

                      return {
                        description:
                          String(
                            item.description ??
                            "",
                          ),

                        projectId:
                          item.projectId ===
                            undefined
                            ? undefined
                            : String(
                                item.projectId,
                              ),

                        conversationId:
                          item.conversationId ===
                            undefined
                            ? undefined
                            : String(
                                item.conversationId,
                              ),

                        basis:
                          String(
                            item.basis ??
                            "",
                          ),
                      };
                    },
                  )
                : (() => {
                    throw new Error(
                      "genesis_conversation_expected_history_candidate_review_known_omissions_invalid",
                    );
                  })()
            );

      const review =
        runtime.service
          .decide({
            decision:
              String(
                body.decision ??
                "",
              ) as
                | "ATTEST_SCOPE"
                | "DECLARE_GAPS"
                | "REJECT",

            reviewedBy:
              String(
                body.reviewedBy ??
                "",
              ),

            knownOmissions,

            notes:
              body.notes ===
                undefined
                ? undefined
                : String(
                    body.notes,
                  ),
          });

      return res.json({
        ok:
          true,

        review,
      });
    } catch (
      error
    ) {
      return res
        .status(
          400,
        )
        .json({
          ok:
            false,

          error:
            error instanceof Error
              ? error.message
              : "genesis_conversation_expected_history_candidate_review_failed",
        });
    }
  };
}


export function registerGenesisConversationExpectedHistoryCandidateReviewRoutes(
  app:
    Express,

  runtime:
    GenesisConversationExpectedHistoryCandidateReviewRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/conversations/expected-history-candidate/review",
    requireRuntimeAccess,
    createGenesisConversationExpectedHistoryCandidateReviewReadHandler(
      runtime,
    ),
  );

  app.post(
    "/api/runtime/genesis/conversations/expected-history-candidate/review",
    requireRuntimeAccess,
    createGenesisConversationExpectedHistoryCandidateReviewDecisionHandler(
      runtime,
    ),
  );
}
