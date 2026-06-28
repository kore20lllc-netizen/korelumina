import type {
  OrganizationalMemoryInsight,
} from "../organizational-memory/OrganizationalMemoryInsight.js";

import type {
  OrganizationalMemoryRecord,
} from "../organizational-memory/OrganizationalMemoryRecord.js";

import type {
  AutonomousImprovementInput,
} from "./AutonomousImprovementInput.js";

export interface AutonomousImprovementMemoryAdapterInput {
  requestId: string;

  organizationId: string;

  records: OrganizationalMemoryRecord[];

  insights: OrganizationalMemoryInsight[];

  references: string[];
}

export function adaptOrganizationalMemoryToAutonomousImprovementInput(
  input: AutonomousImprovementMemoryAdapterInput,
): AutonomousImprovementInput {
  return {
    requestId:
      input.requestId,

    organizationId:
      input.organizationId,

    memoryRecordIds:
      input.records.map(
        (record) =>
          record.id,
      ),

    insightIds:
      input.insights.map(
        (insight) =>
          insight.id,
      ),

    references:
      input.references,
  };
}
