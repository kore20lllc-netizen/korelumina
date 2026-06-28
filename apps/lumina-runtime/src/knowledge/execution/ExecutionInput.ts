export interface ExecutionInput {
  requestId: string;

  engineerAgentRunId: string;

  actionIds: string[];

  objective: string;

  references: string[];
}
