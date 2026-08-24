import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  GenesisConversationAcquisitionExecutor,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";


export interface GenesisConversationAcquisitionRouteRuntime {
  executor:
    GenesisConversationAcquisitionExecutor;
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
    return res.json({
      ok:
        true,

      acquisition:
        runtime.executor.latest(),
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
