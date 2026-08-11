import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import type {
  OrganizationalMemoryRecord,
} from "./OrganizationalMemoryRecord.js";

export interface CanonicalKnowledgeOrganizationalMemoryAdapterInput {
  organizationId: string;
  projectId?: string;
  teamId?: string;
  items: readonly CanonicalKnowledgeItem[];
}

function resolveSource(
  item: CanonicalKnowledgeItem,
): OrganizationalMemoryRecord["source"] {
  const authorityClass =
    item.metadata.authorityClass;

  if (
    authorityClass ===
    "constitutional"
  ) {
    return "architecture";
  }

  return "reconciliation";
}

export function adaptCanonicalKnowledgeToOrganizationalMemoryRecords(
  input:
    CanonicalKnowledgeOrganizationalMemoryAdapterInput,
): OrganizationalMemoryRecord[] {
  return input.items.map(
    (
      item,
    ): OrganizationalMemoryRecord => ({
      id:
        `canonical-memory:${item.id}`,

      organizationId:
        input.organizationId,

      projectId:
        input.projectId,

      teamId:
        input.teamId,

      title:
        item.title,

      summary:
        item.summary,

      source:
        resolveSource(
          item,
        ),

      references: [
        item.id,
        ...item.evidenceRefs,
      ],

      createdAt:
        new Date(
          item.createdAt,
        ).toISOString(),
    }),
  );
}
