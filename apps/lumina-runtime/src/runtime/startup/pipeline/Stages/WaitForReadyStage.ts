import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  finalizeRuntimeStartup,
} from "../../RuntimeReadiness.js";

import type {
  RuntimeStartupInput,
  RuntimeStartupState,
} from "../RuntimeStartupContext.js";

export const WaitForReadyStage: ExecutionStage<
  RuntimeStartupInput,
  RuntimeStartupState
> = {
  name: "wait-for-ready",

  async run(context) {
    const result =
      await finalizeRuntimeStartup({
        projectId:
          context.input.projectId,
        projectPath:
          context.state.projectPath!,
        proc:
          context.state.proc!,
        runtime:
          context.state.runtime!,
      });

    context.state.result =
      result;

    return {
      stage: "wait-for-ready",
      success: true,
      metadata: {
        url:
          result.url,
        port:
          result.port,
        status:
          result.status,
      },
    };
  },
};
