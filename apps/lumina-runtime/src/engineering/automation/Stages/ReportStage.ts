import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "../EngineeringAutomationContext.js";

export const ReportStage: ExecutionStage<
  EngineeringAutomationInput,
  EngineeringAutomationState
> = {
  name: "report",

  async run(context) {
    return {
      stage: "report",
      success: true,
      metadata: {
        projectId: context.input.projectId,
        objective: context.input.objective,
        validated: context.state.validated ?? false,
        executed: context.state.executed ?? false,
        knowledgeCaptured:
          context.state.knowledgeCaptured ?? false,
        knowledgeProjected:
          context.state.knowledgeProjected ?? false,
        governanceVerified:
          context.state.governanceVerified ?? false,
      },
    };
  },
};
