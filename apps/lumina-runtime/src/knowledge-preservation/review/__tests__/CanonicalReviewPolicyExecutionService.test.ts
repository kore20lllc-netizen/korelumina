import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import {
  KnowledgePackageService,
  loadKnowledgePackage,
  removeKnowledgePackageForTest,
  saveKnowledgePackage,
} from "../../package/index.js";

import {
  removeCanonicalReviewPolicyForTest,
  saveCanonicalReviewPolicy,
} from "../CanonicalReviewPolicyStore.js";

import type {
  CanonicalReviewPolicyAuthority,
  CanonicalReviewPolicyStatus,
} from "../CanonicalReviewPolicyStore.js";

import {
  CanonicalReviewService,
} from "../CanonicalReviewService.js";

import {
  CanonicalReviewPolicyExecutionService,
} from "../CanonicalReviewPolicyExecutionService.js";

function policy(
  id: string,
  version: string,
  status:
    CanonicalReviewPolicyStatus =
      "active",
  overrides: Partial<
    CanonicalReviewPolicyAuthority
  > = {},
):
CanonicalReviewPolicyAuthority {
  return {
    id,
    version,
    status,

    title:
      "Governed execution policy",

    authority:
      "owner",

    scope:
      "platform",

    owner:
      "Knowledge Governance",

    authorizedBy:
      status === "draft"
        ? ""
        : "human:knowledge-governance",

    authorizedAt:
      status === "draft"
        ? 0
        : 1000,

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

function knowledgePackage(
  id: string,
  policyId: string,
  policyVersion: string,
  overrides:
    Partial<KnowledgePackage> = {},
): KnowledgePackage {
  return {
    id,

    state:
      "awaiting_review",

    sourceEvidenceRefs: [
      `evidence:${id}`,
    ],

    knowledgeItemIds: [
      `item:${id}`,
    ],

    items:
      [],

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
      "owner",

    approvalState:
      "pending_review",

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
      [],

    supersession: {
      supersedes:
        [],

      supersededBy:
        [],
    },

    destination:
      null,

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
      1000,

    metadata: {
      canonicalReviewPolicy: {
        policyId,
        policyVersion,
      },
    },

    ...overrides,
  };
}

function executionService() {
  const packageService =
    new KnowledgePackageService();

  return new CanonicalReviewPolicyExecutionService(
    packageService,
    new CanonicalReviewService(
      packageService,
    ),
  );
}

function cleanup(
  policyId: string,
  versions: string[],
  packageIds: string[] = [],
) {
  for (
    const packageId
    of packageIds
  ) {
    removeKnowledgePackageForTest(
      packageId,
    );
  }

  for (
    const version
    of versions
  ) {
    removeCanonicalReviewPolicyForTest(
      policyId,
      version,
    );
  }
}

test(
  "draft revoked and superseded policies cannot execute",
  () => {
    const id =
      `POLICY-EXEC-INACTIVE-${Date.now()}`;

    const statuses:
      CanonicalReviewPolicyStatus[] = [
        "draft",
        "revoked",
        "superseded",
      ];

    try {
      statuses.forEach(
        (
          status,
          index,
        ) => {
          const version =
            `${index + 1}.0.0`;

          saveCanonicalReviewPolicy(
            policy(
              id,
              version,
              status,
            ),
          );

          assert.throws(
            () =>
              executionService()
                .execute({
                  policyId:
                    id,

                  policyVersion:
                    version,

                  actorId:
                    "human:executor",
                }),
            new RegExp(
              `policy_not_active:${status}`,
            ),
          );
        },
      );
    } finally {
      cleanup(
        id,
        [
          "1.0.0",
          "2.0.0",
          "3.0.0",
        ],
      );
    }
  },
);

test(
  "authority mismatch is excluded from execution",
  () => {
    const id =
      `POLICY-EXEC-AUTH-${Date.now()}`;

    const packageId =
      `TEST-PACKAGE-AUTH-${Date.now()}`;

    try {
      saveCanonicalReviewPolicy(
        policy(
          id,
          "1.0.0",
        ),
      );

      saveKnowledgePackage(
        knowledgePackage(
          packageId,
          id,
          "1.0.0",
          {
            authority:
              "architecture-specification",
          },
        ),
      );

      const result =
        executionService()
          .execute({
            policyId:
              id,

            policyVersion:
              "1.0.0",

            actorId:
              "human:executor",

            executedAt:
              2000,
          });

      assert.equal(
        result.compliantPackages,
        0,
      );

      assert.equal(
        result.decisions.length,
        0,
      );

      assert.deepEqual(
        result.evaluations[0]
          ?.exceptions,
        [
          "authority_mismatch",
        ],
      );
    } finally {
      cleanup(
        id,
        [
          "1.0.0",
        ],
        [
          packageId,
        ],
      );
    }
  },
);

test(
  "scope mismatch is excluded from execution",
  () => {
    const id =
      `POLICY-EXEC-SCOPE-${Date.now()}`;

    const packageId =
      `TEST-PACKAGE-SCOPE-${Date.now()}`;

    try {
      saveCanonicalReviewPolicy(
        policy(
          id,
          "1.0.0",
        ),
      );

      saveKnowledgePackage(
        knowledgePackage(
          packageId,
          id,
          "1.0.0",
          {
            scope:
              "workspace",
          },
        ),
      );

      const result =
        executionService()
          .execute({
            policyId:
              id,

            policyVersion:
              "1.0.0",

            actorId:
              "human:executor",
          });

      assert.equal(
        result.decisions.length,
        0,
      );

      assert.ok(
        result.evaluations[0]
          ?.exceptions
          .includes(
            "scope_mismatch",
          ),
      );
    } finally {
      cleanup(
        id,
        [
          "1.0.0",
        ],
        [
          packageId,
        ],
      );
    }
  },
);

test(
  "failed validation cannot receive policy approval",
  () => {
    const id =
      `POLICY-EXEC-VALIDATION-${Date.now()}`;

    const packageId =
      `TEST-PACKAGE-VALIDATION-${Date.now()}`;

    try {
      saveCanonicalReviewPolicy(
        policy(
          id,
          "1.0.0",
        ),
      );

      const candidate =
        knowledgePackage(
          packageId,
          id,
          "1.0.0",
        );

      candidate.validationResults = [
        {
          ...candidate
            .validationResults[0],

          status:
            "needs-review",

          blocked:
            true,
        },
      ];

      saveKnowledgePackage(
        candidate,
      );

      const result =
        executionService()
          .execute({
            policyId:
              id,

            policyVersion:
              "1.0.0",

            actorId:
              "human:executor",
          });

      assert.equal(
        result.decisions.length,
        0,
      );

      assert.equal(
        result.blocked,
        1,
      );

      assert.ok(
        result.evaluations[0]
          ?.exceptions
          .includes(
            "validation_pass_required",
          ),
      );
    } finally {
      cleanup(
        id,
        [
          "1.0.0",
        ],
        [
          packageId,
        ],
      );
    }
  },
);

test(
  "excluded authority cannot execute",
  () => {
    const id =
      `POLICY-EXEC-EXCLUDED-${Date.now()}`;

    const packageId =
      `TEST-PACKAGE-EXCLUDED-${Date.now()}`;

    try {
      saveCanonicalReviewPolicy(
        policy(
          id,
          "1.0.0",
          "active",
          {
            rules: {
              requireCompleteGovernanceIdentity:
                true,

              requireProvenance:
                true,

              requireValidationPassed:
                true,

              excludedAuthorities: [
                "owner",
              ],
            },
          },
        ),
      );

      saveKnowledgePackage(
        knowledgePackage(
          packageId,
          id,
          "1.0.0",
        ),
      );

      const result =
        executionService()
          .execute({
            policyId:
              id,

            policyVersion:
              "1.0.0",

            actorId:
              "human:executor",
          });

      assert.equal(
        result.decisions.length,
        0,
      );

      assert.ok(
        result.evaluations[0]
          ?.exceptions
          .includes(
            "authority_excluded",
          ),
      );
    } finally {
      cleanup(
        id,
        [
          "1.0.0",
        ],
        [
          packageId,
        ],
      );
    }
  },
);

test(
  "active compliant policy records explicit package review without canonical promotion",
  () => {
    const id =
      `POLICY-EXEC-APPROVE-${Date.now()}`;

    const packageId =
      `TEST-PACKAGE-APPROVE-${Date.now()}`;

    try {
      saveCanonicalReviewPolicy(
        policy(
          id,
          "1.0.0",
        ),
      );

      saveKnowledgePackage(
        knowledgePackage(
          packageId,
          id,
          "1.0.0",
        ),
      );

      const result =
        executionService()
          .execute({
            policyId:
              id,

            policyVersion:
              "1.0.0",

            actorId:
              "human:policy-executor",

            executedAt:
              3000,
          });

      assert.equal(
        result.decisions.length,
        1,
      );

      assert.equal(
        result.promotion,
        null,
      );

      const persisted =
        loadKnowledgePackage(
          packageId,
        );

      assert.ok(
        persisted,
      );

      assert.equal(
        persisted.state,
        "approved",
      );

      assert.equal(
        persisted.approvalState,
        "approved",
      );

      assert.notEqual(
        persisted.state,
        "canonical",
      );

      const review =
        persisted.metadata
          .review as {
            reviewerId?: string;
            decision?: string;
          };

      assert.equal(
        review.reviewerId,
        "human:policy-executor",
      );

      assert.equal(
        review.decision,
        "approved",
      );
    } finally {
      cleanup(
        id,
        [
          "1.0.0",
        ],
        [
          packageId,
        ],
      );
    }
  },
);

test(
  "execution history persists immutable policy version",
  () => {
    const id =
      `POLICY-EXEC-HISTORY-${Date.now()}`;

    const packageId =
      `TEST-PACKAGE-HISTORY-${Date.now()}`;

    try {
      saveCanonicalReviewPolicy(
        policy(
          id,
          "2.0.0",
        ),
      );

      saveKnowledgePackage(
        knowledgePackage(
          packageId,
          id,
          "2.0.0",
        ),
      );

      executionService()
        .execute({
          policyId:
            id,

          policyVersion:
            "2.0.0",

          actorId:
            "human:policy-executor",

          executedAt:
            4000,
        });

      const persisted =
        loadKnowledgePackage(
          packageId,
        );

      assert.ok(
        persisted,
      );

      const history =
        persisted.metadata
          .policyExecutionHistory as
          Array<{
            policyId:
              string;

            policyVersion:
              string;

            executedBy:
              string;
          }>;

      assert.equal(
        history.length,
        1,
      );

      assert.equal(
        history[0]?.policyId,
        id,
      );

      assert.equal(
        history[0]
          ?.policyVersion,
        "2.0.0",
      );

      assert.equal(
        history[0]
          ?.executedBy,
        "human:policy-executor",
      );
    } finally {
      cleanup(
        id,
        [
          "2.0.0",
        ],
        [
          packageId,
        ],
      );
    }
  },
);
