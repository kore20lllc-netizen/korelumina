import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import {
  buildGenesisConversationExpectedHistoryInventory,
} from "../knowledge-preservation/genesis/index.js";

import type {
  GenesisConversationHistoryReconciliationService,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisConversationExpectedHistoryRouteRuntime {
  service:
    GenesisConversationHistoryReconciliationService;
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
      "genesis_conversation_expected_history_body_invalid",
    );
  }

  return value as Record<
    string,
    unknown
  >;
}


export function createGenesisConversationExpectedHistoryReadHandler(
  runtime:
    GenesisConversationExpectedHistoryRouteRuntime,
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

      projection:
        runtime.service.read(),
    });
  };
}


export function createGenesisConversationExpectedHistoryWriteHandler(
  runtime:
    GenesisConversationExpectedHistoryRouteRuntime,
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

      const authority =
        record(
          body.authority,
        );

      const conversations =
        body.conversations;

      if (
        !Array.isArray(
          conversations,
        )
      ) {
        throw new Error(
          "genesis_conversation_expected_history_conversations_required",
        );
      }

      const inventory =
        buildGenesisConversationExpectedHistoryInventory({
          authority: {
            authorityId:
              String(
                authority.authorityId ??
                "",
              ),

            authorityClass:
              String(
                authority.authorityClass ??
                "",
              ),

            certifiedBy:
              String(
                authority.certifiedBy ??
                "",
              ),

            certifiedAt:
              Number(
                authority.certifiedAt,
              ),

            scope:
              String(
                authority.scope ??
                "",
              ),

            version:
              String(
                authority.version ??
                "",
              ),
          },

          historicalStart:
            body.historicalStart ===
              undefined
              ? undefined
              : Number(
                  body.historicalStart,
                ),

          historicalEnd:
            body.historicalEnd ===
              undefined
              ? undefined
              : Number(
                  body.historicalEnd,
                ),

          conversations:
            conversations as never,
        });

      const projection =
        runtime.service
          .saveExpectedHistory(
            inventory,
          );

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
          400,
        )
        .json({
          ok:
            false,

          error:
            error instanceof Error
              ? error.message
              : "genesis_conversation_expected_history_write_failed",
        });
    }
  };
}


export function registerGenesisConversationExpectedHistoryRoutes(
  app:
    Express,

  runtime:
    GenesisConversationExpectedHistoryRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/conversations/expected-history",
    requireRuntimeAccess,
    createGenesisConversationExpectedHistoryReadHandler(
      runtime,
    ),
  );

  app.put(
    "/api/runtime/genesis/conversations/expected-history",
    requireRuntimeAccess,
    createGenesisConversationExpectedHistoryWriteHandler(
      runtime,
    ),
  );
}
