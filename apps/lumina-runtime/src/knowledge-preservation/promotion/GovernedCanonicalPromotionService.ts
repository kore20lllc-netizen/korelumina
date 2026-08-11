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
  OrganizationalMemoryRecord,
} from "../../knowledge/organizational-memory/index.js";

import {
  adaptCanonicalKnowledgeToOrganizationalMemoryRecords,
} from "../../knowledge/organizational-memory/index.js";

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

export interface GovernedPromotionContext {
  organizationId: string;
  projectId?: string;
  teamId?: string;
}

export interface GovernedPromotionResult {
  knowledgePackage:
    KnowledgePackage;

  canonicalItems:
    CanonicalKnowledgeItem[];

  organizationalMemoryRecords:
    OrganizationalMemoryRecord[];
}

export interface OrganizationalMemoryPersistence {
  saveAll(
    records:
      readonly OrganizationalMemoryRecord[],
  ): void;
}

export class GovernedCanonicalPromotionService {
  private readonly promoter =
    new KnowledgePromoter();

  constructor(
    private readonly packageService =
      new KnowledgePackageService(),

    private readonly canonicalStore =
      new CanonicalKnowledgeStore(),

    private readonly organizationalMemoryPersistence?:
      OrganizationalMemoryPersistence,
  ) {}

  promoteApprovedPackage(
    packageId: string,
    context?:
      GovernedPromotionContext,
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

    const organizationalMemoryRecords =
      context
        ? adaptCanonicalKnowledgeToOrganizationalMemoryRecords({
            organizationId:
              context.organizationId,

            projectId:
              context.projectId,

            teamId:
              context.teamId,

            items:
              canonicalItems,
          })
        : [];

    if (
      organizationalMemoryRecords.length >
        0 &&
      this.organizationalMemoryPersistence
    ) {
      this.organizationalMemoryPersistence
        .saveAll(
          organizationalMemoryRecords,
        );
    }

    return {
      knowledgePackage:
        updated,

      canonicalItems,

      organizationalMemoryRecords,
    };
  }
}
