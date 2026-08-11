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
