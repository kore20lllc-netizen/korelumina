import assert from "node:assert/strict";
import test from "node:test";

import {
  CanonicalKnowledgeStore,
} from "../../../canonical-knowledge/CanonicalKnowledgeStore.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import {
  KnowledgePackageService,
} from "../../package/index.js";

import {
  CanonicalReviewService,
} from "../../review/index.js";

import {
  GovernedCanonicalPromotionService,
} from "../GovernedCanonicalPromotionService.js";

function candidate(
  id: string,
): KnowledgeIRItem {
  return {
    id,

    candidateType:
      "CandidateArtifact",

    title:
      "Governed promotion candidate",

    summary:
      "Approved knowledge candidate.",

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
        "GovernedPromotionTestCompiler",

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

    metadata: {
      authorityClass:
        "constitutional",
    },
  };
}

test(
  "approved reviewed package can become canonical",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:governed-approved",
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
        "reviewer:human",

      reviewedAt:
        1000,

      reason:
        "Approved for canonical knowledge.",
    });

    const promotionService =
      new GovernedCanonicalPromotionService(
        packageService,
        canonicalStore,
      );

    const result =
      promotionService
        .promoteApprovedPackage(
          created.id,
        );

    assert.equal(
      result.knowledgePackage.state,
      "canonical",
    );

    assert.equal(
      result.canonicalItems.length,
      1,
    );

    const canonical =
      result.canonicalItems[0];

    assert.equal(
      canonical.status,
      "canonical",
    );

    assert.deepEqual(
      canonical.evidenceRefs,
      [
        "evidence:candidate:governed-approved",
      ],
    );

    const governance =
      canonical.metadata
        .governance;

    assert.ok(
      governance &&
      typeof governance ===
        "object",
    );

    const governanceRecord =
      governance as Record<
        string,
        unknown
      >;

    assert.equal(
      governanceRecord.packageId,
      created.id,
    );

    assert.equal(
      governanceRecord.reviewerId,
      "reviewer:human",
    );

    assert.equal(
      canonicalStore.size(),
      1,
    );
  },
);

test(
  "awaiting-review package cannot become canonical",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:governed-unreviewed",
        ),
      ]);

    assert.ok(
      created,
    );

    const promotionService =
      new GovernedCanonicalPromotionService(
        packageService,
        canonicalStore,
      );

    assert.throws(
      () =>
        promotionService
          .promoteApprovedPackage(
            created.id,
          ),
      /knowledge_package_not_approved/,
    );

    assert.equal(
      canonicalStore.size(),
      0,
    );
  },
);

test(
  "rejected package cannot become canonical",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:governed-rejected",
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
        "rejected",

      reviewerId:
        "reviewer:human",

      reviewedAt:
        2000,
    });

    const promotionService =
      new GovernedCanonicalPromotionService(
        packageService,
        canonicalStore,
      );

    assert.throws(
      () =>
        promotionService
          .promoteApprovedPackage(
            created.id,
          ),
      /knowledge_package_not_approved/,
    );

    assert.equal(
      canonicalStore.size(),
      0,
    );
  },
);

test(
  "approved state without review proof cannot become canonical",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:forged-approved",
        ),
      ]);

    assert.ok(
      created,
    );

    packageService.registry.register({
      ...created,

      state:
        "approved",

      approvalState:
        "approved",
    });

    const promotionService =
      new GovernedCanonicalPromotionService(
        packageService,
        canonicalStore,
      );

    assert.throws(
      () =>
        promotionService
          .promoteApprovedPackage(
            created.id,
          ),
      /governed_approval_proof_missing/,
    );

    assert.equal(
      canonicalStore.size(),
      0,
    );
  },
);

test(
  "canonicalized package persists canonical lifecycle state",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:canonical-persistence",
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

    new GovernedCanonicalPromotionService(
      packageService,
      canonicalStore,
    ).promoteApprovedPackage(
      created.id,
    );

    const freshPackageService =
      new KnowledgePackageService();

    const reloaded =
      freshPackageService.get(
        created.id,
      );

    assert.ok(
      reloaded,
    );

    assert.equal(
      reloaded.state,
      "canonical",
    );
  },
);


test(
  "remediation-required package cannot become canonical",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:governed-remediation",
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
        "remediation_required",

      reviewerId:
        "reviewer:human",

      reviewedAt:
        4000,

      reason:
        "Requires remediation.",
    });

    assert.throws(
      () =>
        new GovernedCanonicalPromotionService(
          packageService,
          canonicalStore,
        ).promoteApprovedPackage(
          created.id,
        ),
      /knowledge_package_not_approved/,
    );

    assert.equal(
      canonicalStore.size(),
      0,
    );
  },
);

test(
  "approved state with inconsistent approvalState cannot become canonical",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:forged-approval-state",
        ),
      ]);

    assert.ok(
      created,
    );

    packageService.registry.register({
      ...created,

      state:
        "approved",

      approvalState:
        "pending_review",

      metadata: {
        ...created.metadata,

        review: {
          packageId:
            created.id,

          packageVersion:
            created.version,

          decision:
            "approved",

          reviewerId:
            "reviewer:forged",

          reviewedAt:
            5000,

          evidenceConsidered:
            [
              "evidence:candidate:forged-approval-state",
            ],
        },

        reviewHistory: [
          {
            packageId:
              created.id,

            packageVersion:
              created.version,

            decision:
              "approved",

            reviewerId:
              "reviewer:forged",

            reviewedAt:
              5000,

            evidenceConsidered:
              [
                "evidence:candidate:forged-approval-state",
              ],
          },
        ],
      },
    });

    assert.throws(
      () =>
        new GovernedCanonicalPromotionService(
          packageService,
          canonicalStore,
        ).promoteApprovedPackage(
          created.id,
        ),
      /knowledge_package_not_approved/,
    );

    assert.equal(
      canonicalStore.size(),
      0,
    );
  },
);

test(
  "approved package without immutable review history cannot become canonical",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:missing-review-history",
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
        "reviewer:human",

      reviewedAt:
        6000,
    });

    const approved =
      packageService.get(
        created.id,
      );

    assert.ok(
      approved,
    );

    packageService.registry.register({
      ...approved,

      metadata: {
        ...approved.metadata,

        reviewHistory:
          [],
      },
    });

    assert.throws(
      () =>
        new GovernedCanonicalPromotionService(
          packageService,
          canonicalStore,
        ).promoteApprovedPackage(
          created.id,
        ),
      /governed_approval_history_missing/,
    );

    assert.equal(
      canonicalStore.size(),
      0,
    );
  },
);

test(
  "canonical governance record preserves package lifecycle approval and supersession evidence",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:canonical-lineage-proof",
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
        "reviewer:lineage",

      reviewedAt:
        7000,

      reason:
        "Approved with governed lineage.",
    });

    const result =
      new GovernedCanonicalPromotionService(
        packageService,
        canonicalStore,
      ).promoteApprovedPackage(
        created.id,
      );

    const governance =
      result.canonicalItems[0]
        ?.metadata
        .governance as
        Record<string, unknown>;

    assert.equal(
      governance.approvalState,
      "approved",
    );

    assert.ok(
      Array.isArray(
        governance.reviewHistory,
      ),
    );

    assert.ok(
      Array.isArray(
        governance.lifecycleHistory,
      ),
    );

    const supersession =
      governance.supersession as
        Record<string, unknown>;

    assert.deepEqual(
      supersession.supersedes,
      [],
    );

    assert.deepEqual(
      supersession.supersededBy,
      [],
    );

    const reviewEvidence =
      governance.reviewEvidence as
        Record<string, unknown>;

    assert.equal(
      reviewEvidence.packageId,
      created.id,
    );

    assert.equal(
      reviewEvidence.decision,
      "approved",
    );

    assert.equal(
      reviewEvidence.reviewerId,
      "reviewer:lineage",
    );
  },
);
