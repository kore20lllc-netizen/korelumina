import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisConversationAuthoritativeCompletenessCertificationService,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisConversationAuthoritativeCompletenessCertificationRouteRuntime {
  service:
    GenesisConversationAuthoritativeCompletenessCertificationService;
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
      "genesis_conversation_authoritative_completeness_certification_body_invalid",
    );
  }

  return value as Record<
    string,
    unknown
  >;
}


export function createGenesisConversationAuthoritativeCompletenessCertificationReadHandler(
  runtime:
    GenesisConversationAuthoritativeCompletenessCertificationRouteRuntime,
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
            .read(),
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
              : "genesis_conversation_authoritative_completeness_certification_read_failed",
        });
    }
  };
}


export function createGenesisConversationAuthoritativeCompletenessCertificationWriteHandler(
  runtime:
    GenesisConversationAuthoritativeCompletenessCertificationRouteRuntime,
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

      const projection =
        runtime.service
          .certify({
            certifiedBy:
              String(
                body.certifiedBy ??
                "",
              ),

            certifiedAt:
              Number(
                body.certifiedAt,
              ),

            reason:
              String(
                body.reason ??
                "",
              ),
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
              : "genesis_conversation_authoritative_completeness_certification_write_failed",
        });
    }
  };
}


export function registerGenesisConversationAuthoritativeCompletenessCertificationRoutes(
  app:
    Express,

  runtime:
    GenesisConversationAuthoritativeCompletenessCertificationRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/conversations/authoritative-completeness-certification",
    requireRuntimeAccess,
    createGenesisConversationAuthoritativeCompletenessCertificationReadHandler(
      runtime,
    ),
  );

  app.put(
    "/api/runtime/genesis/conversations/authoritative-completeness-certification",
    requireRuntimeAccess,
    createGenesisConversationAuthoritativeCompletenessCertificationWriteHandler(
      runtime,
    ),
  );
}
