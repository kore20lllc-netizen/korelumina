import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisRuntimeReplayDesignationStore,
} from "../knowledge-preservation/genesis/GenesisRuntimeReplayDesignation.js";

import {
  GENESIS_RUNTIME_REPLAY_DESIGNATION_VERSION,
  isGenesisRuntimeReplayEligible,
} from "../knowledge-preservation/genesis/GenesisRuntimeReplayDesignation.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


type ReplayInventoryCandidate =
  Parameters<
    typeof isGenesisRuntimeReplayEligible
  >[0];


export interface GenesisReplayDesignationRouteRuntime {
  listReplayInventory():
    {
      replays:
        readonly ReplayInventoryCandidate[];
    };

  designationStore:
    GenesisRuntimeReplayDesignationStore;

  now?:
    () => number;
}


interface GenesisReplayDesignationRequestBody {
  replayId?:
    unknown;

  designatedBy?:
    unknown;

  reason?:
    unknown;
}


function requiredString(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length >
    0
    ? normalized
    : null;
}


export function createGenesisReplayDesignationHandler(
  runtime:
    GenesisReplayDesignationRouteRuntime,
): RequestHandler {
  return (
    req:
      Request,

    res:
      Response,
  ) => {
    const body =
      (
        req.body ??
        {}
      ) as GenesisReplayDesignationRequestBody;

    const replayId =
      requiredString(
        body.replayId,
      );

    const designatedBy =
      requiredString(
        body.designatedBy,
      );

    const reason =
      requiredString(
        body.reason,
      );

    if (
      !replayId ||
      !designatedBy ||
      !reason
    ) {
      return res
        .status(
          400,
        )
        .json({
          ok:
            false,

          error:
            "genesis_replay_designation_request_invalid",
        });
    }

    try {
      const inventory =
        runtime
          .listReplayInventory();

      const replay =
        inventory.replays.find(
          candidate =>
            candidate.replayId ===
              replayId,
        );

      if (
        !replay
      ) {
        return res
          .status(
            404,
          )
          .json({
            ok:
              false,

            error:
              "genesis_replay_designation_replay_not_found",

            replayId,
          });
      }

      if (
        !isGenesisRuntimeReplayEligible(
          replay,
        )
      ) {
        return res
          .status(
            409,
          )
          .json({
            ok:
              false,

            error:
              "genesis_replay_designation_replay_not_eligible",

            replayId,
          });
      }

      const existing =
        runtime
          .designationStore
          .load();

      /*
       * Repeating the same governed replay designation is idempotent.
       * Selecting a different replay always requires another explicit
       * replayId + actor + reason request.
       */
      if (
        existing?.replayId ===
          replayId
      ) {
        return res.json({
          ok:
            true,

          designation:
            existing,

          selectionChanged:
            false,
        });
      }

      const designation = {
        designationVersion:
          GENESIS_RUNTIME_REPLAY_DESIGNATION_VERSION,

        /*
         * Persist the governed replay identity obtained from the
         * production inventory, not the untyped HTTP request string.
         */
        replayId:
          replay.replayId,

        designatedBy,

        designatedAt:
          (
            runtime.now ??
            Date.now
          )(),

        reason,
      };

      runtime
        .designationStore
        .save(
          designation,
        );

      return res.json({
        ok:
          true,

        designation,

        selectionChanged:
          true,
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
              : "genesis_replay_designation_failed",
        });
    }
  };
}


export function registerGenesisReplayDesignationRoute(
  app:
    Express,

  runtime:
    GenesisReplayDesignationRouteRuntime,
): void {
  app.post(
    "/api/runtime/genesis/replay-designation",
    requireRuntimeAccess,
    createGenesisReplayDesignationHandler(
      runtime,
    ),
  );
}
