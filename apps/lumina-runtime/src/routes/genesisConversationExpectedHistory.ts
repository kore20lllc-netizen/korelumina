import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

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
        runtime.service
          .read(),
    });
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
}
