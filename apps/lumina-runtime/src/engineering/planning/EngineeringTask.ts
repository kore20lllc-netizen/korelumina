export type EngineeringTaskStatus =
  | "planned"
  | "ready"
  | "running"
  | "completed"
  | "failed";

export interface EngineeringTask {
  taskId: string;
  title: string;
  objective: string;
  status: EngineeringTaskStatus;
  dependsOn: string[];
  createdAt: number;
  updatedAt: number;
}
