import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "../EngineeringAutomationContext.js";

export const CaptureKnowledgeStage: ExecutionStage<
  EngineeringAutomationInput,
  EngineeringAutomationState
> = {
  name: "capture-knowledge",

  async run(context) {
    context.state.knowledgeCaptured = true;

    return {
      stage: "capture-knowledge",
      success: true,
      metadata: {
        projectId: context.input.projectId,
        objective: context.input.objective,
      },
    };
  },
};
