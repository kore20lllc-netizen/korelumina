import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  completeExecution,
  failExecution,
} from "../../execution/index.js";

import {
  completeEngineeringWork,
} from "../../EngineeringService.js";

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

    const completed =
      completeExecution(
        execution.executionId,
      );

    if (!completed) {
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

    const report =
      await completeEngineeringWork({
        phase: 1,
        title: execution.objective,
        commit: "pending",
        validation: [
          {
            name: "engineering-execution",
            passed: true,
          },
        ],
      });

    completed.metadata = {
      ...completed.metadata,
      completionReport: report,
    };

    context.state.execution =
      completed;

    return {
      stage: "finalize",
      success: true,
      metadata: {
        executionId:
          completed.executionId,
        status:
          completed.status,
        reportGenerated:
          report.completed,
      },
    };
  },
};
