import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisConversationExpectedHistoryAmendmentService,
  GenesisConversationExpectedHistoryInventoryId,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisConversationExpectedHistoryAmendmentRouteRuntime {
  service:
    GenesisConversationExpectedHistoryAmendmentService;
}


function bodyRecord(
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
      "genesis_conversation_expected_history_amendment_request_body_invalid",
    );
  }

  return value as Record<
    string,
    unknown
  >;
}


function requiredString(
  value:
    unknown,

  errorCode:
    string,
): string {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new Error(
      errorCode,
    );
  }

  return value.trim();
}


function requiredTimestamp(
  value:
    unknown,
): number {
  const timestamp =
    Number(
      value,
    );

  if (
    !Number.isFinite(
      timestamp,
    ) ||
    timestamp <=
      0
  ) {
    throw new Error(
      "genesis_conversation_expected_history_amendment_amended_at_invalid",
    );
  }

  return timestamp;
}


export function createGenesisConversationExpectedHistoryAmendmentWriteHandler(
  runtime:
    GenesisConversationExpectedHistoryAmendmentRouteRuntime,
): RequestHandler {
  return (
    req:
      Request,

    res:
      Response,
  ) => {
    try {
      const body =
        bodyRecord(
          req.body,
        );

      const expectedPreviousInventoryId =
        requiredString(
          body.expectedPreviousInventoryId,
          "genesis_conversation_expected_history_amendment_previous_inventory_id_invalid",
        );

      if (
        !expectedPreviousInventoryId.startsWith(
          "genesis-conversation-expected-history:",
        )
      ) {
        throw new Error(
          "genesis_conversation_expected_history_amendment_previous_inventory_id_invalid",
        );
      }

      /*
       * Caller supplies only:
       *
       * - the authority identity it reviewed,
       * - the conversation being governed,
       * - the human governance decision.
       *
       * Caller cannot supply or replace the resulting authoritative
       * expected-history inventory directly.
       */
      const projection =
        runtime.service
          .amend({
            expectedPreviousInventoryId:
              expectedPreviousInventoryId as
                GenesisConversationExpectedHistoryInventoryId,

            decision: {
              conversationId:
                requiredString(
                  body.conversationId,
                  "genesis_conversation_expected_history_amendment_conversation_id_invalid",
                ),

              amendedBy:
                requiredString(
                  body.amendedBy,
                  "genesis_conversation_expected_history_amendment_actor_invalid",
                ),

              amendedAt:
                requiredTimestamp(
                  body.amendedAt,
                ),

              reason:
                requiredString(
                  body.reason,
                  "genesis_conversation_expected_history_amendment_reason_invalid",
                ),
            },
          });

      return res.json({
        ok:
          true,

        projection,
      });
    } catch (
      error
    ) {
      return res
        .status(
          409,
        )
        .json({
          ok:
            false,

          error:
            error instanceof Error
              ? error.message
              : "genesis_conversation_expected_history_amendment_failed",
        });
    }
  };
}


export function registerGenesisConversationExpectedHistoryAmendmentRoute(
  app:
    Express,

  runtime:
    GenesisConversationExpectedHistoryAmendmentRouteRuntime,
): void {
  app.post(
    "/api/runtime/genesis/conversations/expected-history/amend",
    requireRuntimeAccess,
    createGenesisConversationExpectedHistoryAmendmentWriteHandler(
      runtime,
    ),
  );
}
