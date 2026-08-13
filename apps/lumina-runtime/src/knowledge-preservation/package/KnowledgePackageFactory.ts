import {
  createHash,
} from "node:crypto";

import type {
  KnowledgeIRItem,
} from "../ir/index.js";

import type {
  KnowledgePackage,
} from "./KnowledgePackage.js";

function metadataString(
  item:
    KnowledgeIRItem,

  key:
    string,
): string | null {
  const value =
    item.metadata[
      key
    ];

  return typeof value ===
      "string" &&
    value.trim().length >
      0
    ? value
    : null;
}

function metadataStringArray(
  item:
    KnowledgeIRItem,

  key:
    string,
): string[] {
  const value =
    item.metadata[
      key
    ];

  if (
    typeof value ===
      "string"
  ) {
    return value.trim()
      ? [
          value,
        ]
      : [];
  }

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
      entry.trim().length >
        0,
  );
}

function commonMetadataValue(
  items:
    readonly KnowledgeIRItem[],

  key:
    string,
): string | null {
  const values =
    [
      ...new Set(
        items
          .map(
            (item) =>
              metadataString(
                item,
                key,
              ),
          )
          .filter(
            (
              value,
            ): value is string =>
              value !==
              null,
          ),
      ),
    ];

  return values.length ===
    1
    ? values[0]
    : null;
}

function sourceYear(
  items:
    readonly KnowledgeIRItem[],

  fallback:
    number,
): number {
  const sourceTimestamps =
    items
      .flatMap(
        (item) => [
          item.metadata
            .capturedAt,
          item.metadata
            .observedAt,
        ],
      )
      .filter(
        (
          value,
        ): value is number =>
          typeof value ===
            "number" &&
          Number.isFinite(
            value,
          ) &&
          value > 0,
      );

  const timestamp =
    sourceTimestamps.length >
    0
      ? Math.min(
          ...sourceTimestamps,
        )
      : fallback;

  return new Date(
    timestamp,
  ).getUTCFullYear();
}

function packageIdentity(
  items:
    readonly KnowledgeIRItem[],

  createdAt:
    number,
): string {
  const identityMaterial =
    items
      .map(
        (item) =>
          [
            item.id,
            ...item.evidenceRefs,
          ].join(
            ":",
          ),
      )
      .sort()
      .join(
        "|",
      );

  const digest =
    createHash(
      "sha256",
    )
      .update(
        identityMaterial,
      )
      .digest(
        "hex",
      );

  const numeric =
    (
      BigInt(
        `0x${digest.slice(
          0,
          12,
        )}`,
      ) %
      1_000_000_000_000n
    )
      .toString()
      .padStart(
        12,
        "0",
      );

  return [
    "KP",
    sourceYear(
      items,
      createdAt,
    ),
    numeric,
  ].join(
    "-",
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

export class KnowledgePackageFactory {
  createAwaitingReview(
    items:
      readonly KnowledgeIRItem[],
  ): KnowledgePackage {
    const now =
      Date.now();

    const sourceEvidenceRefs =
      unique(
        items.flatMap(
          (item) =>
            item.evidenceRefs,
        ),
      );

    const blockedItemIds =
      items
        .filter(
          (item) =>
            item.status ===
              "rejected" ||
            item.status ===
              "needs-review",
        )
        .map(
          (item) =>
            item.id,
        );

    const validationBlocked =
      blockedItemIds.length >
      0;

    const state =
      validationBlocked
        ? "validated" as const
        : "awaiting_review" as const;

    const approvalState =
      validationBlocked
        ? "remediation_required" as const
        : "pending_review" as const;

    return {
      id:
        packageIdentity(
          items,
          now,
        ),

      state,

      sourceEvidenceRefs,

      knowledgeItemIds:
        items.map(
          (item) =>
            item.id,
        ),

      items: [
        ...items,
      ],

      provenance: {
        evidenceIds:
          sourceEvidenceRefs,

        sourceLocations:
          unique(
            items.flatMap(
              (item) =>
                metadataStringArray(
                  item,
                  "sourceLocation",
                ),
            ),
          ),

        contentRefs:
          unique(
            items
              .map(
                (item) =>
                  metadataString(
                    item,
                    "contentRef",
                  ),
              )
              .filter(
                (
                  value,
                ): value is string =>
                  value !== null,
              ),
          ),

        sources:
          unique(
            items
              .map(
                (item) =>
                  metadataString(
                    item,
                    "source",
                  ),
              )
              .filter(
                (
                  value,
                ): value is string =>
                  value !== null,
              ),
          ),
      },

      authority:
        commonMetadataValue(
          items,
          "authorityClass",
        ),

      approvalState,

      owner:
        commonMetadataValue(
          items,
          "owner",
        ),

      scope:
        commonMetadataValue(
          items,
          "scope",
        ),

      version:
        commonMetadataValue(
          items,
          "version",
        ),

      confidence:
        items.length >
        0
          ? items.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.confidence,
              0,
            ) /
            items.length
          : 0,

      dependencies:
        unique(
          items.flatMap(
            (item) =>
              metadataStringArray(
                item,
                "dependencies",
              ),
          ),
        ),

      lineage:
        unique(
          items.flatMap(
            (item) =>
              metadataStringArray(
                item,
                "lineage",
              ),
          ),
        ),

      supersession: {
        supersedes:
          unique(
            items.flatMap(
              (item) =>
                metadataStringArray(
                  item,
                  "supersedes",
                ),
            ),
          ),

        supersededBy:
          unique(
            items.flatMap(
              (item) =>
                metadataStringArray(
                  item,
                  "supersededBy",
                ),
            ),
          ),
      },

      destination:
        commonMetadataValue(
          items,
          "destination",
        ),

      validationResults:
        items.map(
          (item) => ({
            itemId:
              item.id,

            status:
              item.status,

            confidence:
              item.confidence,

            blocked:
              item.status ===
                "rejected" ||
              item.status ===
                "needs-review",

            details:
              typeof item.metadata
                  .validation ===
                "object" &&
              item.metadata
                  .validation !==
                null
                ? {
                    ...(
                      item.metadata
                        .validation as
                        Record<
                          string,
                          unknown
                        >
                    ),
                  }
                : {},
          }),
        ),

      compilerHistory:
        items.map(
          (item) => ({
            itemId:
              item.id,

            compiler: {
              ...item.compiler,
            },
          }),
        ),

      lifecycleHistory: [
        {
          state:
            "captured",

          at:
            now,
        },

        {
          state:
            "compiled",

          at:
            now,
        },

        {
          state:
            "validated",

          at:
            now,
        },

        ...(
          validationBlocked
            ? []
            : [
                {
                  state:
                    "awaiting_review" as const,

                  at:
                    now,
                },
              ]
        ),
      ],

      remediation: {
        required:
          validationBlocked,

        status:
          validationBlocked
            ? "required"
            : "not_required",

        blockedItemIds,

        updatedAt:
          now,
      },

      createdAt:
        now,

      updatedAt:
        now,

      metadata: {
        sourceApprovalStates:
          unique(
            items.flatMap(
              (item) =>
                metadataStringArray(
                  item,
                  "approvalState",
                ),
            ),
          ),
      },
    };
  }
}
