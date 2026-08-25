import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisConversationExpectedHistoryCandidateService,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisConversationExpectedHistoryCandidateRouteRuntime {
  service:
    GenesisConversationExpectedHistoryCandidateService;
}


export function createGenesisConversationExpectedHistoryCandidateReadHandler(
  runtime:
    GenesisConversationExpectedHistoryCandidateRouteRuntime,
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

      candidate:
        runtime.service
          .read(),
    });
  };
}


export function createGenesisConversationExpectedHistoryCandidateGenerateHandler(
  runtime:
    GenesisConversationExpectedHistoryCandidateRouteRuntime,
): RequestHandler {
  return (
    _req:
      Request,

    res:
      Response,
  ) => {
    try {
      const candidate =
        runtime.service
          .generate();

      return res.json({
        ok:
          true,

        candidate,
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
              : "genesis_conversation_expected_history_candidate_generation_failed",
        });
    }
  };
}


export function registerGenesisConversationExpectedHistoryCandidateRoutes(
  app:
    Express,

  runtime:
    GenesisConversationExpectedHistoryCandidateRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/conversations/expected-history-candidate",
    requireRuntimeAccess,
    createGenesisConversationExpectedHistoryCandidateReadHandler(
      runtime,
    ),
  );

  app.post(
    "/api/runtime/genesis/conversations/expected-history-candidate",
    requireRuntimeAccess,
    createGenesisConversationExpectedHistoryCandidateGenerateHandler(
      runtime,
    ),
  );
}
