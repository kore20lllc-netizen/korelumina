import type {
  EngineeringExecution,
} from "./EngineeringExecution.js";

export function validateEngineeringExecution(
  execution: EngineeringExecution,
): string[] {
  const errors: string[] = [];

  if (!execution.executionId.trim()) {
    errors.push(
      "missing_execution_id",
    );
  }

  if (!execution.objective.trim()) {
    errors.push(
      "missing_objective",
    );
  }

  if (
    execution.updatedAt <
    execution.createdAt
  ) {
    errors.push(
      "invalid_timestamps",
    );
  }

  return errors;
}
