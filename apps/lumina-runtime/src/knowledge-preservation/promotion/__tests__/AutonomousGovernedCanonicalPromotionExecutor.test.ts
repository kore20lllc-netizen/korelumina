import assert from "node:assert/strict";
import test from "node:test";

import {
  CanonicalKnowledgeStore,
} from "../../../canonical-knowledge/CanonicalKnowledgeStore.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import {
  KnowledgePackageService,
  saveKnowledgePackage,
} from "../../package/index.js";

import {
  KnowledgeManufacturingRunService,
} from "../../manufacturing/index.js";

import type {
  CanonicalReviewPolicyAuthority,
} from "../../review/CanonicalReviewPolicyStore.js";

import {
  loadCanonicalReviewPolicy,
  saveCanonicalReviewPolicy,
} from "../../review/CanonicalReviewPolicyStore.js";

import {
  GovernedCanonicalPromotionService,
} from "../GovernedCanonicalPromotionService.js";

import type {
  GovernedCanonicalPromotionPort,
} from "../AutonomousGovernedCanonicalPromotionExecutor.js";

import {
  AutonomousGovernedCanonicalPromotionExecutor,
  loadAutonomousPromotionExecution,
} from "../AutonomousGovernedCanonicalPromotionExecutor.js";

const suffix =
  `${Date.now()}-${process.pid}`;

function policy(
  id:
    string,

  version =
    "1.0.0",

  overrides:
    Partial<CanonicalReviewPolicyAuthority> =
      {},
):
  CanonicalReviewPolicyAuthority {
  return {
    id,
    version,
    status:
      "active",

    title:
      "Vision 2050 autonomous governance policy",

    authority:
      "architecture",

    scope:
      "platform",

    owner:
      "Knowledge Governance",

    authorizedBy:
      "human:founder",

    authorizedAt:
      1000,

    createdAt:
      1000,

    updatedAt:
      1000,

    supersedes:
      [],

    supersededBy:
      null,

    rules: {
      requireCompleteGovernanceIdentity:
        true,

      requireProvenance:
        true,

      requireValidationPassed:
        true,

      excludedAuthorities:
        [],
    },

    ...overrides,
  };
}

function item(
  id:
    string,
): KnowledgeIRItem {
  return {
    id:
      `item:${id}`,

    candidateType:
      "CandidateArtifact",

    title:
      `Knowledge ${id}`,

    summary:
      `Governed knowledge ${id}.`,

    confidence:
      1,

    evidenceRefs: [
      `evidence:${id}`,
    ],

    proposedRelationships:
      {},

    extractedAt:
      1000,

    compiler: {
      compilerName:
        "Phase36TestCompiler",

      compilerVersion:
        "1.0.0",

      evidenceSourceType:
        "document",

      extractedAt:
        1000,

      extractionMethod:
        "direct-evidence",

      confidenceBasis:
        "phase36-test",
    },

    status:
      "approved",

    metadata: {
      authorityClass:
        "architecture",

      sourceLocation:
        `docs/${id}.md`,
    },
  };
}

function approvedPackage(
  id:
    string,

  policyId:
    string,

  policyVersion =
    "1.0.0",

  overrides:
    Partial<KnowledgePackage> =
      {},
): KnowledgePackage {
  const review = {
    packageId:
      id,

    packageVersion:
      "1.0.0",

    decision:
      "approved",

    reviewerId:
      "policy:executor",

    reviewedAt:
      2000,

    evidenceConsidered: [
      `evidence:${id}`,
    ],

    reason:
      `governed-policy-execution:${policyId}@${policyVersion}`,
  };

  return {
    id,

    state:
      "approved",

    sourceEvidenceRefs: [
      `evidence:${id}`,
    ],

    knowledgeItemIds: [
      `item:${id}`,
    ],

    items: [
      item(
        id,
      ),
    ],

    provenance: {
      evidenceIds: [
        `evidence:${id}`,
      ],

      sourceLocations: [
        `docs/${id}.md`,
      ],

      contentRefs: [
        `content:${id}`,
      ],

      sources: [
        "repository",
      ],
    },

    authority:
      "architecture",

    approvalState:
      "approved",

    owner:
      "Knowledge Governance",

    scope:
      "platform",

    version:
      "1.0.0",

    confidence:
      1,

    dependencies:
      [],

    lineage:
      [
        `evidence:${id}`,
      ],

    supersession: {
      supersedes:
        [],

      supersededBy:
        [],
    },

    destination:
      "canonical-knowledge",

    validationResults: [
      {
        itemId:
          `item:${id}`,

        status:
          "approved",

        confidence:
          1,

        blocked:
          false,

        details:
          {},
      },
    ],

    compilerHistory:
      [],

    lifecycleHistory: [
      {
        state:
          "awaiting_review",

        at:
          1000,
      },
      {
        state:
          "approved",

        at:
          2000,
      },
    ],

    remediation: {
      required:
        false,

      status:
        "not_required",

      blockedItemIds:
        [],

      updatedAt:
        1000,
    },

    createdAt:
      1000,

    updatedAt:
      2000,

    metadata: {
      canonicalReviewPolicy: {
        policyId,
        policyVersion,
      },

      review,

      reviewHistory: [
        review,
      ],

      policyExecution: {
        policyId,
        policyVersion,

        executedBy:
          "policy:executor",

        executedAt:
          2000,

        decision:
          "approved",
      },

      policyExecutionHistory: [
        {
          policyId,
          policyVersion,

          executedBy:
            "policy:executor",

          executedAt:
            2000,

          packageIds: [
            id,
          ],

          evaluations:
            [],

          decision:
            "approved",
        },
      ],
    },

    ...overrides,
  };
}

function savePackages(
  packages:
    KnowledgePackage[],
) {
  for (
    const knowledgePackage
    of packages
  ) {
    saveKnowledgePackage(
      knowledgePackage,
    );
  }
}

function createExecutor(
  promotionService?:
    GovernedCanonicalPromotionPort,
) {
  const packageService =
    new KnowledgePackageService();

  const manufacturing =
    new KnowledgeManufacturingRunService();

  return {
    packageService,
    manufacturing,

    executor:
      new AutonomousGovernedCanonicalPromotionExecutor(
        packageService,
        manufacturing,
        promotionService ??
          new GovernedCanonicalPromotionService(
            packageService,
            new CanonicalKnowledgeStore(),
            manufacturing,
          ),
      ),
  };
}

test(
  "promotes exact policy-approved package and preserves canonical IDs from governed promotion",
  () => {
    const policyId =
      `PHASE36-EXACT-${suffix}`;

    saveCanonicalReviewPolicy(
      policy(
        policyId,
      ),
    );

    const packageId =
      `PKG-EXACT-${suffix}`;

    savePackages([
      approvedPackage(
        packageId,
        policyId,
      ),
    ]);

    const {
      executor,
    } =
      createExecutor();

    const result =
      executor.execute({
        policyId,
        policyVersion:
          "1.0.0",
        actorId:
          "runtime:autonomous-promotion",
        executedAt:
          3000,
      });

    assert.equal(
      result.eligible,
      1,
    );

    assert.equal(
      result.promoted,
      1,
    );

    assert.equal(
      result.failed,
      0,
    );

    assert.equal(
      result.exceptions,
      0,
    );

    assert.equal(
      result.packages[0]
        ?.disposition,
      "promoted",
    );

    assert.equal(
      result.packages[0]
        ?.canonicalKnowledgeIds
        .length,
      1,
    );

    const reloaded =
      new KnowledgePackageService()
        .get(
          packageId,
        );

    assert.equal(
      reloaded?.state,
      "canonical",
    );

    assert.deepEqual(
      result.packages[0]
        ?.canonicalKnowledgeIds,
      (
        reloaded?.metadata
          .canonicalization as {
            canonicalItemIds:
              string[];
          }
      ).canonicalItemIds,
    );
  },
);

test(
  "promotes two eligible packages and aggregate counts equal package dispositions",
  () => {
    const policyId =
      `PHASE36-TWO-${suffix}`;

    saveCanonicalReviewPolicy(
      policy(
        policyId,
      ),
    );

    const packageIds = [
      `PKG-TWO-A-${suffix}`,
      `PKG-TWO-B-${suffix}`,
    ];

    savePackages(
      packageIds.map(
        (id) =>
          approvedPackage(
            id,
            policyId,
          ),
      ),
    );

    const result =
      createExecutor()
        .executor
        .execute({
          policyId,
          policyVersion:
            "1.0.0",
          actorId:
            "runtime:autonomous-promotion",
        });

    assert.equal(
      result.eligible,
      2,
    );

    assert.equal(
      result.promoted,
      2,
    );

    assert.equal(
      result.alreadyCanonical,
      0,
    );

    assert.equal(
      result.failed,
      0,
    );

    assert.equal(
      result.exceptions,
      0,
    );

    assert.equal(
      result.packages.length,
      result.eligible,
    );
  },
);

test(
  "policy mismatch individual constitutional blocked and missing approval proof become exceptions",
  () => {
    const policyId =
      `PHASE36-EXCEPTIONS-${suffix}`;

    saveCanonicalReviewPolicy(
      policy(
        policyId,
      ),
    );

    const mismatch =
      approvedPackage(
        `PKG-MISMATCH-${suffix}`,
        policyId,
        "2.0.0",
      );

    const individual =
      approvedPackage(
        `PKG-INDIVIDUAL-${suffix}`,
        policyId,
        "1.0.0",
        {
          authority:
            "constitutional",
        },
      );

    const blocked =
      approvedPackage(
        `PKG-BLOCKED-${suffix}`,
        policyId,
        "1.0.0",
        {
          remediation: {
            required:
              true,

            status:
              "required",

            blockedItemIds: [
              "item:blocked",
            ],

            updatedAt:
              2000,
          },
        },
      );

    const missingProofBase =
      approvedPackage(
        `PKG-MISSING-PROOF-${suffix}`,
        policyId,
      );

    const missingProof: KnowledgePackage = {
      ...missingProofBase,

      metadata: {
        ...missingProofBase
          .metadata,

        review:
          undefined,

        reviewHistory:
          [],
      },
    };

    savePackages([
      mismatch,
      individual,
      blocked,
      missingProof,
    ]);

    const result =
      createExecutor()
        .executor
        .execute({
          policyId,
          policyVersion:
            "1.0.0",
          actorId:
            "runtime:autonomous-promotion",
        });

    const byId =
      new Map(
        result.packages.map(
          (entry) => [
            entry.packageId,
            entry,
          ],
        ),
      );

    /*
     * Version-mismatched package belongs to another
     * policy execution and therefore is not eligible
     * for this exact policy/version execution at all.
     */
    assert.equal(
      byId.has(
        mismatch.id,
      ),
      false,
    );

    assert.equal(
      byId.get(
        individual.id,
      )?.disposition,
      "exception",
    );

    assert.equal(
      byId.get(
        individual.id,
      )?.reason,
      "constitutional_authority_requires_individual_review",
    );

    assert.equal(
      byId.get(
        blocked.id,
      )?.disposition,
      "exception",
    );

    assert.equal(
      byId.get(
        missingProof.id,
      )?.disposition,
      "exception",
    );

    assert.equal(
      byId.get(
        missingProof.id,
      )?.reason,
      "review_proof_missing",
    );
  },
);

test(
  "already canonical rerun is idempotent and creates no duplicate Canonical Knowledge",
  () => {
    const policyId =
      `PHASE36-IDEMPOTENT-${suffix}`;

    saveCanonicalReviewPolicy(
      policy(
        policyId,
      ),
    );

    const packageId =
      `PKG-IDEMPOTENT-${suffix}`;

    savePackages([
      approvedPackage(
        packageId,
        policyId,
      ),
    ]);

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const packageService =
      new KnowledgePackageService();

    const manufacturing =
      new KnowledgeManufacturingRunService();

    const promotion =
      new GovernedCanonicalPromotionService(
        packageService,
        canonicalStore,
        manufacturing,
      );

    const executor =
      new AutonomousGovernedCanonicalPromotionExecutor(
        packageService,
        manufacturing,
        promotion,
      );

    const first =
      executor.execute({
        policyId,
        policyVersion:
          "1.0.0",
        actorId:
          "runtime:autonomous-promotion",
        executedAt:
          4000,
      });

    const canonicalCount =
      canonicalStore
        .size();

    const second =
      executor.execute({
        policyId,
        policyVersion:
          "1.0.0",
        actorId:
          "runtime:autonomous-promotion",
        executedAt:
          5000,
      });

    assert.equal(
      first.executionId,
      second.executionId,
    );

    assert.equal(
      first.promoted,
      1,
    );

    assert.equal(
      second.promoted,
      0,
    );

    assert.equal(
      second.alreadyCanonical,
      1,
    );

    assert.equal(
      canonicalStore.size(),
      canonicalCount,
    );

    assert.deepEqual(
      second.packages[0]
        ?.canonicalKnowledgeIds,
      first.packages[0]
        ?.canonicalKnowledgeIds,
    );

    const persisted =
      loadAutonomousPromotionExecution(
        first.executionId,
      );

    assert.equal(
      persisted
        ?.attempts
        .length,
      2,
    );
  },
);

test(
  "failure of one package does not stop the next eligible package",
  () => {
    const policyId =
      `PHASE36-FAILURE-${suffix}`;

    saveCanonicalReviewPolicy(
      policy(
        policyId,
      ),
    );

    const failId =
      `PKG-FAIL-A-${suffix}`;

    const passId =
      `PKG-FAIL-B-${suffix}`;

    savePackages([
      approvedPackage(
        failId,
        policyId,
      ),
      approvedPackage(
        passId,
        policyId,
      ),
    ]);

    const packageService =
      new KnowledgePackageService();

    const manufacturing =
      new KnowledgeManufacturingRunService();

    const realPromotion =
      new GovernedCanonicalPromotionService(
        packageService,
        new CanonicalKnowledgeStore(),
        manufacturing,
      );

    const faultIsolatingPort:
      GovernedCanonicalPromotionPort = {
        promoteApprovedPackage(
          packageId:
            string,
        ) {
          if (
            packageId ===
            failId
          ) {
            throw new Error(
              "simulated_package_failure",
            );
          }

          return realPromotion
            .promoteApprovedPackage(
              packageId,
            );
        },
      };

    const result =
      new AutonomousGovernedCanonicalPromotionExecutor(
        packageService,
        manufacturing,
        faultIsolatingPort,
      ).execute({
        policyId,
        policyVersion:
          "1.0.0",
        actorId:
          "runtime:autonomous-promotion",
      });

    const byId =
      new Map(
        result.packages.map(
          (entry) => [
            entry.packageId,
            entry,
          ],
        ),
      );

    assert.equal(
      byId.get(
        failId,
      )?.disposition,
      "failed",
    );

    assert.equal(
      byId.get(
        failId,
      )?.error,
      "simulated_package_failure",
    );

    assert.equal(
      byId.get(
        passId,
      )?.disposition,
      "promoted",
    );

    assert.equal(
      result.failed,
      1,
    );

    assert.equal(
      result.promoted,
      1,
    );
  },
);

test(
  "existing GovernedCanonicalPromotionService still completes manufacturing publication",
  () => {
    const policyId =
      `PHASE36-LINEAGE-${suffix}`;

    saveCanonicalReviewPolicy(
      policy(
        policyId,
      ),
    );

    const packageId =
      `PKG-LINEAGE-${suffix}`;

    const evidenceId =
      `evidence:${packageId}`;

    savePackages([
      approvedPackage(
        packageId,
        policyId,
      ),
    ]);

    const packageService =
      new KnowledgePackageService();

    const manufacturing =
      new KnowledgeManufacturingRunService();

    const runId =
      `KMR-PHASE36-${suffix}`;

    manufacturing.create({
      id:
        runId,

      evidenceId,

      at:
        1000,
    });

    manufacturing.linkPackage(
      runId,
      packageId,
      1000,
    );

    for (
      let index = 0;
      index < 10;
      index += 1
    ) {
      manufacturing.advance(
        runId,
        {
          outcome:
            "completed",

          at:
            1100 +
            index,
        },
      );
    }

    assert.equal(
      manufacturing
        .get(
          runId,
        )
        ?.currentStage,
      "Canonical Review",
    );

    manufacturing.advance(
      runId,
      {
        outcome:
          "approved",

        at:
          1200,
      },
    );

    assert.equal(
      manufacturing
        .get(
          runId,
        )
        ?.currentStage,
      "Canonical Knowledge",
    );

    const executor =
      new AutonomousGovernedCanonicalPromotionExecutor(
        packageService,
        manufacturing,
        new GovernedCanonicalPromotionService(
          packageService,
          new CanonicalKnowledgeStore(),
          manufacturing,
        ),
      );

    const result =
      executor.execute({
        policyId,
        policyVersion:
          "1.0.0",
        actorId:
          "runtime:autonomous-promotion",
        executedAt:
          3000,
      });

    assert.equal(
      result.promoted,
      1,
    );

    const completed =
      manufacturing.get(
        runId,
      );

    assert.equal(
      completed?.status,
      "completed",
    );

    assert.equal(
      completed?.currentStage,
      "Canonical Knowledge",
    );

    assert.deepEqual(
      completed
        ?.canonicalKnowledgeIds,
      result.packages[0]
        ?.canonicalKnowledgeIds,
    );
  },
);

test(
  "executor does not mutate policy authority or trigger Organizational Memory or education",
  () => {
    const policyId =
      `PHASE36-BOUNDARY-${suffix}`;

    const governedPolicy =
      policy(
        policyId,
      );

    saveCanonicalReviewPolicy(
      governedPolicy,
    );

    const packageId =
      `PKG-BOUNDARY-${suffix}`;

    savePackages([
      approvedPackage(
        packageId,
        policyId,
      ),
    ]);

    const before =
      loadCanonicalReviewPolicy(
        policyId,
        "1.0.0",
      );

    const result =
      createExecutor()
        .executor
        .execute({
          policyId,
          policyVersion:
            "1.0.0",
          actorId:
            "runtime:autonomous-promotion",
        });

    assert.equal(
      result.promoted,
      1,
    );

    const after =
      loadCanonicalReviewPolicy(
        policyId,
        "1.0.0",
      );

    assert.deepEqual(
      after,
      before,
    );

    const canonical =
      new KnowledgePackageService()
        .get(
          packageId,
        );

    assert.equal(
      canonical?.state,
      "canonical",
    );

    assert.equal(
      canonical
        ?.metadata
        .organizationalMemoryAdaptation,
      undefined,
    );

    assert.equal(
      canonical
        ?.metadata
        .educationalAdmission,
      undefined,
    );
  },
);
