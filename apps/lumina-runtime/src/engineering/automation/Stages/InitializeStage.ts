import { randomUUID } from "node:crypto";

import type {
  ExecutionStage,
} from "@korelumina/platform-sdk";

import {
  createExecution,
} from "../../execution/index.js";

import type {
  EngineeringExecution,
} from "../../execution/index.js";

import type {
  EngineeringAutomationInput,
  EngineeringAutomationState,
} from "../EngineeringAutomationContext.js";

export const InitializeStage: ExecutionStage<
  EngineeringAutomationInput,
  EngineeringAutomationState
> = {
  name: "initialize",

  async run(context) {
    const now = Date.now();

    const execution: EngineeringExecution = {
      executionId: randomUUID(),
      objective: context.input.objective,
      projectId: context.input.projectId,
      status: "created",
      createdAt: now,
      updatedAt: now,
      metadata: {},
    };

    createExecution(
      execution,
    );

    context.state.execution =
      execution;

    return {
      stage: "initialize",
      success: true,
      metadata: {
        executionId:
          execution.executionId,
        projectId:
          execution.projectId,
      },
    };
  },
};
