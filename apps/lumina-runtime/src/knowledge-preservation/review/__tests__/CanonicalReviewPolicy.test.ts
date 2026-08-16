import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import {
  classifyCanonicalReview,
} from "../CanonicalReviewPolicy.js";

function packageFixture(
  overrides:
    Partial<KnowledgePackage> = {},
): KnowledgePackage {
  return {
    id:
      "KP-2026-000999",

    state:
      "awaiting_review",

    approvalState:
      "pending_review",

    sourceEvidenceRefs: [
      "evidence:test",
    ],

    knowledgeItemIds: [
      "ir:test",
    ],

    provenance: {
      evidenceIds: [
        "evidence:test",
      ],

      sourceLocations: [
        "docs/test.md",
      ],

      contentRefs: [
        "docs/test.md",
      ],

      sources: [
        "docs/test.md",
      ],
    },

    authority:
      "architecture-specification",

    owner:
      "KoreLumina Architecture",

    scope:
      "platform",

    version:
      "1.0",

    confidence:
      1,

    destination:
      null,

    dependencies:
      [],

    lineage:
      [],

    supersession: {
      supersedes:
        [],

      supersededBy:
        [],
    },

    validationResults:
      [],

    compilerHistory:
      [],

    remediation: {
      required:
        false,

      status:
        "not_required",

      blockedItemIds:
        [],

      updatedAt:
        Date.UTC(
          2026,
          0,
          1,
        ),
    },

    lifecycleHistory:
      [],

    metadata:
      {},

    createdAt:
      Date.UTC(
        2026,
        0,
        1,
      ),

    updatedAt:
      Date.UTC(
        2026,
        0,
        1,
      ),

    items:
      [],

    ...overrides,
  };
}

test(
  "constitutional package always requires individual review",
  () => {
    const result =
      classifyCanonicalReview(
        packageFixture({
          authority:
            "constitutional",

          confidence:
            1,
        }),
      );

    assert.equal(
      result.mode,
      "individual",
    );

    assert.equal(
      result.risk,
      "critical",
    );
  },
);

test(
  "high confidence does not create policy approval authority",
  () => {
    const result =
      classifyCanonicalReview(
        packageFixture({
          confidence:
            1,
        }),
      );

    assert.equal(
      result.mode,
      "batch_candidate",
    );

    assert.equal(
      result.policyId,
      undefined,
    );
  },
);

test(
  "healthy governed package is batch candidate by default",
  () => {
    const result =
      classifyCanonicalReview(
        packageFixture(),
      );

    assert.equal(
      result.mode,
      "batch_candidate",
    );

    assert.equal(
      result.risk,
      "standard",
    );
  },
);

test(
  "explicit policy metadata without persisted authority does not create policy candidacy",
  () => {
    const knowledgePackage =
      packageFixture();

    knowledgePackage.metadata = {
      canonicalReviewPolicy: {
        policyId:
          "POLICY-DOC-LOW-RISK-V1",

        policyVersion:
          "1.0",

        authorizedBy:
          "Knowledge Governance Council",
      },
    };

    const result =
      classifyCanonicalReview(
        knowledgePackage,
      );

    assert.equal(
      result.mode,
      "batch_candidate",
    );

    assert.equal(
      result.policyId,
      undefined,
    );

    assert.equal(
      knowledgePackage
        .approvalState,
      "pending_review",
    );

    assert.equal(
      knowledgePackage.state,
      "awaiting_review",
    );
  },
);

test(
  "validation defect blocks scalable review routing",
  () => {
    const result =
      classifyCanonicalReview(
        packageFixture({
          validationResults: [
            {
              itemId:
                "ir:test",

              status:
                "rejected",

              confidence:
                1,

              blocked:
                true,

              details: {
                issues: [
                  {
                    code:
                      "test_blocking_validation_issue",
                  },
                ],
              },
            },
          ],
        }),
      );

    assert.equal(
      result.mode,
      "blocked",
    );

    assert.equal(
      result.risk,
      "blocked",
    );
  },
);

test(
  "remediation-required package is blocked from batch or policy review",
  () => {
    const knowledgePackage =
      packageFixture();

    knowledgePackage.remediation = {
      ...knowledgePackage
        .remediation,

      required:
        true,

      status:
        "required",
    };

    const result =
      classifyCanonicalReview(
        knowledgePackage,
      );

    assert.equal(
      result.mode,
      "blocked",
    );
  },
);

import {
  removeCanonicalReviewPolicyForTest,
  saveCanonicalReviewPolicy,
} from "../CanonicalReviewPolicyStore.js";

test(
  "package metadata alone cannot create policy authority",
  () => {
    const policyId =
      `POLICY-UNPERSISTED-${Date.now()}`;

    const knowledgePackage =
      packageFixture();

    knowledgePackage.metadata = {
      canonicalReviewPolicy: {
        policyId,

        policyVersion:
          "1.0.0",

        authorizedBy:
          "self-declared-package-metadata",
      },
    };

    const result =
      classifyCanonicalReview(
        knowledgePackage,
      );

    assert.equal(
      result.mode,
      "batch_candidate",
    );

    assert.equal(
      result.policyId,
      undefined,
    );
  },
);

test(
  "active persisted matching policy creates policy candidacy without approval",
  () => {
    const policyId =
      `POLICY-DOC-${Date.now()}`;

    const version =
      "1.0.0";

    saveCanonicalReviewPolicy({
      id:
        policyId,

      version,

      status:
        "active",

      title:
        "Governed documentation review policy",

      authority:
        "architecture-specification",

      scope:
        "platform",

      owner:
        "Knowledge Governance",

      authorizedBy:
        "human:knowledge-governance",

      authorizedAt:
        Date.UTC(
          2026,
          7,
          16,
        ),

      createdAt:
        Date.UTC(
          2026,
          7,
          16,
        ),

      updatedAt:
        Date.UTC(
          2026,
          7,
          16,
        ),

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

        excludedAuthorities: [
          "constitutional",
        ],
      },
    });

    try {
      const knowledgePackage =
        packageFixture();

      knowledgePackage.metadata = {
        canonicalReviewPolicy: {
          policyId,

          policyVersion:
            version,
        },
      };

      const result =
        classifyCanonicalReview(
          knowledgePackage,
        );

      assert.equal(
        result.mode,
        "policy_candidate",
      );

      assert.equal(
        result.policyId,
        policyId,
      );

      assert.equal(
        knowledgePackage.state,
        "awaiting_review",
      );

      assert.equal(
        knowledgePackage.approvalState,
        "pending_review",
      );
    } finally {
      removeCanonicalReviewPolicyForTest(
        policyId,
        version,
      );
    }
  },
);

test(
  "revoked policy cannot create policy candidacy",
  () => {
    const policyId =
      `POLICY-REVOKED-${Date.now()}`;

    const version =
      "1.0.0";

    saveCanonicalReviewPolicy({
      id:
        policyId,

      version,

      status:
        "revoked",

      title:
        "Revoked review policy",

      authority:
        "architecture-specification",

      scope:
        "platform",

      owner:
        "Knowledge Governance",

      authorizedBy:
        "human:knowledge-governance",

      authorizedAt:
        Date.UTC(
          2026,
          7,
          16,
        ),

      createdAt:
        Date.UTC(
          2026,
          7,
          16,
        ),

      updatedAt:
        Date.UTC(
          2026,
          7,
          16,
        ),

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

        excludedAuthorities: [
          "constitutional",
        ],
      },
    });

    try {
      const knowledgePackage =
        packageFixture();

      knowledgePackage.metadata = {
        canonicalReviewPolicy: {
          policyId,

          policyVersion:
            version,
        },
      };

      const result =
        classifyCanonicalReview(
          knowledgePackage,
        );

      assert.equal(
        result.mode,
        "batch_candidate",
      );
    } finally {
      removeCanonicalReviewPolicyForTest(
        policyId,
        version,
      );
    }
  },
);

test(
  "policy authority and scope mismatch requires individual review",
  () => {
    const policyId =
      `POLICY-MISMATCH-${Date.now()}`;

    const version =
      "1.0.0";

    saveCanonicalReviewPolicy({
      id:
        policyId,

      version,

      status:
        "active",

      title:
        "Mismatched review policy",

      authority:
        "architecture-specification",

      scope:
        "different-scope",

      owner:
        "Knowledge Governance",

      authorizedBy:
        "human:knowledge-governance",

      authorizedAt:
        Date.UTC(
          2026,
          7,
          16,
        ),

      createdAt:
        Date.UTC(
          2026,
          7,
          16,
        ),

      updatedAt:
        Date.UTC(
          2026,
          7,
          16,
        ),

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

        excludedAuthorities: [
          "constitutional",
        ],
      },
    });

    try {
      const knowledgePackage =
        packageFixture();

      knowledgePackage.metadata = {
        canonicalReviewPolicy: {
          policyId,

          policyVersion:
            version,
        },
      };

      const result =
        classifyCanonicalReview(
          knowledgePackage,
        );

      assert.equal(
        result.mode,
        "individual",
      );

      assert.equal(
        result.risk,
        "critical",
      );
    } finally {
      removeCanonicalReviewPolicyForTest(
        policyId,
        version,
      );
    }
  },
);
