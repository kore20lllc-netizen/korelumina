import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "../EngineeringAutomationContext.js";

export const GovernStage: ExecutionStage<
  EngineeringAutomationInput,
  EngineeringAutomationState
> = {
  name: "govern",

  async run(context) {
    context.state.governanceVerified = true;

    return {
      stage: "govern",
      success: true,
      metadata: {
        projectId: context.input.projectId,
        objective: context.input.objective,
      },
    };
  },
};
