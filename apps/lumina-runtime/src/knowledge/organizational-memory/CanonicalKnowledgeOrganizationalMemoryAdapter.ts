import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import type {
  OrganizationalMemoryRecord,
} from "./OrganizationalMemoryRecord.js";

export interface OrganizationalMemoryGeneralizationDeclaration {
  generalized:
    true;

  customerSpecificContentRetained:
    false;
}

export interface CanonicalKnowledgeOrganizationalMemoryAdapterInput {
  organizationId: string;

  projectId?: string;

  teamId?: string;

  items:
    readonly CanonicalKnowledgeItem[];

  generalization?:
    OrganizationalMemoryGeneralizationDeclaration;
}

function resolveSource(
  item:
    CanonicalKnowledgeItem,
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

function asRecord(
  value:
    unknown,
): Record<string, unknown> | undefined {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    return undefined;
  }

  return value as
    Record<string, unknown>;
}

function stringValue(
  value:
    unknown,
): string | undefined {
  return typeof value ===
    "string" &&
    value.trim()
    ? value
    : undefined;
}

function numberValue(
  value:
    unknown,
): number | undefined {
  return typeof value ===
    "number" &&
    Number.isFinite(
      value,
    )
    ? value
    : undefined;
}

function stringArray(
  value:
    unknown,
): string[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value.filter(
    (
      entry,
    ): entry is string =>
      typeof entry ===
        "string" &&
      Boolean(
        entry.trim(),
      ),
  );
}

function unique(
  values:
    readonly string[],
): string[] {
  return [
    ...new Set(
      values,
    ),
  ];
}

export function adaptCanonicalKnowledgeToOrganizationalMemoryRecords(
  input:
    CanonicalKnowledgeOrganizationalMemoryAdapterInput,
): OrganizationalMemoryRecord[] {
  return input.items.map(
    (
      item,
    ): OrganizationalMemoryRecord => {
      const governance =
        asRecord(
          item.metadata
            .governance,
        );

      const provenance =
        asRecord(
          governance
            ?.provenance,
        );

      const reviewDecision =
        stringValue(
          governance
            ?.reviewDecision,
        );

      const reviewerId =
        stringValue(
          governance
            ?.reviewerId,
        );

      const reviewedAt =
        numberValue(
          governance
            ?.reviewedAt,
        );

      const evidenceRefs =
        [
          ...item.evidenceRefs,
        ];

      const provenanceRefs =
        unique([
          ...evidenceRefs,

          ...stringArray(
            provenance
              ?.evidenceIds,
          ),

          ...stringArray(
            provenance
              ?.sourceLocations,
          ),

          ...stringArray(
            provenance
              ?.contentRefs,
          ),

          ...stringArray(
            provenance
              ?.sources,
          ),
        ]);

      const humanApproved =
        reviewDecision ===
          "approved" &&
        Boolean(
          reviewerId,
        ) &&
        reviewedAt !==
          undefined;

      return {
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

        references:
          unique([
            item.id,
            ...evidenceRefs,
          ]),

        governance: {
          canonicalItemId:
            item.id,

          packageId:
            stringValue(
              governance
                ?.packageId,
            ),

          packageVersion:
            stringValue(
              governance
                ?.packageVersion,
            ),

          authority:
            stringValue(
              governance
                ?.authority,
            ),

          owner:
            stringValue(
              governance
                ?.owner,
            ),

          scope:
            stringValue(
              governance
                ?.scope,
            ),

          approval:
            humanApproved
              ? {
                  decision:
                    "approved",

                  reviewerId:
                    reviewerId!,

                  reviewedAt:
                    reviewedAt!,

                  reason:
                    governance
                      ?.reviewReason,
                }
              : undefined,

          provenanceRefs,

          lineage:
            stringArray(
              governance
                ?.lineage,
            ),

          dependencies:
            stringArray(
              governance
                ?.dependencies,
            ),

          supersedes:
            stringArray(
              governance
                ?.supersedes,
            ),

          trust: {
            canonical:
              true,

            humanApproved,

            adaptationValidated:
              false,
          },

          privacy: {
            generalized:
              input.generalization
                ?.generalized ===
              true,

            customerSpecificContentRetained:
              false,
          },
        },

        createdAt:
          new Date(
            item.createdAt,
          ).toISOString(),
      };
    },
  );
}
