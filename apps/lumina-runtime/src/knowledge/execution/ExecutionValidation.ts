import type {
  ExecutionPipelineResult,
} from "./ExecutionPipeline.js";

export interface ExecutionValidationIssue {
  code: string;

  message: string;
}

export interface ExecutionValidationResult {
  valid: boolean;

  issues: ExecutionValidationIssue[];
}

function findDuplicates(
  values: readonly string[],
): string[] {
  const seen =
    new Set<string>();

  const duplicates =
    new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
      continue;
    }

    seen.add(value);
  }

  return [
    ...duplicates,
  ];
}

export function validateExecutionPipelineResult(
  result: ExecutionPipelineResult,
): ExecutionValidationResult {
  const issues: ExecutionValidationIssue[] =
    [];

  const resultIds =
    result.results.map(
      (executionResult) =>
        executionResult.id,
    );

  for (const resultId of findDuplicates(resultIds)) {
    issues.push({
      code: "execution.result.duplicate_id",
      message: `Execution result id is duplicated: ${resultId}.`,
    });
  }

  for (const executionResult of result.results) {
    if (!executionResult.id.trim()) {
      issues.push({
        code: "execution.result.missing_id",
        message: "Execution result is missing an id.",
      });
    }

    if (!executionResult.requestId.trim()) {
      issues.push({
        code: "execution.result.missing_request_id",
        message: `Execution result ${executionResult.id} is missing a request id.`,
      });
    }

    if (!executionResult.startedAt.trim()) {
      issues.push({
        code: "execution.result.missing_started_at",
        message: `Execution result ${executionResult.id} is missing a start timestamp.`,
      });
    }

    if (executionResult.tasks.length === 0) {
      issues.push({
        code: "execution.result.missing_tasks",
        message: `Execution result ${executionResult.id} has no tasks.`,
      });
    }

    const taskIds =
      executionResult.tasks.map(
        (task) =>
          task.id,
      );

    for (const taskId of findDuplicates(taskIds)) {
      issues.push({
        code: "execution.task.duplicate_id",
        message: `Execution result ${executionResult.id} has duplicate task id ${taskId}.`,
      });
    }

    for (const task of executionResult.tasks) {
      if (!task.id.trim()) {
        issues.push({
          code: "execution.task.missing_id",
          message: `Execution result ${executionResult.id} contains a task with no id.`,
        });
      }

      if (!task.actionId.trim()) {
        issues.push({
          code: "execution.task.missing_action_id",
          message: `Execution task ${task.id} is missing an action id.`,
        });
      }

      if (!task.title.trim()) {
        issues.push({
          code: "execution.task.missing_title",
          message: `Execution task ${task.id} is missing a title.`,
        });
      }

      if (!task.description.trim()) {
        issues.push({
          code: "execution.task.missing_description",
          message: `Execution task ${task.id} is missing a description.`,
        });
      }

      if (!task.providerId.trim()) {
        issues.push({
          code: "execution.task.missing_provider_id",
          message: `Execution task ${task.id} is missing a provider id.`,
        });
      }
    }
  }

  return {
    valid:
      issues.length === 0,

    issues,
  };
}
