import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisDayZeroCertificationService,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisDayZeroCertificationRouteRuntime {
  service:
    GenesisDayZeroCertificationService;
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
      "genesis_day_zero_certification_request_body_invalid",
    );
  }

  return value as Record<
    string,
    unknown
  >;
}


export function createGenesisDayZeroCertificationReadHandler(
  runtime:
    GenesisDayZeroCertificationRouteRuntime,
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
              : "genesis_day_zero_certification_read_failed",
        });
    }
  };
}


export function createGenesisDayZeroCertificationWriteHandler(
  runtime:
    GenesisDayZeroCertificationRouteRuntime,
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

      if (
        !Array.isArray(
          body.acknowledgedHistoricallyUnavailableConversationIds,
        ) ||
        !body
          .acknowledgedHistoricallyUnavailableConversationIds
          .every(
            value =>
              typeof value ===
              "string",
          )
      ) {
        throw new Error(
          "genesis_day_zero_certification_acknowledged_gaps_invalid",
        );
      }

      /*
       * The request contains only the human decision.
       * Runtime reconstructs the current candidate internally.
       */
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

            acknowledgedHistoricallyUnavailableConversationIds:
              body
                .acknowledgedHistoricallyUnavailableConversationIds as
                  string[],
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
              : "genesis_day_zero_certification_write_failed",
        });
    }
  };
}


export function registerGenesisDayZeroCertificationRoutes(
  app:
    Express,

  runtime:
    GenesisDayZeroCertificationRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/day-zero-certification",
    requireRuntimeAccess,
    createGenesisDayZeroCertificationReadHandler(
      runtime,
    ),
  );

  app.put(
    "/api/runtime/genesis/day-zero-certification",
    requireRuntimeAccess,
    createGenesisDayZeroCertificationWriteHandler(
      runtime,
    ),
  );
}
