import type {
  ExecutionContext,
} from "@korelumina/platform-sdk";

import type {
  EngineeringExecution,
} from "../execution/index.js";

export interface EngineeringAutomationInput {
  objective: string;
  projectId?: string;
}

export interface EngineeringAutomationState
  extends Record<string, unknown> {
  execution?: EngineeringExecution;
}

export type EngineeringAutomationContext =
  ExecutionContext<
    EngineeringAutomationInput,
    EngineeringAutomationState
  >;
