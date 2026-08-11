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
    knowledgePackage.state !==
      "canonical" ||
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

              sourceEvidenceRefs:
                [
                  ...knowledgePackage
                    .sourceEvidenceRefs,
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
          "canonical",
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
