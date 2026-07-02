import {
  getExecution,
  updateExecutionStatus,
  updateExecution,
} from "./EngineeringExecutionStore.js";

export function startValidation(
  executionId: string,
) {
  return updateExecutionStatus(
    executionId,
    "validating",
  );
}

export function startExecution(
  executionId: string,
) {
  return updateExecutionStatus(
    executionId,
    "executing",
  );
}

export function startKnowledgeCapture(
  executionId: string,
) {
  return updateExecutionStatus(
    executionId,
    "capturing-knowledge",
  );
}

export function startKnowledgeProjection(
  executionId: string,
) {
  return updateExecutionStatus(
    executionId,
    "projecting",
  );
}

export function startGovernance(
  executionId: string,
) {
  return updateExecutionStatus(
    executionId,
    "governing",
  );
}

export function startReporting(
  executionId: string,
) {
  return updateExecutionStatus(
    executionId,
    "reporting",
  );
}

export function completeExecution(
  executionId: string,
) {
  return updateExecutionStatus(
    executionId,
    "completed",
  );
}

export function failExecution(
  executionId: string,
  error: string,
) {
  const execution =
    getExecution(
      executionId,
    );

  if (!execution) {
    return null;
  }

  execution.lastError =
    error;

  updateExecution(
    execution);

  return updateExecutionStatus(
    executionId,
    "failed",
  );
}
