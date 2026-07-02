import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "../EngineeringAutomationContext.js";

export const ProjectKnowledgeStage: ExecutionStage<
  EngineeringAutomationInput,
  EngineeringAutomationState
> = {
  name: "project-knowledge",

  async run(context) {
    context.state.knowledgeProjected = true;

    return {
      stage: "project-knowledge",
      success: true,
      metadata: {
        projectId: context.input.projectId,
        objective: context.input.objective,
      },
    };
  },
};
