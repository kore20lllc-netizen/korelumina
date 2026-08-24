import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import type {
  OrganizationalMemoryRecord,
} from "../../knowledge/organizational-memory/index.js";

import type {
  RuntimeOrganizationalMemoryStore,
} from "../../knowledge-platform/runtime/index.js";

import type {
  ExecutiveContext,
} from "../context/index.js";

export interface ChiefAgentReasoningKnowledge {
  canonicalKnowledge:
    readonly CanonicalKnowledgeItem[];

  organizationalMemory:
    readonly OrganizationalMemoryRecord[];
}


export interface ChiefAgentCanonicalConsumptionView {
  list():
    CanonicalKnowledgeItem[];
}

function readStringArray(
  value: unknown,
): string[] {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

export class ChiefAgentReasoningKnowledgeMaterializer {
  constructor(
    private readonly canonicalConsumptionView:
      ChiefAgentCanonicalConsumptionView,

    private readonly organizationalMemoryStore:
      RuntimeOrganizationalMemoryStore,
  ) {}

  materialize(
    context:
      ExecutiveContext,
  ): ChiefAgentReasoningKnowledge {
    const metadata =
      context
        .knowledgeState
        ?.metadata;

    if (
      !metadata
    ) {
      return {
        canonicalKnowledge: [],
        organizationalMemory: [],
      };
    }

    const canonicalIds =
      readStringArray(
        metadata
          .canonicalKnowledgeIds,
      );

    const memoryIds =
      new Set(
        readStringArray(
          metadata
            .organizationalMemoryRecordIds,
        ),
      );

    const canonicalById =
      new Map(
        this.canonicalConsumptionView
          .list()
          .map(
            item => [
              item.id,
              item,
            ],
          ),
      );

    const canonicalKnowledge =
      canonicalIds
        .map(
          id =>
            canonicalById.get(
              id,
            ),
        )
        .filter(
          (
            item,
          ): item is CanonicalKnowledgeItem =>
            Boolean(item),
        );

    const organizationId =
      context.organizationId;

    const organizationalMemory =
      organizationId
        ? this.organizationalMemoryStore
            .list()
            .filter(
              (record) =>
                memoryIds.has(
                  record.id,
                ),
            )
            .filter(
              (record) =>
                record.organizationId ===
                organizationId,
            )
        : [];

    return {
      canonicalKnowledge,
      organizationalMemory,
    };
  }
}
