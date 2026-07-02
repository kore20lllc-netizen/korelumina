import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  startGovernance,
  failExecution,
} from "../../execution/index.js";

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
    const execution =
      context.state.execution;

    if (!execution) {
      return {
        stage: "govern",
        success: false,
        metadata: {
          error: "missing_execution",
        },
      };
    }

    const updated =
      startGovernance(
        execution.executionId,
      );

    if (!updated) {
      failExecution(
        execution.executionId,
        "failed_to_start_governance",
      );

      return {
        stage: "govern",
        success: false,
        metadata: {
          error:
            "failed_to_start_governance",
        },
      };
    }

    context.state.execution =
      updated;

    return {
      stage: "govern",
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
