import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  RuntimeRecoveryInput,
  RuntimeRecoveryState,
} from "../RuntimeRecoveryContext.js";

export const ResolveRuntimeStage: ExecutionStage<
  RuntimeRecoveryInput,
  RuntimeRecoveryState
> = {
  name: "resolve-runtime",

  async run(context) {
    return {
      stage: "resolve-runtime",
      success: true,
      metadata: {
        projectId:
          context.input.projectId,
      },
    };
  },
};
