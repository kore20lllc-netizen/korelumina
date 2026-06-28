import type { ReasoningPipelineResult } from "./ReasoningPipeline.js";

export interface ReasoningValidationIssue {
  code: string;
  message: string;
}

export interface ReasoningValidationResult {
  valid: boolean;
  issues: ReasoningValidationIssue[];
}

export function validateReasoningPipelineResult(
  result: ReasoningPipelineResult,
): ReasoningValidationResult {
  const issues: ReasoningValidationIssue[] = [];

  for (const finding of result.findings) {
    if (!finding.id.trim()) {
      issues.push({
        code: "reasoning.finding.missing_id",
        message: "Reasoning finding is missing an id.",
      });
    }

    if (!finding.title.trim()) {
      issues.push({
        code: "reasoning.finding.missing_title",
        message: `Reasoning finding ${finding.id} is missing a title.`,
      });
    }

    if (!finding.description.trim()) {
      issues.push({
        code: "reasoning.finding.missing_description",
        message: `Reasoning finding ${finding.id} is missing a description.`,
      });
    }

    if (finding.evidence.length === 0) {
      issues.push({
        code: "reasoning.finding.missing_evidence",
        message: `Reasoning finding ${finding.id} has no evidence.`,
      });
    }
  }

  const findingIds = new Set(
    result.findings.map((finding) => finding.id),
  );

  for (const recommendation of result.recommendations) {
    if (!recommendation.id.trim()) {
      issues.push({
        code: "reasoning.recommendation.missing_id",
        message: "Reasoning recommendation is missing an id.",
      });
    }

    if (!recommendation.title.trim()) {
      issues.push({
        code: "reasoning.recommendation.missing_title",
        message: `Reasoning recommendation ${recommendation.id} is missing a title.`,
      });
    }

    if (!recommendation.description.trim()) {
      issues.push({
        code: "reasoning.recommendation.missing_description",
        message: `Reasoning recommendation ${recommendation.id} is missing a description.`,
      });
    }

    if (!recommendation.rationale.trim()) {
      issues.push({
        code: "reasoning.recommendation.missing_rationale",
        message: `Reasoning recommendation ${recommendation.id} is missing a rationale.`,
      });
    }

    for (const findingId of recommendation.relatedFindingIds) {
      if (!findingIds.has(findingId)) {
        issues.push({
          code: "reasoning.recommendation.unknown_finding_reference",
          message: `Reasoning recommendation ${recommendation.id} references unknown finding ${findingId}.`,
        });
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
