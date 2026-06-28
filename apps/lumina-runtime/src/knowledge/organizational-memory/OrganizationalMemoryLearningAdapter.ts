import type {
  LearningInsight,
} from "../learning/LearningInsight.js";

import type {
  LearningPattern,
} from "../learning/LearningPattern.js";

import type {
  OrganizationalMemoryRecord,
} from "./OrganizationalMemoryRecord.js";

export interface OrganizationalMemoryLearningAdapterInput {
  organizationId: string;

  projectId?: string;

  teamId?: string;

  patterns: LearningPattern[];

  insights: LearningInsight[];

  references: string[];

  createdAt: string;
}

export function adaptLearningOutputToOrganizationalMemoryRecords(
  input: OrganizationalMemoryLearningAdapterInput,
): OrganizationalMemoryRecord[] {
  const patternRecords =
    input.patterns.map(
      (
        pattern,
      ): OrganizationalMemoryRecord => ({
        id:
          `learning-pattern:${pattern.id}`,

        organizationId:
          input.organizationId,

        projectId:
          input.projectId,

        teamId:
          input.teamId,

        title:
          pattern.title,

        summary:
          pattern.title,

        source:
          "architecture",

        references:
          input.references,

        createdAt:
          input.createdAt,
      }),
    );

  const insightRecords =
    input.insights.map(
      (
        insight,
      ): OrganizationalMemoryRecord => ({
        id:
          `learning-insight:${insight.id}`,

        organizationId:
          input.organizationId,

        projectId:
          input.projectId,

        teamId:
          input.teamId,

        title:
          insight.title,

        summary:
          insight.summary,

        source:
          "architecture",

        references:
          input.references,

        createdAt:
          input.createdAt,
      }),
    );

  return [
    ...patternRecords,
    ...insightRecords,
  ];
}
