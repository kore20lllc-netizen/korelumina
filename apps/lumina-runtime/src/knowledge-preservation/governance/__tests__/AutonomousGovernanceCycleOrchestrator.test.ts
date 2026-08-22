import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import type {
  AutonomousGovernedCanonicalPromotionResult,
} from "../../promotion/index.js";

import type {
  BindCanonicalReviewPolicyResult,
  CanonicalReviewPolicyExecutionResult,
} from "../../review/index.js";

import {
  saveCanonicalReviewPolicy,
} from "../../review/index.js";

import {
  AutonomousGovernanceCycleOrchestrator,
} from "../AutonomousGovernanceCycleOrchestrator.js";

const suffix =
  `${Date.now()}-${process.pid}`;

function packageRecord(
  id:
    string,

  overrides:
    Partial<KnowledgePackage> =
      {},
):
  KnowledgePackage {
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
      "architecture",

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

    metadata:
      {},

    ...overrides,
  };
}

function savePolicy(
  id:
    string,
) {
  saveCanonicalReviewPolicy({
    id,

    version:
      "1.0.0",

    status:
      "active",

    title:
      "Vision 2050 Architecture Governance",

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

      excludedAuthorities: [
        "constitutional",
      ],
    },
  });
}

function reviewResult(
  policyId:
    string,

  actorId:
    string,

  packageIds:
    string[],
):
  CanonicalReviewPolicyExecutionResult {
  return {
    policy: {
      id:
        policyId,

      version:
        "1.0.0",

      status:
        "active",
    },

    executedBy:
      actorId,

    executedAt:
      3000,

    eligiblePackages:
      packageIds.length,

    compliantPackages:
      packageIds.length,

    exceptions:
      0,

    blocked:
      0,

    decisions:
      packageIds.map(
        (packageId) => ({
          packageId,

          decision:
            "approved" as const,

          review: {
            reviewerId:
              "human:founder",
          },
        }),
      ),

    evaluations:
      [],

    promotion:
      null,
  };
}

function promotionResult(
  policyId:
    string,

  actorId:
    string,

  packageIds:
    string[],
):
  AutonomousGovernedCanonicalPromotionResult {
  return {
    executionId:
      "autonomous-promotion:test",

    policyId,

    policyVersion:
      "1.0.0",

    actorId,

    executedAt:
      3000,

    eligible:
      packageIds.length,

    promoted:
      packageIds.length,

    alreadyCanonical:
      0,

    failed:
      0,

    exceptions:
      0,

    packages:
      packageIds.map(
        (
          packageId,
          index,
        ) => ({
          packageId,

          packageVersion:
            "1.0.0",

          policyId,

          policyVersion:
            "1.0.0",

          actorId,

          disposition:
            "promoted" as const,

          canonicalKnowledgeIds: [
            `canonical:${index + 1}`,
          ],
        }),
      ),
  };
}

test(
  "cycle binds then reviews then promotes through existing services",
  () => {
    const policyId =
      `PHASE48-ORDER-${suffix}`;

    savePolicy(
      policyId,
    );

    const packageId =
      `PKG-PHASE48-ORDER-${suffix}`;

    const calls:
      string[] =
        [];

    const orchestrator =
      new AutonomousGovernanceCycleOrchestrator(
        {
          list() {
            return [
              packageRecord(
                packageId,
              ),
            ];
          },
        },

        {
          bind(
            input,
          ) {
            calls.push(
              `bind:${input.packageId}`,
            );

            return {
              knowledgePackage:
                packageRecord(
                  packageId,
                ),

              binding: {
                policyId,
                policyVersion:
                  "1.0.0",
                authorizedBy:
                  "human:founder",
                authorizedAt:
                  1000,
                boundBy:
                  input.boundBy,
                boundAt:
                  input.boundAt ??
                  3000,
              },

              classification: {
                packageId,
                risk:
                  "low",
                mode:
                  "policy_candidate",
                reasons:
                  [],
                policyId,
              },

              disposition:
                "bound",
            } as BindCanonicalReviewPolicyResult;
          },
        },

        {
          execute(
            input,
          ) {
            calls.push(
              "review",
            );

            return reviewResult(
              policyId,
              input.actorId,
              [
                packageId,
              ],
            );
          },
        },

        {
          execute(
            input,
          ) {
            calls.push(
              "promote",
            );

            return promotionResult(
              policyId,
              input.actorId,
              [
                packageId,
              ],
            );
          },
        },
      );

    const result =
      orchestrator.execute({
        policyId,

        policyVersion:
          "1.0.0",

        actorId:
          "runtime:autonomous-governance",

        executedAt:
          3000,
      });

    assert.deepEqual(
      calls,
      [
        `bind:${packageId}`,
        "review",
        "promote",
      ],
    );

    assert.equal(
      result.binding.bound,
      1,
    );

    assert.equal(
      result.review
        .decisions
        .length,
      1,
    );

    assert.equal(
      result.promotion
        .promoted,
      1,
    );
  },
);

test(
  "one binding exception does not stop another package or downstream stages",
  () => {
    const policyId =
      `PHASE48-ISOLATION-${suffix}`;

    savePolicy(
      policyId,
    );

    const failId =
      `PKG-PHASE48-FAIL-${suffix}`;

    const passId =
      `PKG-PHASE48-PASS-${suffix}`;

    const bound:
      string[] =
        [];

    let reviewed =
      false;

    let promoted =
      false;

    const result =
      new AutonomousGovernanceCycleOrchestrator(
        {
          list() {
            return [
              packageRecord(
                failId,
              ),
              packageRecord(
                passId,
              ),
            ];
          },
        },

        {
          bind(
            input,
          ) {
            if (
              input.packageId ===
                failId
            ) {
              throw new Error(
                "simulated_binding_failure",
              );
            }

            bound.push(
              input.packageId,
            );

            return {
              disposition:
                "bound",
            } as BindCanonicalReviewPolicyResult;
          },
        },

        {
          execute(
            input,
          ) {
            reviewed =
              true;

            return reviewResult(
              policyId,
              input.actorId,
              [
                passId,
              ],
            );
          },
        },

        {
          execute(
            input,
          ) {
            promoted =
              true;

            return promotionResult(
              policyId,
              input.actorId,
              [
                passId,
              ],
            );
          },
        },
      ).execute({
        policyId,

        policyVersion:
          "1.0.0",

        actorId:
          "runtime:autonomous-governance",
      });

    assert.deepEqual(
      bound,
      [
        passId,
      ],
    );

    assert.equal(
      result.binding.exceptions,
      1,
    );

    assert.equal(
      result.binding.bound,
      1,
    );

    assert.equal(
      reviewed,
      true,
    );

    assert.equal(
      promoted,
      true,
    );
  },
);

test(
  "constitutional and policy-mismatched packages are not bound",
  () => {
    const policyId =
      `PHASE48-NOT-APPLICABLE-${suffix}`;

    savePolicy(
      policyId,
    );

    let bindCalls =
      0;

    const result =
      new AutonomousGovernanceCycleOrchestrator(
        {
          list() {
            return [
              packageRecord(
                `PKG-CONSTITUTIONAL-${suffix}`,
                {
                  authority:
                    "constitutional",
                },
              ),

              packageRecord(
                `PKG-OTHER-SCOPE-${suffix}`,
                {
                  scope:
                    "workspace",
                },
              ),

              packageRecord(
                `PKG-OTHER-POLICY-${suffix}`,
                {
                  metadata: {
                    canonicalReviewPolicy: {
                      policyId:
                        "OTHER-POLICY",

                      policyVersion:
                        "1.0.0",
                    },
                  },
                },
              ),
            ];
          },
        },

        {
          bind() {
            bindCalls +=
              1;

            throw new Error(
              "must_not_bind",
            );
          },
        },

        {
          execute(
            input,
          ) {
            return reviewResult(
              policyId,
              input.actorId,
              [],
            );
          },
        },

        {
          execute(
            input,
          ) {
            return promotionResult(
              policyId,
              input.actorId,
              [],
            );
          },
        },
      ).execute({
        policyId,

        policyVersion:
          "1.0.0",

        actorId:
          "runtime:autonomous-governance",
      });

    assert.equal(
      bindCalls,
      0,
    );

    assert.equal(
      result.binding
        .notApplicable,
      3,
    );

    assert.equal(
      result.binding
        .exceptions,
      0,
    );
  },
);

test(
  "already-bound package remains idempotent at binding stage",
  () => {
    const policyId =
      `PHASE48-IDEMPOTENT-${suffix}`;

    savePolicy(
      policyId,
    );

    const packageId =
      `PKG-PHASE48-IDEMPOTENT-${suffix}`;

    const result =
      new AutonomousGovernanceCycleOrchestrator(
        {
          list() {
            return [
              packageRecord(
                packageId,
                {
                  metadata: {
                    canonicalReviewPolicy: {
                      policyId,

                      policyVersion:
                        "1.0.0",
                    },
                  },
                },
              ),
            ];
          },
        },

        {
          bind() {
            return {
              disposition:
                "already_bound",
            } as BindCanonicalReviewPolicyResult;
          },
        },

        {
          execute(
            input,
          ) {
            return reviewResult(
              policyId,
              input.actorId,
              [
                packageId,
              ],
            );
          },
        },

        {
          execute(
            input,
          ) {
            return {
              ...promotionResult(
                policyId,
                input.actorId,
                [
                  packageId,
                ],
              ),

              promoted:
                0,

              alreadyCanonical:
                1,

              packages: [
                {
                  packageId,

                  packageVersion:
                    "1.0.0",

                  policyId,

                  policyVersion:
                    "1.0.0",

                  actorId:
                    input.actorId,

                  disposition:
                    "already_canonical",

                  canonicalKnowledgeIds: [
                    "canonical:existing",
                  ],
                },
              ],
            };
          },
        },
      ).execute({
        policyId,

        policyVersion:
          "1.0.0",

        actorId:
          "runtime:autonomous-governance",
      });

    assert.equal(
      result.binding
        .alreadyBound,
      1,
    );

    assert.equal(
      result.promotion
        .alreadyCanonical,
      1,
    );
  },
);

test(
  "mechanical executor identity flows through review and promotion unchanged",
  () => {
    const policyId =
      `PHASE48-ACTOR-${suffix}`;

    savePolicy(
      policyId,
    );

    const packageId =
      `PKG-PHASE48-ACTOR-${suffix}`;

    const actors:
      string[] =
        [];

    new AutonomousGovernanceCycleOrchestrator(
      {
        list() {
          return [
            packageRecord(
              packageId,
            ),
          ];
        },
      },

      {
        bind(
          input,
        ) {
          actors.push(
            `bind:${input.boundBy}`,
          );

          return {
            disposition:
              "bound",
          } as BindCanonicalReviewPolicyResult;
        },
      },

      {
        execute(
          input,
        ) {
          actors.push(
            `review:${input.actorId}`,
          );

          return reviewResult(
            policyId,
            input.actorId,
            [
              packageId,
            ],
          );
        },
      },

      {
        execute(
          input,
        ) {
          actors.push(
            `promote:${input.actorId}`,
          );

          return promotionResult(
            policyId,
            input.actorId,
            [
              packageId,
            ],
          );
        },
      },
    ).execute({
      policyId,

      policyVersion:
        "1.0.0",

      actorId:
        "runtime:autonomous-governance",
    });

    assert.deepEqual(
      actors,
      [
        "bind:runtime:autonomous-governance",
        "review:runtime:autonomous-governance",
        "promote:runtime:autonomous-governance",
      ],
    );
  },
);

test(
  "inactive policy stops before binding review or promotion",
  () => {
    const policyId =
      `PHASE48-INACTIVE-${suffix}`;

    saveCanonicalReviewPolicy({
      id:
        policyId,

      version:
        "1.0.0",

      status:
        "revoked",

      title:
        "Revoked policy",

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
        2000,

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
    });

    let calls =
      0;

    const orchestrator =
      new AutonomousGovernanceCycleOrchestrator(
        {
          list() {
            calls +=
              1;

            return [];
          },
        },

        {
          bind() {
            calls +=
              1;

            throw new Error(
              "unexpected",
            );
          },
        },

        {
          execute() {
            calls +=
              1;

            throw new Error(
              "unexpected",
            );
          },
        },

        {
          execute() {
            calls +=
              1;

            throw new Error(
              "unexpected",
            );
          },
        },
      );

    assert.throws(
      () =>
        orchestrator.execute({
          policyId,

          policyVersion:
            "1.0.0",

          actorId:
            "runtime:autonomous-governance",
        }),
      /autonomous_governance_cycle_policy_not_active:revoked/,
    );

    assert.equal(
      calls,
      0,
    );
  },
);
