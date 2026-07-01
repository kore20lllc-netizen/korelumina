import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  markRuntimeStatus,
  removeRuntime,
} from "../../../registry.js";

import {
  recordRuntimeEvent,
} from "../../../../knowledge/runtime/index.js";

import type {
  RuntimeShutdownInput,
  RuntimeShutdownState,
} from "../RuntimeShutdownContext.js";

export const CleanupRuntimeStage: ExecutionStage<
  RuntimeShutdownInput,
  RuntimeShutdownState
> = {
  name: "cleanup-runtime",

  async run(context) {
    const projectId =
      context.input.projectId;

    recordRuntimeEvent({
      projectId,
      type: "runtime_stopped",
    });

    markRuntimeStatus(
      projectId,
      "exited",
      {
        exitedAt: Date.now(),
      },
    );

    removeRuntime(projectId);

    context.state.stopped = true;

    return {
      stage: "cleanup-runtime",
      success: true,
      metadata: {
        projectId,
        stopped: true,
      },
    };
  },
};
