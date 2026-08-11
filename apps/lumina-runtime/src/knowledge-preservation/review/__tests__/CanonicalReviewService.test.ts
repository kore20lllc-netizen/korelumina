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
  id: string,
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
      0,

    compiler: {
      compilerName:
        "CanonicalReviewTestCompiler",

      compilerVersion:
        "1.0.0",

      evidenceSourceType:
        "document",

      extractedAt:
        0,

      extractionMethod:
        "direct-evidence",

      confidenceBasis:
        "test-fixture",
    },

    status:
      "extracted",

    metadata:
      {},
  };
}

test(
  "approval transitions awaiting-review package to approved",
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

        reason:
          "Governed human approval.",
      });

    assert.equal(
      result.knowledgePackage.state,
      "approved",
    );

    assert.deepEqual(
      result.knowledgePackage.metadata.review,
      {
        decision:
          "approved",

        reviewerId:
          "reviewer:test",

        reviewedAt:
          1000,

        reason:
          "Governed human approval.",
      },
    );
  },
);

test(
  "rejection transitions awaiting-review package to rejected",
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

    const reviewService =
      new CanonicalReviewService(
        packageService,
      );

    const result =
      reviewService.review({
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
  },
);

test(
  "review cannot be repeated once package leaves awaiting-review",
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

    const reviewService =
      new CanonicalReviewService(
        packageService,
      );

    assert.throws(
      () =>
        reviewService.review({
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
