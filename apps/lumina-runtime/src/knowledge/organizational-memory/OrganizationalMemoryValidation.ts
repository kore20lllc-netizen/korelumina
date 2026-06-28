import type {
  OrganizationalMemoryPipelineResult,
} from "./OrganizationalMemoryPipeline.js";

export interface OrganizationalMemoryValidationIssue {
  code: string;

  message: string;
}

export interface OrganizationalMemoryValidationResult {
  valid: boolean;

  issues: OrganizationalMemoryValidationIssue[];
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

export function validateOrganizationalMemoryPipelineResult(
  result: OrganizationalMemoryPipelineResult,
): OrganizationalMemoryValidationResult {
  const issues: OrganizationalMemoryValidationIssue[] =
    [];

  const recordIds =
    result.records.map(
      (record) =>
        record.id,
    );

  const insightIds =
    result.insights.map(
      (insight) =>
        insight.id,
    );

  const recordIdSet =
    new Set(recordIds);

  for (const recordId of findDuplicates(recordIds)) {
    issues.push({
      code: "organizational_memory.record.duplicate_id",
      message: `Organizational memory record id is duplicated: ${recordId}.`,
    });
  }

  for (const insightId of findDuplicates(insightIds)) {
    issues.push({
      code: "organizational_memory.insight.duplicate_id",
      message: `Organizational memory insight id is duplicated: ${insightId}.`,
    });
  }

  for (const record of result.records) {
    if (!record.id.trim()) {
      issues.push({
        code: "organizational_memory.record.missing_id",
        message: "Organizational memory record is missing an id.",
      });
    }

    if (!record.organizationId.trim()) {
      issues.push({
        code: "organizational_memory.record.missing_organization_id",
        message: `Organizational memory record ${record.id} is missing an organization id.`,
      });
    }

    if (!record.title.trim()) {
      issues.push({
        code: "organizational_memory.record.missing_title",
        message: `Organizational memory record ${record.id} is missing a title.`,
      });
    }

    if (!record.summary.trim()) {
      issues.push({
        code: "organizational_memory.record.missing_summary",
        message: `Organizational memory record ${record.id} is missing a summary.`,
      });
    }

    if (!record.createdAt.trim()) {
      issues.push({
        code: "organizational_memory.record.missing_created_at",
        message: `Organizational memory record ${record.id} is missing a creation timestamp.`,
      });
    }
  }

  for (const insight of result.insights) {
    if (!insight.id.trim()) {
      issues.push({
        code: "organizational_memory.insight.missing_id",
        message: "Organizational memory insight is missing an id.",
      });
    }

    if (!insight.organizationId.trim()) {
      issues.push({
        code: "organizational_memory.insight.missing_organization_id",
        message: `Organizational memory insight ${insight.id} is missing an organization id.`,
      });
    }

    if (!insight.title.trim()) {
      issues.push({
        code: "organizational_memory.insight.missing_title",
        message: `Organizational memory insight ${insight.id} is missing a title.`,
      });
    }

    if (!insight.summary.trim()) {
      issues.push({
        code: "organizational_memory.insight.missing_summary",
        message: `Organizational memory insight ${insight.id} is missing a summary.`,
      });
    }

    if (
      insight.confidence < 0 ||
      insight.confidence > 1
    ) {
      issues.push({
        code: "organizational_memory.insight.invalid_confidence",
        message: `Organizational memory insight ${insight.id} has invalid confidence.`,
      });
    }

    for (const recordId of insight.recordIds) {
      if (!recordIdSet.has(recordId)) {
        issues.push({
          code: "organizational_memory.insight.unknown_record_reference",
          message: `Organizational memory insight ${insight.id} references unknown record ${recordId}.`,
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
