import type {
  EngineeringExecution,
  EngineeringExecutionStatus,
} from "./EngineeringExecution.js";

const executions = new Map<
  string,
  EngineeringExecution
>();

export function createExecution(
  execution: EngineeringExecution,
): EngineeringExecution {
  executions.set(
    execution.executionId,
    execution,
  );

  return execution;
}

export function getExecution(
  executionId: string,
): EngineeringExecution | null {
  return (
    executions.get(
      executionId,
    ) ?? null
  );
}

export function updateExecutionStatus(
  executionId: string,
  status: EngineeringExecutionStatus,
): EngineeringExecution | null {
  const execution =
    executions.get(
      executionId,
    );

  if (!execution) {
    return null;
  }

  execution.status = status;
  execution.updatedAt =
    Date.now();

  if (
    status === "completed" ||
    status === "failed"
  ) {
    execution.completedAt =
      Date.now();
  }

  return execution;
}

export function updateExecution(
  execution: EngineeringExecution,
): EngineeringExecution {
  execution.updatedAt =
    Date.now();

  executions.set(
    execution.executionId,
    execution,
  );

  return execution;
}

export function removeExecution(
  executionId: string,
): boolean {
  return executions.delete(
    executionId,
  );
}

export function listExecutions(): EngineeringExecution[] {
  return Array.from(
    executions.values(),
  );
}
