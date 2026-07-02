import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "../EngineeringAutomationContext.js";

export const ValidateStage: ExecutionStage<
  EngineeringAutomationInput,
  EngineeringAutomationState
> = {
  name: "validate",

  async run(context) {
    context.state.validated = true;

    return {
      stage: "validate",
      success: true,
      metadata: {
        projectId: context.input.projectId,
        objective: context.input.objective,
      },
    };
  },
};
