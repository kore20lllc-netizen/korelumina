import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisConversationHistoryReconciliationProjection,
  GenesisConversationSourceBoundary,
  GenesisHistoricalCorrelationPersistenceStore,
  GenesisOperationalManufacturingRunReader,
  GenesisOperationalMemoryReader,
  GenesisReadinessPolicy,
  GenesisReplayId,
  GenesisReplayPersistenceReader,
} from "../knowledge-preservation/genesis/index.js";

import {
  readGenesisOperationalProjection,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";

const REPLAY_ID_PATTERN =
  /^genesis-replay:[a-f0-9]{64}$/;

export interface GenesisOperationalProjectionRouteRuntime {
  replayPersistence:
    GenesisReplayPersistenceReader;

  historicalCorrelation:
    Pick<
      GenesisHistoricalCorrelationPersistenceStore,
      "load"
    >;

  manufacturingRuns:
    GenesisOperationalManufacturingRunReader;

  organizationalMemory:
    GenesisOperationalMemoryReader;

  readinessPolicy:
    GenesisReadinessPolicy;

  conversationSource?:
    GenesisConversationSourceBoundary;

  conversationHistoryReconciliation?():
    GenesisConversationHistoryReconciliationProjection;
}

export function createGenesisOperationalProjectionHandler(
  runtime:
    GenesisOperationalProjectionRouteRuntime,
): RequestHandler {
  return (
    req:
      Request,

    res:
      Response,
  ) => {
    const rawReplayId =
      req.params.replayId;

    if (
      typeof rawReplayId !==
        "string" ||
      !REPLAY_ID_PATTERN.test(
        rawReplayId,
      )
    ) {
      return res
        .status(
          400,
        )
        .json({
          ok:
            false,

          error:
            "genesis_replay_id_invalid",
        });
    }

    const replayId =
      rawReplayId as
        GenesisReplayId;

    try {
      const projection =
        readGenesisOperationalProjection({
          replayId,

          replayPersistence:
            runtime.replayPersistence,

          historicalCorrelation:
            runtime
              .historicalCorrelation,

          manufacturingRuns:
            runtime
              .manufacturingRuns,

          organizationalMemory:
            runtime
              .organizationalMemory,

          readinessPolicy:
            runtime.readinessPolicy,

          conversationSource:
            runtime.conversationSource,

          conversationHistoryReconciliation:
            runtime.conversationHistoryReconciliation
              ? runtime.conversationHistoryReconciliation()
              : null,
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
              : "genesis_operational_projection_read_failed",
        });
    }
  };
}

export function registerGenesisOperationalProjectionRoute(
  app:
    Express,

  runtime:
    GenesisOperationalProjectionRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/replays/:replayId/operational",
    requireRuntimeAccess,
    createGenesisOperationalProjectionHandler(
      runtime,
    ),
  );
}
