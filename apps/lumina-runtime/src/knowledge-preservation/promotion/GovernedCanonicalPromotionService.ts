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

import type {
  KnowledgeManufacturingRunService,
} from "../manufacturing/index.js";

interface ReviewMetadata {
  packageId?: unknown;
  packageVersion?: unknown;
  decision?: unknown;
  reviewerId?: unknown;
  reviewedAt?: unknown;
  evidenceConsidered?: unknown;
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

    private readonly manufacturingRunService?:
      KnowledgeManufacturingRunService,
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
        "approved" ||
      knowledgePackage.approvalState !==
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
      review.packageId !==
        knowledgePackage.id ||
      review.packageVersion !==
        knowledgePackage.version ||
      review.decision !==
        "approved" ||
      typeof review.reviewerId !==
        "string" ||
      !review.reviewerId.trim() ||
      typeof review.reviewedAt !==
        "number" ||
      !Array.isArray(
        review.evidenceConsidered,
      ) ||
      review.evidenceConsidered
        .length ===
        0
    ) {
      throw new Error(
        "governed_approval_proof_missing",
      );
    }

    const reviewHistory =
      knowledgePackage.metadata
        .reviewHistory;

    if (
      !Array.isArray(
        reviewHistory,
      ) ||
      !reviewHistory.some(
        (entry) =>
          typeof entry ===
            "object" &&
          entry !==
            null &&
          (
            entry as ReviewMetadata
          ).packageId ===
            knowledgePackage.id &&
          (
            entry as ReviewMetadata
          ).packageVersion ===
            knowledgePackage.version &&
          (
            entry as ReviewMetadata
          ).decision ===
            "approved" &&
          (
            entry as ReviewMetadata
          ).reviewerId ===
            review.reviewerId &&
          (
            entry as ReviewMetadata
          ).reviewedAt ===
            review.reviewedAt,
      )
    ) {
      throw new Error(
        "governed_approval_history_missing",
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

                packageVersion:
                  knowledgePackage.version,

                authority:
                  knowledgePackage.authority,

                owner:
                  knowledgePackage.owner,

                scope:
                  knowledgePackage.scope,

                destination:
                  knowledgePackage.destination,

                sourceEvidenceRefs:
                  [
                    ...knowledgePackage
                      .sourceEvidenceRefs,
                  ],

                provenance: {
                  evidenceIds:
                    [
                      ...knowledgePackage
                        .provenance
                        .evidenceIds,
                    ],

                  sourceLocations:
                    [
                      ...knowledgePackage
                        .provenance
                        .sourceLocations,
                    ],

                  contentRefs:
                    [
                      ...knowledgePackage
                        .provenance
                        .contentRefs,
                    ],

                  sources:
                    [
                      ...knowledgePackage
                        .provenance
                        .sources,
                    ],
                },

                lineage:
                  [
                    ...knowledgePackage
                      .lineage,
                  ],

                dependencies:
                  [
                    ...knowledgePackage
                      .dependencies,
                  ],

                reviewDecision:
                  review.decision,

                reviewerId:
                  review.reviewerId,

                reviewedAt:
                  review.reviewedAt,

                reviewReason:
                  review.reason,

                approvalState:
                  knowledgePackage
                    .approvalState,

                reviewEvidence: {
                  packageId:
                    review.packageId,

                  packageVersion:
                    review.packageVersion,

                  decision:
                    review.decision,

                  reviewerId:
                    review.reviewerId,

                  reviewedAt:
                    review.reviewedAt,

                  evidenceConsidered:
                    [
                      ...(
                        review.evidenceConsidered as
                          string[]
                      ),
                    ],

                  reason:
                    review.reason,
                },

                reviewHistory:
                  reviewHistory.map(
                    (entry) => ({
                      ...(
                        entry as
                          Record<
                            string,
                            unknown
                          >
                      ),
                    }),
                  ),

                lifecycleHistory:
                  knowledgePackage
                    .lifecycleHistory
                    .map(
                      (event) => ({
                        ...event,
                      }),
                    ),

                supersession: {
                  supersedes:
                    [
                      ...knowledgePackage
                        .supersession
                        .supersedes,
                    ],

                  supersededBy:
                    [
                      ...knowledgePackage
                        .supersession
                        .supersededBy,
                    ],
                },
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

        lifecycleHistory: [
          ...knowledgePackage
            .lifecycleHistory,
          {
            state:
              "canonical",

            at:
              now,

            reason:
              "governed_canonical_promotion",
          },
        ],

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

    const manufacturingRun =
      this.manufacturingRunService
        ?.findByPackageId(
          updated.id,
        );

    if (
      manufacturingRun &&
      manufacturingRun.status ===
        "active" &&
      manufacturingRun.currentStage ===
        "Canonical Knowledge"
    ) {
      this.manufacturingRunService
        ?.linkCanonicalKnowledge(
          manufacturingRun.id,
          canonicalItems.map(
            (item) =>
              item.id,
          ),
          now,
        );

      this.manufacturingRunService
        ?.advance(
          manufacturingRun.id,
          {
            outcome:
              "published",

            at:
              now,

            detail:
              `${canonicalItems.length} governed canonical item(s) published as Canonical Knowledge.`,
          },
        );
    }

    return {
      knowledgePackage:
        updated,

      canonicalItems,
    };
  }
}
