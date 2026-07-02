export type EngineeringExecutionStatus =
  | "created"
  | "initializing"
  | "validating"
  | "executing"
  | "capturing-knowledge"
  | "projecting"
  | "governing"
  | "reporting"
  | "completed"
  | "failed";

export interface EngineeringExecution {
  executionId: string;

  objective: string;

  projectId?: string;

  status: EngineeringExecutionStatus;

  createdAt: number;

  updatedAt: number;

  completedAt?: number;

  lastError?: string;

  metadata: Record<
    string,
    unknown
  >;
}
