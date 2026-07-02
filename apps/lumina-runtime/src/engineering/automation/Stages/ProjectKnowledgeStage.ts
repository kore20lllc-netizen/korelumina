import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  startKnowledgeProjection,
  failExecution,
} from "../../execution/index.js";

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
    const execution =
      context.state.execution;

    if (!execution) {
      return {
        stage: "project-knowledge",
        success: false,
        metadata: {
          error: "missing_execution",
        },
      };
    }

    const updated =
      startKnowledgeProjection(
        execution.executionId,
      );

    if (!updated) {
      failExecution(
        execution.executionId,
        "failed_to_start_knowledge_projection",
      );

      return {
        stage: "project-knowledge",
        success: false,
        metadata: {
          error:
            "failed_to_start_knowledge_projection",
        },
      };
    }

    context.state.execution =
      updated;

    return {
      stage: "project-knowledge",
      success: true,
      metadata: {
        executionId:
          updated.executionId,
        status:
          updated.status,
      },
    };
  },
};
