import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  startValidation,
  failExecution,
  validateEngineeringExecution,
} from "../../execution/index.js";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "../EngineeringAutomationContext.js";

export const ValidateStage: ExecutionStage<
  EngineeringAutomationInput,
  EngineeringAutomationState
> = {
  name: "validate",

  async run(context) {
    const execution =
      context.state.execution;

    if (!execution) {
      return {
        stage: "validate",
        success: false,
        metadata: {
          error:
            "missing_execution",
        },
      };
    }

    startValidation(
      execution.executionId,
    );

    execution.status =
      "validating";

    const errors =
      validateEngineeringExecution(
        execution,
      );

    if (errors.length > 0) {
      failExecution(
        execution.executionId,
        errors.join(", "),
      );

      execution.status =
        "failed";

      return {
        stage: "validate",
        success: false,
        metadata: {
          errors,
        },
      };
    }

    return {
      stage: "validate",
      success: true,
      metadata: {
        executionId:
          execution.executionId,
      },
    };
  },
};
