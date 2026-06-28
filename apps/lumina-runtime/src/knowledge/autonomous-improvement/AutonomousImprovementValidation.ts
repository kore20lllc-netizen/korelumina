import type {
  AutonomousImprovementPipelineResult,
} from "./AutonomousImprovementPipeline.js";

export interface AutonomousImprovementValidationIssue {
  code: string;

  message: string;
}

export interface AutonomousImprovementValidationResult {
  valid: boolean;

  issues: AutonomousImprovementValidationIssue[];
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

export function validateAutonomousImprovementPipelineResult(
  result: AutonomousImprovementPipelineResult,
): AutonomousImprovementValidationResult {
  const issues: AutonomousImprovementValidationIssue[] =
    [];

  const proposalIds =
    result.proposals.map(
      (proposal) =>
        proposal.id,
    );

  const standardIds =
    result.standards.map(
      (standard) =>
        standard.id,
    );

  for (const proposalId of findDuplicates(proposalIds)) {
    issues.push({
      code: "autonomous_improvement.proposal.duplicate_id",
      message: `Autonomous improvement proposal id is duplicated: ${proposalId}.`,
    });
  }

  for (const standardId of findDuplicates(standardIds)) {
    issues.push({
      code: "autonomous_improvement.standard.duplicate_id",
      message: `Engineering standard update id is duplicated: ${standardId}.`,
    });
  }

  for (const proposal of result.proposals) {
    if (!proposal.id.trim()) {
      issues.push({
        code: "autonomous_improvement.proposal.missing_id",
        message: "Autonomous improvement proposal is missing an id.",
      });
    }

    if (!proposal.title.trim()) {
      issues.push({
        code: "autonomous_improvement.proposal.missing_title",
        message: `Autonomous improvement proposal ${proposal.id} is missing a title.`,
      });
    }

    if (!proposal.summary.trim()) {
      issues.push({
        code: "autonomous_improvement.proposal.missing_summary",
        message: `Autonomous improvement proposal ${proposal.id} is missing a summary.`,
      });
    }

    if (!proposal.rationale.trim()) {
      issues.push({
        code: "autonomous_improvement.proposal.missing_rationale",
        message: `Autonomous improvement proposal ${proposal.id} is missing a rationale.`,
      });
    }

    if (proposal.affectedSystems.length === 0) {
      issues.push({
        code: "autonomous_improvement.proposal.missing_affected_systems",
        message: `Autonomous improvement proposal ${proposal.id} has no affected systems.`,
      });
    }
  }

  for (const standard of result.standards) {
    if (!standard.id.trim()) {
      issues.push({
        code: "autonomous_improvement.standard.missing_id",
        message: "Engineering standard update is missing an id.",
      });
    }

    if (!standard.standard.trim()) {
      issues.push({
        code: "autonomous_improvement.standard.missing_standard",
        message: `Engineering standard update ${standard.id} is missing a standard name.`,
      });
    }

    if (!standard.currentVersion.trim()) {
      issues.push({
        code: "autonomous_improvement.standard.missing_current_version",
        message: `Engineering standard update ${standard.id} is missing the current version.`,
      });
    }

    if (!standard.proposedVersion.trim()) {
      issues.push({
        code: "autonomous_improvement.standard.missing_proposed_version",
        message: `Engineering standard update ${standard.id} is missing the proposed version.`,
      });
    }

    if (!standard.justification.trim()) {
      issues.push({
        code: "autonomous_improvement.standard.missing_justification",
        message: `Engineering standard update ${standard.id} is missing justification.`,
      });
    }
  }

  return {
    valid:
      issues.length === 0,

    issues,
  };
}
