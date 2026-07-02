import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  startExecution,
  failExecution,
} from "../../execution/index.js";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "../EngineeringAutomationContext.js";

export const ExecuteStage: ExecutionStage<
  EngineeringAutomationInput,
  EngineeringAutomationState
> = {
  name: "execute",

  async run(context) {
    const execution =
      context.state.execution;

    if (!execution) {
      return {
        stage: "execute",
        success: false,
        metadata: {
          error: "missing_execution",
        },
      };
    }

    const updated =
      startExecution(
        execution.executionId,
      );

    if (!updated) {
      failExecution(
        execution.executionId,
        "failed_to_start_execution",
      );

      return {
        stage: "execute",
        success: false,
        metadata: {
          error:
            "failed_to_start_execution",
        },
      };
    }

    context.state.execution =
      updated;

    return {
      stage: "execute",
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
