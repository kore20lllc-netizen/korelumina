import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisDayZeroConversationCoverageCertificationService,
} from "../knowledge-preservation/genesis/GenesisDayZeroConversationCoverageCertificationService.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisDayZeroConversationCoverageCertificationRouteRuntime {
  service:
    GenesisDayZeroConversationCoverageCertificationService;
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


export function createGenesisDayZeroConversationCoverageCertificationReadHandler(
  runtime:
    GenesisDayZeroConversationCoverageCertificationRouteRuntime,
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


export function createGenesisDayZeroConversationCoverageCertificationWriteHandler(
  runtime:
    GenesisDayZeroConversationCoverageCertificationRouteRuntime,
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


export function registerGenesisDayZeroConversationCoverageCertificationRoutes(
  app:
    Express,

  runtime:
    GenesisDayZeroConversationCoverageCertificationRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/day-zero-conversation-coverage-certification",
    requireRuntimeAccess,
    createGenesisDayZeroConversationCoverageCertificationReadHandler(
      runtime,
    ),
  );

  app.put(
    "/api/runtime/genesis/day-zero-conversation-coverage-certification",
    requireRuntimeAccess,
    createGenesisDayZeroConversationCoverageCertificationWriteHandler(
      runtime,
    ),
  );
}
