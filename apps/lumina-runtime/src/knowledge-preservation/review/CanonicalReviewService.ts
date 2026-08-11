import type {
  KnowledgePackage,
} from "../package/index.js";

import {
  KnowledgePackageService,
  saveKnowledgePackage,
} from "../package/index.js";

export type CanonicalReviewDecision =
  | "approved"
  | "rejected";

export interface CanonicalReviewInput {
  packageId: string;
  decision: CanonicalReviewDecision;
  reviewerId: string;
  reviewedAt?: number;
  reason?: string;
}

export interface CanonicalReviewResult {
  knowledgePackage:
    KnowledgePackage;

  decision:
    CanonicalReviewDecision;
}

export class CanonicalReviewService {
  constructor(
    private readonly packageService =
      new KnowledgePackageService(),
  ) {}

  review(
    input: CanonicalReviewInput,
  ): CanonicalReviewResult {
    const knowledgePackage =
      this.packageService.get(
        input.packageId,
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
      "awaiting_review"
    ) {
      throw new Error(
        "knowledge_package_not_awaiting_review",
      );
    }

    if (
      !input.reviewerId.trim()
    ) {
      throw new Error(
        "canonical_review_reviewer_required",
      );
    }

    const reviewedAt =
      input.reviewedAt ??
      Date.now();

    const updated:
      KnowledgePackage = {
        ...knowledgePackage,

        state:
          input.decision,

        updatedAt:
          reviewedAt,

        metadata: {
          ...knowledgePackage.metadata,

          review: {
            decision:
              input.decision,

            reviewerId:
              input.reviewerId,

            reviewedAt,

            reason:
              input.reason,
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

      decision:
        input.decision,
    };
  }
}
