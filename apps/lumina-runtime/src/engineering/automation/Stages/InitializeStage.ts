import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "../EngineeringAutomationContext.js";

export const InitializeStage: ExecutionStage<
  EngineeringAutomationInput,
  EngineeringAutomationState
> = {
  name: "initialize",

  async run(context) {
    context.state.initialized = true;

    return {
      stage: "initialize",
      success: true,
      metadata: {
        projectId: context.input.projectId,
        objective: context.input.objective,
      },
    };
  },
};
