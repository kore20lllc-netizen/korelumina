import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  recordRuntimeEvent,
} from "../../../../knowledge/runtime/index.js";

import type {
  RuntimeRecoveryInput,
  RuntimeRecoveryState,
} from "../RuntimeRecoveryContext.js";

export const PublishRecoveryStage: ExecutionStage<
  RuntimeRecoveryInput,
  RuntimeRecoveryState
> = {
  name: "publish-recovery",

  async run(context) {
    recordRuntimeEvent({
      projectId:
        context.input.projectId,
      type:
        "runtime_recovered",
    });

    console.log(
      `[lumina-runtime] restored runtime ${context.input.projectId} pid=${context.input.record.pid}`,
    );

    return {
      stage: "publish-recovery",
      success: true,
      metadata: {
        projectId:
          context.input.projectId,
      },
    };
  },
};
