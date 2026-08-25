import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisConversationAuthoritativeExpectedHistoryService,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisConversationAuthoritativeExpectedHistoryRouteRuntime {
  service:
    GenesisConversationAuthoritativeExpectedHistoryService;
}


export function createGenesisConversationAuthoritativeExpectedHistoryWriteHandler(
  runtime:
    GenesisConversationAuthoritativeExpectedHistoryRouteRuntime,
): RequestHandler {
  return (
    _req:
      Request,

    res:
      Response,
  ) => {
    try {
      return res.json({
        ok:
          true,

        projection:
          runtime.service
            .create(),
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
              : "genesis_conversation_authoritative_expected_history_create_failed",
        });
    }
  };
}


export function registerGenesisConversationAuthoritativeExpectedHistoryRoute(
  app:
    Express,

  runtime:
    GenesisConversationAuthoritativeExpectedHistoryRouteRuntime,
): void {
  app.post(
    "/api/runtime/genesis/conversations/expected-history/create-from-certified-completeness",
    requireRuntimeAccess,
    createGenesisConversationAuthoritativeExpectedHistoryWriteHandler(
      runtime,
    ),
  );
}
