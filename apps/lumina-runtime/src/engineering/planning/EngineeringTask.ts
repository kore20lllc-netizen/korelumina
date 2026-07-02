export type EngineeringTaskStatus =
  | "planned"
  | "ready"
  | "running"
  | "completed"
  | "failed";

export type EngineeringTaskType =
  | "analysis"
  | "workspace"
  | "implementation"
  | "validation"
  | "knowledge"
  | "reporting"
  | "completion";

export interface EngineeringTask {
  taskId: string;
  title: string;
  objective: string;
  type: EngineeringTaskType;
  status: EngineeringTaskStatus;
  dependsOn: string[];
  createdAt: number;
  updatedAt: number;
}
