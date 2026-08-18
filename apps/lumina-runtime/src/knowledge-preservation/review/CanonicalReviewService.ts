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

export type CanonicalReviewDecision =
  | "approved"
  | "rejected"
  | "remediation_required";

export interface CanonicalReviewRecord {
  packageId:
    string;

  packageVersion:
    string | null;

  decision:
    CanonicalReviewDecision;

  reviewerId:
    string;

  reviewedAt:
    number;

  evidenceConsidered:
    string[];

  reason?:
    string;
}

export interface CanonicalReviewInput {
  packageId:
    string;

  decision:
    CanonicalReviewDecision;

  reviewerId:
    string;

  reviewedAt?:
    number;

  evidenceConsidered?:
    string[];

  reason?:
    string;
}

export interface CanonicalReviewResult {
  knowledgePackage:
    KnowledgePackage;

  decision:
    CanonicalReviewDecision;

  review:
    CanonicalReviewRecord;
}

function uniqueStrings(
  values:
    readonly string[],
): string[] {
  return [
    ...new Set(
      values
        .map(
          (value) =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  ];
}

function existingReviewHistory(
  knowledgePackage:
    KnowledgePackage,
): CanonicalReviewRecord[] {
  const value =
    knowledgePackage.metadata
      .reviewHistory;

  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value.filter(
    (
      record,
    ): record is CanonicalReviewRecord =>
      typeof record ===
        "object" &&
      record !==
        null,
  );
}

export class CanonicalReviewService {
  constructor(
    private readonly packageService =
      new KnowledgePackageService(),

    private readonly manufacturingRunService?:
      KnowledgeManufacturingRunService,
  ) {}

  review(
    input:
      CanonicalReviewInput,
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
        "awaiting_review" ||
      knowledgePackage.approvalState !==
        "pending_review"
    ) {
      throw new Error(
        "knowledge_package_not_awaiting_review",
      );
    }

    const reviewerId =
      input.reviewerId.trim();

    if (
      !reviewerId
    ) {
      throw new Error(
        "canonical_review_reviewer_required",
      );
    }

    const reviewedAt =
      input.reviewedAt ??
      Date.now();

    const evidenceConsidered =
      uniqueStrings(
        input.evidenceConsidered ??
        knowledgePackage
          .sourceEvidenceRefs,
      );

    if (
      evidenceConsidered.length ===
      0
    ) {
      throw new Error(
        "canonical_review_evidence_required",
      );
    }

    const review:
      CanonicalReviewRecord = {
        packageId:
          knowledgePackage.id,

        packageVersion:
          knowledgePackage.version,

        decision:
          input.decision,

        reviewerId,

        reviewedAt,

        evidenceConsidered,

        reason:
          input.reason,
      };

    const reviewHistory = [
      ...existingReviewHistory(
        knowledgePackage,
      ),
      review,
    ];

    const approved =
      input.decision ===
      "approved";

    const rejected =
      input.decision ===
      "rejected";

    const remediationRequired =
      input.decision ===
      "remediation_required";

    const nextState:
      KnowledgePackage["state"] =
      approved
        ? "approved"
        : rejected
          ? "rejected"
          : "validated";

    const nextApprovalState:
      KnowledgePackage["approvalState"] =
      approved
        ? "approved"
        : rejected
          ? "rejected"
          : "remediation_required";

    const updated:
      KnowledgePackage = {
      ...knowledgePackage,

      state:
        nextState,

      approvalState:
        nextApprovalState,

      remediation:
        remediationRequired
          ? {
              ...knowledgePackage
                .remediation,

              required:
                true,

              status:
                "required",

              updatedAt:
                reviewedAt,
            }
          : knowledgePackage
              .remediation,

      lifecycleHistory: [
        ...knowledgePackage
          .lifecycleHistory,

        {
          state:
            nextState,

          at:
            reviewedAt,

          reason:
            input.reason ??
            `canonical-review:${input.decision}`,
        },
      ],

      updatedAt:
        reviewedAt,

      metadata: {
        ...knowledgePackage
          .metadata,

        review,

        reviewHistory,
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
        "Canonical Review"
    ) {
      if (
        input.decision ===
        "approved"
      ) {
        this.manufacturingRunService
          ?.advance(
            manufacturingRun.id,
            {
              outcome:
                "approved",

              at:
                reviewedAt,

              detail:
                `Canonical review approved by ${reviewerId}.`,
            },
          );
      } else if (
        input.decision ===
        "remediation_required"
      ) {
        this.manufacturingRunService
          ?.advance(
            manufacturingRun.id,
            {
              outcome:
                "blocked",

              at:
                reviewedAt,

              detail:
                input.reason ??
                "Canonical review requires governed remediation.",
            },
          );
      } else {
        this.manufacturingRunService
          ?.advance(
            manufacturingRun.id,
            {
              outcome:
                "failed",

              at:
                reviewedAt,

              detail:
                input.reason ??
                "Canonical review rejected the Knowledge Package.",
            },
          );
      }
    }

    return {
      knowledgePackage:
        updated,

      decision:
        input.decision,

      review,
    };
  }
}
