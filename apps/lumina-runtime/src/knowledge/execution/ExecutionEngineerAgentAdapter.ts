import type {
  EngineerAgentAction,
} from "../agent/EngineerAgentAction.js";

import type {
  EngineerAgentRun,
} from "../agent/EngineerAgentRun.js";

import type {
  ExecutionInput,
} from "./ExecutionInput.js";

export interface ExecutionEngineerAgentAdapterInput {
  requestId: string;

  engineerAgentRun: EngineerAgentRun;

  objective: string;

  references: string[];
}

export function adaptEngineerAgentRunToExecutionInput(
  input: ExecutionEngineerAgentAdapterInput,
): ExecutionInput {
  return {
    requestId:
      input.requestId,

    engineerAgentRunId:
      input.engineerAgentRun.id,

    actionIds:
      input.engineerAgentRun.actions.map(
        (
          action: EngineerAgentAction,
        ) =>
          action.id,
      ),

    objective:
      input.objective,

    references:
      input.references,
  };
}
