import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/CanonicalKnowledgeItem.js";

import {
  CanonicalKnowledgeStore,
} from "../../canonical-knowledge/CanonicalKnowledgeStore.js";

import {
  KnowledgePromoter,
} from "../../canonical-knowledge/KnowledgePromoter.js";

import type {
  KnowledgePackage,
} from "../package/index.js";

import {
  KnowledgePackageService,
  saveKnowledgePackage,
} from "../package/index.js";

interface ReviewMetadata {
  decision?: unknown;
  reviewerId?: unknown;
  reviewedAt?: unknown;
  reason?: unknown;
}

export interface GovernedPromotionResult {
  knowledgePackage:
    KnowledgePackage;

  canonicalItems:
    CanonicalKnowledgeItem[];
}

export class GovernedCanonicalPromotionService {
  private readonly promoter =
    new KnowledgePromoter();

  constructor(
    private readonly packageService =
      new KnowledgePackageService(),

    private readonly canonicalStore =
      new CanonicalKnowledgeStore(),
  ) {}

  promoteApprovedPackage(
    packageId: string,
  ): GovernedPromotionResult {
    const knowledgePackage =
      this.packageService.get(
        packageId,
      );

    if (
      !knowledgePackage
    ) {
      throw new Error(
        "knowledge_package_not_found",
      );
    }

    if (
      knowledgePackage.state !==
      "approved"
    ) {
      throw new Error(
        "knowledge_package_not_approved",
      );
    }

    const review =
      knowledgePackage.metadata
        .review as
        | ReviewMetadata
        | undefined;

    if (
      !review ||
      review.decision !==
        "approved" ||
      typeof review.reviewerId !==
        "string" ||
      !review.reviewerId.trim() ||
      typeof review.reviewedAt !==
        "number"
    ) {
      throw new Error(
        "governed_approval_proof_missing",
      );
    }

    const canonicalItems =
      knowledgePackage.items.map(
        (item) => {
          const promoted =
            this.promoter.promote(
              item,
            );

          const canonical:
            CanonicalKnowledgeItem = {
            ...promoted,

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
            },
          };

          return this.canonicalStore
            .registerGoverned(
              canonical,
            );
        },
      );

    const now =
      Date.now();

    const updated:
      KnowledgePackage = {
        ...knowledgePackage,

        state:
          "canonical",

        updatedAt:
          now,

        metadata: {
          ...knowledgePackage.metadata,

          canonicalization: {
            canonicalizedAt:
              now,

            canonicalItemIds:
              canonicalItems.map(
                (item) =>
                  item.id,
              ),
          },
        },
      };

    this.packageService
      .registry
      .register(
        updated,
      );

    saveKnowledgePackage(
      updated,
    );

    return {
      knowledgePackage:
        updated,

      canonicalItems,
    };
  }
}
