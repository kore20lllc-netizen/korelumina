import type {
  EngineerAgentPipelineResult,
} from "./EngineerAgentPipeline.js";

export interface EngineerAgentValidationIssue {
  code: string;

  message: string;
}

export interface EngineerAgentValidationResult {
  valid: boolean;

  issues: EngineerAgentValidationIssue[];
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

export function validateEngineerAgentPipelineResult(
  result: EngineerAgentPipelineResult,
): EngineerAgentValidationResult {
  const issues: EngineerAgentValidationIssue[] =
    [];

  const runIds =
    result.runs.map(
      (run) =>
        run.id,
    );

  for (const runId of findDuplicates(runIds)) {
    issues.push({
      code: "agent.run.duplicate_id",
      message: `Engineer agent run id is duplicated: ${runId}.`,
    });
  }

  for (const run of result.runs) {
    if (!run.id.trim()) {
      issues.push({
        code: "agent.run.missing_id",
        message: "Engineer agent run is missing an id.",
      });
    }

    if (!run.requestId.trim()) {
      issues.push({
        code: "agent.run.missing_request_id",
        message: `Engineer agent run ${run.id} is missing a request id.`,
      });
    }

    if (!run.objective.trim()) {
      issues.push({
        code: "agent.run.missing_objective",
        message: `Engineer agent run ${run.id} is missing an objective.`,
      });
    }

    if (run.actions.length === 0) {
      issues.push({
        code: "agent.run.missing_actions",
        message: `Engineer agent run ${run.id} has no actions.`,
      });
    }

    const actionIds =
      run.actions.map(
        (action) =>
          action.id,
      );

    for (const actionId of findDuplicates(actionIds)) {
      issues.push({
        code: "agent.action.duplicate_id",
        message: `Engineer agent run ${run.id} has duplicate action id ${actionId}.`,
      });
    }

    for (const action of run.actions) {
      if (!action.id.trim()) {
        issues.push({
          code: "agent.action.missing_id",
          message: `Engineer agent run ${run.id} contains an action with no id.`,
        });
      }

      if (!action.title.trim()) {
        issues.push({
          code: "agent.action.missing_title",
          message: `Engineer agent action ${action.id} is missing a title.`,
        });
      }

      if (!action.description.trim()) {
        issues.push({
          code: "agent.action.missing_description",
          message: `Engineer agent action ${action.id} is missing a description.`,
        });
      }

      if (!action.rationale.trim()) {
        issues.push({
          code: "agent.action.missing_rationale",
          message: `Engineer agent action ${action.id} is missing a rationale.`,
        });
      }

      if (!action.planId.trim()) {
        issues.push({
          code: "agent.action.missing_plan_id",
          message: `Engineer agent action ${action.id} is missing a plan id.`,
        });
      }

      if (!action.stepId.trim()) {
        issues.push({
          code: "agent.action.missing_step_id",
          message: `Engineer agent action ${action.id} is missing a step id.`,
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
