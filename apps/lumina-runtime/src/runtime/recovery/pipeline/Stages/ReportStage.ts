import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  RuntimeRecoveryInput,
  RuntimeRecoveryState,
} from "../RuntimeRecoveryContext.js";

export const ReportStage: ExecutionStage<
  RuntimeRecoveryInput,
  RuntimeRecoveryState
> = {
  name: "report",

  async run(context) {
    return {
      stage: "report",
      success: true,
      metadata: {
        projectId:
          context.input.projectId,
        recovered:
          context.state.recovered ?? false,
        reason:
          context.state.recoveryReason,
      },
    };
  },
};
