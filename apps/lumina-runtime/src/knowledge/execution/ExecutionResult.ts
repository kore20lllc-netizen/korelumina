import type {
  ExecutionTask,
} from "./ExecutionTask.js";

export interface ExecutionResult {
  id: string;

  requestId: string;

  tasks: ExecutionTask[];

  startedAt: string;

  completedAt?: string;
}
