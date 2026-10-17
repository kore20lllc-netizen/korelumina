import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import {
  KnowledgePromoter,
} from "../../canonical-knowledge/index.js";

import type {
  KnowledgePackage,
} from "../../knowledge-preservation/package/index.js";

import {
  KnowledgePackageService,
  normalizeKnowledgePackage,
} from "../../knowledge-preservation/package/index.js";

import type {
  KnowledgePlatform,
} from "../KnowledgePlatform.js";

interface ReviewMetadata {
  decision?: unknown;
  reviewerId?: unknown;
  reviewedAt?: unknown;
  reason?: unknown;
}

interface CanonicalizationMetadata {
  canonicalizedAt?: unknown;
  canonicalItemIds?: unknown;
}

function rehydrateCanonicalItems(
  knowledgePackage:
    KnowledgePackage,
): CanonicalKnowledgeItem[] {
  const normalizedPackage =
    normalizeKnowledgePackage(
      knowledgePackage,
    );

  const review =
    knowledgePackage.metadata
      .review as
      | ReviewMetadata
      | undefined;

  const canonicalization =
    knowledgePackage.metadata
      .canonicalization as
      | CanonicalizationMetadata
      | undefined;

  if (
    (
      knowledgePackage.state !==
        "canonical" &&
      knowledgePackage.state !==
        "adapted"
    ) ||
    !review ||
    review.decision !==
      "approved" ||
    typeof review.reviewerId !==
      "string" ||
    !review.reviewerId.trim() ||
    typeof review.reviewedAt !==
      "number" ||
    !canonicalization ||
    typeof canonicalization.canonicalizedAt !==
      "number" ||
    !Array.isArray(
      canonicalization.canonicalItemIds,
    )
  ) {
    return [];
  }

  const canonicalItemIds =
    canonicalization.canonicalItemIds;

  const promoter =
    new KnowledgePromoter();

  return knowledgePackage.items
    .map(
      (
        item,
        index,
      ) => {
        const promoted =
          promoter.promote(
            item,
          );

        const canonicalId =
          canonicalItemIds[
            index
          ];

        if (
          typeof canonicalId !==
            "string" ||
          !canonicalId.trim()
        ) {
          return undefined;
        }

        /*
         * Timestamps derive from the governed canonicalization
         * time, never from the moment of rehydration, so that
         * rehydrating the same package is deterministic.
         */
        const canonical:
          CanonicalKnowledgeItem = {
          ...promoted,

          id:
            canonicalId,

          createdAt:
            canonicalization
              .canonicalizedAt as number,

          updatedAt:
            canonicalization
              .canonicalizedAt as number,

          metadata: {
            ...promoted.metadata,

            governance: {
              packageId:
                knowledgePackage.id,

              packageVersion:
                normalizedPackage.version,

              authority:
                normalizedPackage.authority,

              owner:
                normalizedPackage.owner,

              scope:
                normalizedPackage.scope,

              destination:
                normalizedPackage.destination,

              sourceEvidenceRefs:
                [
                  ...normalizedPackage
                    .sourceEvidenceRefs,
                ],

              provenance: {
                evidenceIds:
                  [
                    ...normalizedPackage
                      .provenance
                      .evidenceIds,
                  ],

                sourceLocations:
                  [
                    ...normalizedPackage
                      .provenance
                      .sourceLocations,
                  ],

                contentRefs:
                  [
                    ...normalizedPackage
                      .provenance
                      .contentRefs,
                  ],

                sources:
                  [
                    ...normalizedPackage
                      .provenance
                      .sources,
                  ],
              },

              lineage:
                [
                  ...normalizedPackage
                    .lineage,
                ],

              dependencies:
                [
                  ...normalizedPackage
                    .dependencies,
                ],

              supersedes:
                [
                  ...normalizedPackage
                    .supersession
                    .supersedes,
                ],

              reviewDecision:
                review.decision,

              reviewerId:
                review.reviewerId,

              reviewedAt:
                review.reviewedAt,

              reviewReason:
                review.reason,
            },

            canonicalization: {
              canonicalizedAt:
                canonicalization
                  .canonicalizedAt,
            },
          },
        };

        return canonical;
      },
    )
    .filter(
      (
        item,
      ): item is CanonicalKnowledgeItem =>
        Boolean(
          item,
        ),
    );
}

export function rehydrateRuntimeCanonicalKnowledge(
  platform:
    KnowledgePlatform,
  packageService =
    new KnowledgePackageService(),
): CanonicalKnowledgeItem[] {
  const canonicalItems =
    packageService
      .list()
      .filter(
        (knowledgePackage) =>
          knowledgePackage.state ===
            "canonical" ||
          knowledgePackage.state ===
            "adapted",
      )
      .flatMap(
        (knowledgePackage) =>
          rehydrateCanonicalItems(
            knowledgePackage,
          ),
      );

  const preserved =
    canonicalItems.map(
      (canonicalItem) =>
        preservePersistedTimestamps(
          canonicalItem,
          platform.store.get(
            canonicalItem.id,
          ),
        ),
    );

  for (
    const canonicalItem
    of preserved
  ) {
    platform.store
      .registerGoverned(
        canonicalItem,
      );
  }

  return preserved;
}


function withoutTimestamps(
  item:
    CanonicalKnowledgeItem,
): string {
  const {
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = item;

  return JSON.stringify(
    rest,
  );
}


/*
 * Canonical history is immutable. Rehydration rebuilds an item from
 * its governed package; when that item is already persisted, its
 * original createdAt is kept, and its updatedAt is kept unless the
 * rebuilt content actually differs from what is stored.
 */
export function preservePersistedTimestamps(
  rebuilt:
    CanonicalKnowledgeItem,

  persisted:
    CanonicalKnowledgeItem |
    undefined,
): CanonicalKnowledgeItem {
  if (
    !persisted
  ) {
    return rebuilt;
  }

  const unchanged =
    withoutTimestamps(
      rebuilt,
    ) ===
    withoutTimestamps(
      persisted,
    );

  return {
    ...rebuilt,
    createdAt:
      persisted.createdAt,
    updatedAt:
      unchanged
        ? persisted.updatedAt
        : Date.now(),
  };
}
