import type {
  OrganizationalMemoryInput,
} from "./OrganizationalMemoryInput.js";

import type {
  OrganizationalMemoryInsight,
} from "./OrganizationalMemoryInsight.js";

import type {
  OrganizationalMemoryRecord,
} from "./OrganizationalMemoryRecord.js";

import {
  listOrganizationalMemoryProviders,
} from "./listOrganizationalMemoryProviders.js";

export interface OrganizationalMemoryPipelineResult {
  records: OrganizationalMemoryRecord[];

  insights: OrganizationalMemoryInsight[];
}

export async function runOrganizationalMemoryPipeline(
  input: OrganizationalMemoryInput,
): Promise<OrganizationalMemoryPipelineResult> {
  const providers =
    listOrganizationalMemoryProviders();

  const results =
    await Promise.all(
      providers.map(
        (provider) =>
          provider.recall(input),
      ),
    );

  return {
    records:
      results.flatMap(
        (result) =>
          result.records,
      ),

    insights:
      results.flatMap(
        (result) =>
          result.insights,
      ),
  };
}
