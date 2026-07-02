import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  completeExecution,
  failExecution,
} from "../../execution/index.js";

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
    const execution =
      context.state.execution;

    if (!execution) {
      return {
        stage: "finalize",
        success: false,
        metadata: {
          error: "missing_execution",
        },
      };
    }

    const updated =
      completeExecution(
        execution.executionId,
      );

    if (!updated) {
      failExecution(
        execution.executionId,
        "failed_to_complete_execution",
      );

      return {
        stage: "finalize",
        success: false,
        metadata: {
          error:
            "failed_to_complete_execution",
        },
      };
    }

    context.state.execution =
      updated;

    return {
      stage: "finalize",
      success: true,
      metadata: {
        executionId:
          updated.executionId,
        status:
          updated.status,
        completedAt:
          updated.completedAt,
      },
    };
  },
};
