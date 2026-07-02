import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "../EngineeringAutomationContext.js";

export const FinalizeStage: ExecutionStage<
  EngineeringAutomationInput,
  EngineeringAutomationState
> = {
  name: "finalize",

  async run(context) {
    context.state.finalized = true;

    return {
      stage: "finalize",
      success: true,
      metadata: {
        projectId: context.input.projectId,
        objective: context.input.objective,
        finalized: true,
      },
    };
  },
};
