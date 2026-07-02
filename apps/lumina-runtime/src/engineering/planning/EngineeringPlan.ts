import type {
  EngineeringTask,
} from "./EngineeringTask.js";

export interface EngineeringPlan {
  planId: string;

  executionId: string;

  objective: string;

  tasks: EngineeringTask[];

  createdAt: number;

  updatedAt: number;

  metadata: Record<
    string,
    unknown
  >;
}
