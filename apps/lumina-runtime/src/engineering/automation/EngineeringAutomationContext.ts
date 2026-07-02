import type {
  ExecutionContext,
} from "@korelumina/platform-sdk";

export interface EngineeringAutomationInput {
  objective: string;
  projectId?: string;
}

export interface EngineeringAutomationState
  extends Record<string, unknown> {
  initialized?: boolean;
  validated?: boolean;
  executed?: boolean;
  knowledgeCaptured?: boolean;
  knowledgeProjected?: boolean;
  governanceVerified?: boolean;
  finalized?: boolean;
}

export type EngineeringAutomationContext =
  ExecutionContext<
    EngineeringAutomationInput,
    EngineeringAutomationState
  >;
