import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  RuntimeRecoveryInput,
  RuntimeRecoveryState,
} from "../RuntimeRecoveryContext.js";

export const ValidateRecoveryStage: ExecutionStage<
  RuntimeRecoveryInput,
  RuntimeRecoveryState
> = {
  name: "validate-recovery",

  async run(context) {
    return {
      stage: "validate-recovery",
      success:
        Boolean(context.input.projectId),
      metadata: {
        reason:
          context.input.reason,
      },
    };
  },
};
