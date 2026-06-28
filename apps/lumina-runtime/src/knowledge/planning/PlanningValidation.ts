import type {
  PlanningPipelineResult,
} from "./PlanningPipeline.js";

export interface PlanningValidationIssue {
  code: string;

  message: string;
}

export interface PlanningValidationResult {
  valid: boolean;

  issues: PlanningValidationIssue[];
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

export function validatePlanningPipelineResult(
  result: PlanningPipelineResult,
): PlanningValidationResult {
  const issues: PlanningValidationIssue[] =
    [];

  const planIds =
    result.plans.map(
      (plan) =>
        plan.id,
    );

  for (const planId of findDuplicates(planIds)) {
    issues.push({
      code: "planning.plan.duplicate_id",
      message: `Planning plan id is duplicated: ${planId}.`,
    });
  }

  for (const plan of result.plans) {
    if (!plan.id.trim()) {
      issues.push({
        code: "planning.plan.missing_id",
        message: "Planning plan is missing an id.",
      });
    }

    if (!plan.title.trim()) {
      issues.push({
        code: "planning.plan.missing_title",
        message: `Planning plan ${plan.id} is missing a title.`,
      });
    }

    if (!plan.objective.trim()) {
      issues.push({
        code: "planning.plan.missing_objective",
        message: `Planning plan ${plan.id} is missing an objective.`,
      });
    }

    if (plan.steps.length === 0) {
      issues.push({
        code: "planning.plan.missing_steps",
        message: `Planning plan ${plan.id} has no steps.`,
      });
    }

    const stepIds =
      plan.steps.map(
        (step) =>
          step.id,
      );

    const stepIdSet =
      new Set(stepIds);

    for (const stepId of findDuplicates(stepIds)) {
      issues.push({
        code: "planning.step.duplicate_id",
        message: `Planning plan ${plan.id} has duplicate step id ${stepId}.`,
      });
    }

    for (const step of plan.steps) {
      if (!step.id.trim()) {
        issues.push({
          code: "planning.step.missing_id",
          message: `Planning plan ${plan.id} contains a step with no id.`,
        });
      }

      if (!step.title.trim()) {
        issues.push({
          code: "planning.step.missing_title",
          message: `Planning step ${step.id} is missing a title.`,
        });
      }

      if (!step.description.trim()) {
        issues.push({
          code: "planning.step.missing_description",
          message: `Planning step ${step.id} is missing a description.`,
        });
      }

      if (!step.rationale.trim()) {
        issues.push({
          code: "planning.step.missing_rationale",
          message: `Planning step ${step.id} is missing a rationale.`,
        });
      }

      for (const dependencyId of step.dependsOnStepIds) {
        if (!stepIdSet.has(dependencyId)) {
          issues.push({
            code: "planning.step.unknown_dependency",
            message: `Planning step ${step.id} depends on unknown step ${dependencyId}.`,
          });
        }
      }
    }
  }

  return {
    valid:
      issues.length === 0,

    issues,
  };
}
