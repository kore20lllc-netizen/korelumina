import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisConversationAcquisitionExecutor,
  GenesisConversationRuntimeConfiguration,
} from "../knowledge-preservation/genesis/index.js";

import {
  buildGenesisConversationAcquisitionInventory,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisConversationAcquisitionRouteRuntime {
  executor:
    GenesisConversationAcquisitionExecutor;

  configuration:
    GenesisConversationRuntimeConfiguration;
}


export function createGenesisConversationAcquisitionStatusHandler(
  runtime:
    GenesisConversationAcquisitionRouteRuntime,
): RequestHandler {
  return (
    _req:
      Request,

    res:
      Response,
  ) => {
    const acquisition =
      runtime.executor.latest();

    const inventory =
      buildGenesisConversationAcquisitionInventory({
        configuration:
          runtime.configuration,

        latest:
          acquisition,
      });

    return res.json({
      ok:
        true,

      acquisition,

      inventory,
    });
  };
}


export function createGenesisConversationAcquisitionExecutionHandler(
  runtime:
    GenesisConversationAcquisitionRouteRuntime,
): RequestHandler {
  return async (
    _req:
      Request,

    res:
      Response,
  ) => {
    const result =
      await runtime.executor.execute();

    if (
      result.state ===
      "FAILED"
    ) {
      return res
        .status(
          409,
        )
        .json({
          ok:
            false,

          result,
        });
    }

    return res.json({
      ok:
        true,

      result,
    });
  };
}


export function registerGenesisConversationAcquisitionRoutes(
  app:
    Express,

  runtime:
    GenesisConversationAcquisitionRouteRuntime,
): void {
  app.get(
    "/api/runtime/genesis/conversations/acquisition",
    requireRuntimeAccess,
    createGenesisConversationAcquisitionStatusHandler(
      runtime,
    ),
  );

  app.post(
    "/api/runtime/genesis/conversations/acquisition",
    requireRuntimeAccess,
    createGenesisConversationAcquisitionExecutionHandler(
      runtime,
    ),
  );
}
