import type {
  LearningPipelineResult,
} from "./LearningPipeline.js";

export interface LearningValidationReport {
  valid: boolean;

  duplicatePatternIds: string[];

  duplicateInsightIds: string[];

  invalidConfidencePatternIds: string[];

  insightsWithMissingPatterns: string[];
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

export function validateLearningResult(
  result: LearningPipelineResult,
): LearningValidationReport {
  const patternIds =
    result.patterns.map(
      (pattern) =>
        pattern.id,
    );

  const insightIds =
    result.insights.map(
      (insight) =>
        insight.id,
    );

  const patternIdSet =
    new Set(patternIds);

  const invalidConfidencePatternIds =
    result.patterns
      .filter(
        (pattern) =>
          pattern.confidence < 0 ||
          pattern.confidence > 1,
      )
      .map(
        (pattern) =>
          pattern.id,
      );

  const insightsWithMissingPatterns =
    result.insights
      .filter((insight) =>
        insight.patternIds.some(
          (patternId) =>
            !patternIdSet.has(patternId),
        ),
      )
      .map(
        (insight) =>
          insight.id,
      );

  const duplicatePatternIds =
    findDuplicates(
      patternIds,
    );

  const duplicateInsightIds =
    findDuplicates(
      insightIds,
    );

  return {
    valid:
      duplicatePatternIds.length === 0 &&
      duplicateInsightIds.length === 0 &&
      invalidConfidencePatternIds.length === 0 &&
      insightsWithMissingPatterns.length === 0,

    duplicatePatternIds,

    duplicateInsightIds,

    invalidConfidencePatternIds,

    insightsWithMissingPatterns,
  };
}
