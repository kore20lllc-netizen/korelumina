import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import {
  KnowledgePackageService,
} from "../../package/index.js";

import {
  CanonicalReviewService,
} from "../CanonicalReviewService.js";

function validatedItem(
  id:
    string,
): KnowledgeIRItem {
  return {
    id,

    candidateType:
      "CandidateArtifact",

    title:
      "Canonical review candidate",

    summary:
      "Governed review candidate.",

    confidence:
      1,

    evidenceRefs: [
      `evidence:${id}`,
    ],

    proposedRelationships:
      {},

    extractedAt:
      Date.UTC(
        2026,
        0,
        1,
      ),

    compiler: {
      compilerName:
        "CanonicalReviewTestCompiler",

      compilerVersion:
        "1.0.0",

      evidenceSourceType:
        "document",

      extractedAt:
        Date.UTC(
          2026,
          0,
          1,
        ),

      extractionMethod:
        "direct-evidence",

      confidenceBasis:
        "test-fixture",
    },

    status:
      "approved",

    metadata: {
      capturedAt:
        Date.UTC(
          2026,
          0,
          1,
        ),

      version:
        "1.0.0",

      authorityClass:
        "architecture-specification",

      approvalState:
        "approved",

      owner:
        "korelumina-architecture",

      scope:
        "platform",

      source:
        "repository",

      contentRef:
        "/repo/docs/test.md",

      sourceLocation:
        "docs/test.md",
    },
  };
}

test(
  "new reviewable package truthfully remains pending before human decision",
  () => {
    const service =
      new KnowledgePackageService();

    const created =
      service.packageValidated([
        validatedItem(
          "candidate:review-pending",
        ),
      ]);

    assert.ok(
      created,
    );

    assert.equal(
      created.state,
      "awaiting_review",
    );

    assert.equal(
      created.approvalState,
      "pending_review",
    );

    assert.equal(
      created.metadata.review,
      undefined,
    );
  },
);

test(
  "approval records explicit human decision and immutable review evidence",
  () => {
    const packageService =
      new KnowledgePackageService();

    const created =
      packageService.packageValidated([
        validatedItem(
          "candidate:review-approved",
        ),
      ]);

    assert.ok(
      created,
    );

    const reviewService =
      new CanonicalReviewService(
        packageService,
      );

    const result =
      reviewService.review({
        packageId:
          created.id,

        decision:
          "approved",

        reviewerId:
          "reviewer:test",

        reviewedAt:
          1000,

        evidenceConsidered: [
          "evidence:candidate:review-approved",
        ],

        reason:
          "Governed human approval.",
      });

    assert.equal(
      result.knowledgePackage.state,
      "approved",
    );

    assert.equal(
      result.knowledgePackage.approvalState,
      "approved",
    );

    assert.deepEqual(
      result.review,
      {
        packageId:
          created.id,

        packageVersion:
          "1.0.0",

        decision:
          "approved",

        reviewerId:
          "reviewer:test",

        reviewedAt:
          1000,

        evidenceConsidered: [
          "evidence:candidate:review-approved",
        ],

        reason:
          "Governed human approval.",
      },
    );

    assert.deepEqual(
      result.knowledgePackage
        .metadata.reviewHistory,
      [
        result.review,
      ],
    );
  },
);

test(
  "rejection preserves audit history and prevents approval state",
  () => {
    const packageService =
      new KnowledgePackageService();

    const created =
      packageService.packageValidated([
        validatedItem(
          "candidate:review-rejected",
        ),
      ]);

    assert.ok(
      created,
    );

    const result =
      new CanonicalReviewService(
        packageService,
      ).review({
        packageId:
          created.id,

        decision:
          "rejected",

        reviewerId:
          "reviewer:test",

        reviewedAt:
          2000,

        reason:
          "Insufficient authority.",
      });

    assert.equal(
      result.knowledgePackage.state,
      "rejected",
    );

    assert.equal(
      result.knowledgePackage.approvalState,
      "rejected",
    );

    assert.equal(
      (
        result.knowledgePackage
          .metadata.reviewHistory as
          unknown[]
      ).length,
      1,
    );
  },
);

test(
  "remediation-required review returns package to truthful blocked validation state",
  () => {
    const packageService =
      new KnowledgePackageService();

    const created =
      packageService.packageValidated([
        validatedItem(
          "candidate:review-remediation",
        ),
      ]);

    assert.ok(
      created,
    );

    const result =
      new CanonicalReviewService(
        packageService,
      ).review({
        packageId:
          created.id,

        decision:
          "remediation_required",

        reviewerId:
          "reviewer:test",

        reviewedAt:
          2500,

        reason:
          "Evidence requires remediation.",
      });

    assert.equal(
      result.knowledgePackage.state,
      "validated",
    );

    assert.equal(
      result.knowledgePackage.approvalState,
      "remediation_required",
    );

    assert.equal(
      result.knowledgePackage.remediation.required,
      true,
    );

    assert.equal(
      result.knowledgePackage.remediation.status,
      "required",
    );

    assert.equal(
      result.review.decision,
      "remediation_required",
    );
  },
);

test(
  "review decision persists across package service instances",
  () => {
    const packageService =
      new KnowledgePackageService();

    const created =
      packageService.packageValidated([
        validatedItem(
          "candidate:review-persistence",
        ),
      ]);

    assert.ok(
      created,
    );

    new CanonicalReviewService(
      packageService,
    ).review({
      packageId:
        created.id,

      decision:
        "approved",

      reviewerId:
        "reviewer:persistence",

      reviewedAt:
        3000,
    });

    const freshService =
      new KnowledgePackageService();

    const reloaded =
      freshService.get(
        created.id,
      );

    assert.ok(
      reloaded,
    );

    assert.equal(
      reloaded.state,
      "approved",
    );

    assert.equal(
      reloaded.approvalState,
      "approved",
    );

    assert.equal(
      (
        reloaded.metadata
          .reviewHistory as
          unknown[]
      ).length,
      1,
    );
  },
);

test(
  "review cannot be repeated after a terminal decision",
  () => {
    const packageService =
      new KnowledgePackageService();

    const created =
      packageService.packageValidated([
        validatedItem(
          "candidate:review-once",
        ),
      ]);

    assert.ok(
      created,
    );

    const reviewService =
      new CanonicalReviewService(
        packageService,
      );

    reviewService.review({
      packageId:
        created.id,

      decision:
        "approved",

      reviewerId:
        "reviewer:first",
    });

    assert.throws(
      () =>
        reviewService.review({
          packageId:
            created.id,

          decision:
            "rejected",

          reviewerId:
            "reviewer:second",
        }),

      /knowledge_package_not_awaiting_review/,
    );
  },
);

test(
  "review requires explicit reviewer identity",
  () => {
    const packageService =
      new KnowledgePackageService();

    const created =
      packageService.packageValidated([
        validatedItem(
          "candidate:review-no-reviewer",
        ),
      ]);

    assert.ok(
      created,
    );

    assert.throws(
      () =>
        new CanonicalReviewService(
          packageService,
        ).review({
          packageId:
            created.id,

          decision:
            "approved",

          reviewerId:
            "   ",
        }),

      /canonical_review_reviewer_required/,
    );
  },
);

test(
  "review defaults evidence considered to persisted package evidence",
  () => {
    const packageService =
      new KnowledgePackageService();

    const created =
      packageService.packageValidated([
        validatedItem(
          "candidate:review-default-evidence",
        ),
      ]);

    assert.ok(
      created,
    );

    const result =
      new CanonicalReviewService(
        packageService,
      ).review({
        packageId:
          created.id,

        decision:
          "approved",

        reviewerId:
          "reviewer:test",
      });

    assert.deepEqual(
      result.review.evidenceConsidered,
      created.sourceEvidenceRefs,
    );
  },
);
