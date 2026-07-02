import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  startKnowledgeCapture,
  failExecution,
} from "../../execution/index.js";

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
    const execution =
      context.state.execution;

    if (!execution) {
      return {
        stage: "capture-knowledge",
        success: false,
        metadata: {
          error: "missing_execution",
        },
      };
    }

    const updated =
      startKnowledgeCapture(
        execution.executionId,
      );

    if (!updated) {
      failExecution(
        execution.executionId,
        "failed_to_start_knowledge_capture",
      );

      return {
        stage: "capture-knowledge",
        success: false,
        metadata: {
          error:
            "failed_to_start_knowledge_capture",
        },
      };
    }

    context.state.execution =
      updated;

    return {
      stage: "capture-knowledge",
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
