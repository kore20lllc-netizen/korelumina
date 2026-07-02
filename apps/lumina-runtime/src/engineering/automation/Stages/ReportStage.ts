import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  startReporting,
  failExecution,
} from "../../execution/index.js";

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
    const execution =
      context.state.execution;

    if (!execution) {
      return {
        stage: "report",
        success: false,
        metadata: {
          error: "missing_execution",
        },
      };
    }

    const updated =
      startReporting(
        execution.executionId,
      );

    if (!updated) {
      failExecution(
        execution.executionId,
        "failed_to_start_reporting",
      );

      return {
        stage: "report",
        success: false,
        metadata: {
          error:
            "failed_to_start_reporting",
        },
      };
    }

    context.state.execution =
      updated;

    return {
      stage: "report",
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
