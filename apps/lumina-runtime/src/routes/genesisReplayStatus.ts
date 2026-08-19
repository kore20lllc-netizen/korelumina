import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisKnowledgeManufacturingRunReader,
  GenesisReplayId,
  GenesisReplayPersistenceReader,
} from "../knowledge-preservation/genesis/index.js";

import {
  inspectGenesisReplayStatus,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";

const GENESIS_REPLAY_ID_PATTERN =
  /^genesis-replay:[a-f0-9]{64}$/;

export interface GenesisReplayStatusRouteRuntime {
  persistence:
    GenesisReplayPersistenceReader;

  manufacturingRuns:
    GenesisKnowledgeManufacturingRunReader;
}

export function parseGenesisReplayId(
  value:
    unknown,
): GenesisReplayId {
  if (
    typeof value !==
      "string"
  ) {
    throw new Error(
      "genesis_replay_id_invalid",
    );
  }

  const normalized =
    value.trim();

  if (
    !GENESIS_REPLAY_ID_PATTERN.test(
      normalized,
    )
  ) {
    throw new Error(
      "genesis_replay_id_invalid",
    );
  }

  return normalized as
    GenesisReplayId;
}

export function createGenesisReplayStatusHandler(
  runtime:
    GenesisReplayStatusRouteRuntime,
): RequestHandler {
  return (
    req:
      Request,

    res:
      Response,
  ) => {
    let replayId:
      GenesisReplayId;

    try {
      replayId =
        parseGenesisReplayId(
          req.params
            .replayId,
        );
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
              : "genesis_replay_id_invalid",
        });
    }

    try {
      const status =
        inspectGenesisReplayStatus({
          replayId,

          persistence:
            runtime.persistence,

          manufacturingRuns:
            runtime
              .manufacturingRuns,
        });

      if (
        !status.found
      ) {
        return res
          .status(
            404,
          )
          .json({
            ok:
              false,

            error:
              "genesis_replay_not_found",

            replayId,
          });
      }

      return res.json({
        ok:
          true,

        status,
      });
    } catch (
      error
    ) {
      /*
       * Integrity failures remain distinct from "not found".
       * The transport does not suppress or reinterpret them.
       */
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
              : "genesis_replay_status_read_failed",

          replayId,
        });
    }
  };
}

export function registerGenesisReplayStatusRoute(
  app:
    Express,

  runtime:
    GenesisReplayStatusRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/replays/:replayId/status",
    requireRuntimeAccess,
    createGenesisReplayStatusHandler(
      runtime,
    ),
  );
}
