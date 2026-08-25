import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisConversationAuthoritativeCompletenessEvidenceService,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisConversationAuthoritativeCompletenessEvidenceRouteRuntime {
  service:
    GenesisConversationAuthoritativeCompletenessEvidenceService;
}


export function createGenesisConversationAuthoritativeCompletenessEvidenceReadHandler(
  runtime:
    GenesisConversationAuthoritativeCompletenessEvidenceRouteRuntime,
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

      evidence:
        runtime.service
          .read(),
    });
  };
}


export function registerGenesisConversationAuthoritativeCompletenessEvidenceRoute(
  app:
    Express,

  runtime:
    GenesisConversationAuthoritativeCompletenessEvidenceRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/conversations/authoritative-completeness-evidence",
    requireRuntimeAccess,
    createGenesisConversationAuthoritativeCompletenessEvidenceReadHandler(
      runtime,
    ),
  );
}
