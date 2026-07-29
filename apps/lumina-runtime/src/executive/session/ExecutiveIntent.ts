export type ExecutiveIntentPriority =
  | "low"
  | "normal"
  | "high"
  | "critical";

export interface ExecutiveIntent {
  id: string;
  title: string;
  description: string;
  priority: ExecutiveIntentPriority;
  projectId?: string;
  missionId?: string;
  requestedBy: string;
  constraints: readonly string[];
  successCriteria: readonly string[];
  createdAt: number;
}

export interface CreateExecutiveIntentInput {
  id: string;
  title: string;
  description: string;
  priority?: ExecutiveIntentPriority;
  projectId?: string;
  missionId?: string;
  requestedBy: string;
  constraints?: readonly string[];
  successCriteria?: readonly string[];
  createdAt?: number;
}

export function createExecutiveIntent(
  input: CreateExecutiveIntentInput,
): ExecutiveIntent {
  return Object.freeze({
    id: input.id.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority ?? "normal",
    projectId: input.projectId,
    missionId: input.missionId,
    requestedBy: input.requestedBy,
    constraints: Object.freeze([
      ...(input.constraints ?? []),
    ]),
    successCriteria: Object.freeze([
      ...(input.successCriteria ?? []),
    ]),
    createdAt:
      input.createdAt ??
      Date.now(),
  });
}
