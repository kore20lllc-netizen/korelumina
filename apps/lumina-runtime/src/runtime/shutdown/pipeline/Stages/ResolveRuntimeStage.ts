import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  getRuntime,
} from "../../../registry.js";

import type {
  RuntimeShutdownInput,
  RuntimeShutdownState,
} from "../RuntimeShutdownContext.js";

export const ResolveRuntimeStage: ExecutionStage<
  RuntimeShutdownInput,
  RuntimeShutdownState
> = {
  name: "resolve-runtime",

  async run(context) {
    const runtime =
      getRuntime(context.input.projectId);

    if (!runtime) {
      context.state.stopped = false;

      return {
        stage: "resolve-runtime",
        success: false,
        metadata: {
          reason: "runtime_not_found",
        },
      };
    }

    context.state.runtime = runtime;

    return {
      stage: "resolve-runtime",
      success: true,
    };
  },
};
