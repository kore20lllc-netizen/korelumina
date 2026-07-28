import type { CapabilityPipelineResult } from "./CapabilityPipeline.js";

export interface CapabilityValidationIssue {
  code: string;
  message: string;
}

export interface CapabilityValidationResult {
  valid: boolean;
  issues: CapabilityValidationIssue[];
}

export function validateCapabilityPipelineResult(
  result: CapabilityPipelineResult,
): CapabilityValidationResult {
  const issues: CapabilityValidationIssue[] = [];

  for (const finding of result.findings) {
    if (!finding.id.trim()) {
      issues.push({
        code: "capability.finding.missing_id",
        message: "Capability finding is missing an id.",
      });
    }

    if (!finding.title.trim()) {
      issues.push({
        code: "capability.finding.missing_title",
        message: `Capability finding ${finding.id} is missing a title.`,
      });
    }

    if (!finding.description.trim()) {
      issues.push({
        code: "capability.finding.missing_description",
        message: `Capability finding ${finding.id} is missing a description.`,
      });
    }

    if (finding.evidence.length === 0) {
      issues.push({
        code: "capability.finding.missing_evidence",
        message: `Capability finding ${finding.id} has no evidence.`,
      });
    }
  }

  const findingIds = new Set(
    result.findings.map((finding) => finding.id),
  );

  for (const recommendation of result.recommendations) {
    if (!recommendation.id.trim()) {
      issues.push({
        code: "capability.recommendation.missing_id",
        message: "Capability recommendation is missing an id.",
      });
    }

    if (!recommendation.title.trim()) {
      issues.push({
        code: "capability.recommendation.missing_title",
        message: `Capability recommendation ${recommendation.id} is missing a title.`,
      });
    }

    if (!recommendation.description.trim()) {
      issues.push({
        code: "capability.recommendation.missing_description",
        message: `Capability recommendation ${recommendation.id} is missing a description.`,
      });
    }

    if (!recommendation.rationale.trim()) {
      issues.push({
        code: "capability.recommendation.missing_rationale",
        message: `Capability recommendation ${recommendation.id} is missing a rationale.`,
      });
    }

    for (const findingId of recommendation.relatedFindingIds) {
      if (!findingIds.has(findingId)) {
        issues.push({
          code: "capability.recommendation.unknown_finding_reference",
          message: `Capability recommendation ${recommendation.id} references unknown finding ${findingId}.`,
        });
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
