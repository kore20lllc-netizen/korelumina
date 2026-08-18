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

        const canonical:
          CanonicalKnowledgeItem = {
          ...promoted,

          id:
            canonicalId,

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

  for (
    const canonicalItem
    of canonicalItems
  ) {
    platform.store
      .registerGoverned(
        canonicalItem,
      );
  }

  return canonicalItems;
}
