import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisKnowledgeManufacturingRunReader,
} from "../knowledge-preservation/genesis/index.js";

import type {
  FileGenesisReplayPersistenceStore,
} from "../knowledge-preservation/genesis/index.js";

import {
  listGenesisReplayInventory,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";

export interface GenesisReplayInventoryRouteRuntime {
  persistence:
    Pick<
      FileGenesisReplayPersistenceStore,
      | "storageRoot"
      | "loadManifestBuild"
      | "loadExecution"
      | "loadRunnerResult"
    >;

  manufacturingRuns:
    GenesisKnowledgeManufacturingRunReader;
}

export function createGenesisReplayInventoryHandler(
  runtime:
    GenesisReplayInventoryRouteRuntime,
): RequestHandler {
  return (
    _req:
      Request,

    res:
      Response,
  ) => {
    try {
      const inventory =
        listGenesisReplayInventory({
          persistence:
            runtime.persistence,

          manufacturingRuns:
            runtime
              .manufacturingRuns,
        });

      return res.json({
        ok:
          true,

        inventory,
      });
    } catch (
      error
    ) {
      /*
       * Inventory integrity failures remain visible.
       * The route must never convert corruption,
       * identity ambiguity, or storage mismatch
       * into an empty inventory.
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
              : "genesis_replay_inventory_read_failed",
        });
    }
  };
}

export function registerGenesisReplayInventoryRoute(
  app:
    Express,

  runtime:
    GenesisReplayInventoryRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/replays",
    requireRuntimeAccess,
    createGenesisReplayInventoryHandler(
      runtime,
    ),
  );
}
