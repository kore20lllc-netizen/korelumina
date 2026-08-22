import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import type {
  CanonicalReviewPolicyAuthority,
} from "../../review/index.js";

import type {
  AutonomousGovernanceCycleInput,
  AutonomousGovernanceCycleResult,
} from "../AutonomousGovernanceCycleOrchestrator.js";

import type {
  GovernanceReadySignal,
} from "../GovernanceReadySignal.js";

import {
  GovernanceReadyRuntimeConsumer,
} from "../GovernanceReadyRuntimeConsumer.js";

const suffix =
  `${Date.now()}-${process.pid}`;

function knowledgePackage(
  overrides:
    Partial<KnowledgePackage> =
      {},
):
  KnowledgePackage {
  return {
    id:
      `KP-PHASE52-${suffix}`,

    state:
      "awaiting_review",

    sourceEvidenceRefs: [
      "evidence:phase52",
    ],

    knowledgeItemIds: [
      "item:phase52",
    ],

    items:
      [],

    provenance: {
      evidenceIds: [
        "evidence:phase52",
      ],

      sourceLocations: [
        "docs/phase52.md",
      ],

      contentRefs:
        [],

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
          "item:phase52",

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

    lifecycleHistory:
      [],

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

function policy(
  id:
    string,

  overrides:
    Partial<
      CanonicalReviewPolicyAuthority
    > =
      {},
):
  CanonicalReviewPolicyAuthority {
  return {
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

    ...overrides,
  };
}

function signal(
  packageId:
    string,
):
  GovernanceReadySignal {
  return {
    packageId,

    packageVersion:
      "1.0.0",

    manufacturingRunId:
      "KMR-PHASE52",

    evidenceId:
      "evidence:phase52",

    emittedAt:
      5000,
  };
}

function cycleResult(
  input:
    AutonomousGovernanceCycleInput,
):
  AutonomousGovernanceCycleResult {
  return {
    policyId:
      input.policyId,

    policyVersion:
      input.policyVersion,

    actorId:
      input.actorId,

    executedAt:
      input.executedAt ??
      5000,

    discovered:
      1,

    binding: {
      attempted:
        1,

      bound:
        1,

      alreadyBound:
        0,

      notApplicable:
        0,

      exceptions:
        0,

      packages:
        [],
    },

    review: {
      policy: {
        id:
          input.policyId,

        version:
          input.policyVersion,

        status:
          "active",
      },

      executedBy:
        input.actorId,

      executedAt:
        input.executedAt ??
        5000,

      eligiblePackages:
        1,

      compliantPackages:
        1,

      exceptions:
        0,

      blocked:
        0,

      decisions:
        [],

      evaluations:
        [],

      promotion:
        null,
    },

    promotion: {
      executionId:
        "promotion:phase52",

      policyId:
        input.policyId,

      policyVersion:
        input.policyVersion,

      actorId:
        input.actorId,

      executedAt:
        input.executedAt ??
        5000,

      eligible:
        1,

      promoted:
        1,

      alreadyCanonical:
        0,

      failed:
        0,

      exceptions:
        0,

      packages:
        [],
    },
  };
}

test(
  "unique active authority and scope policy executes autonomous governance cycle",
  () => {
    const packageRecord =
      knowledgePackage();

    let received:
      AutonomousGovernanceCycleInput |
      null =
        null;

    const consumer =
      new GovernanceReadyRuntimeConsumer(
        {
          get(
            id,
          ) {
            return id ===
              packageRecord.id
              ? packageRecord
              : undefined;
          },
        },

        {
          list() {
            return [
              policy(
                "vision-2050-architecture",
              ),
            ];
          },
        },

        {
          execute(
            input,
          ) {
            received =
              input;

            return cycleResult(
              input,
            );
          },
        },

        "runtime:autonomous-governance",
      );

    const result =
      consumer.consume(
        signal(
          packageRecord.id,
        ),
      );

    assert.equal(
      result.disposition,
      "executed",
    );

    assert.equal(
      result.policyId,
      "vision-2050-architecture",
    );

    assert.deepEqual(
      received,
      {
        policyId:
          "vision-2050-architecture",

        policyVersion:
          "1.0.0",

        actorId:
          "runtime:autonomous-governance",

        executedAt:
          5000,
      },
    );
  },
);

test(
  "publisher interface consumes signal and retains result",
  () => {
    const packageRecord =
      knowledgePackage();

    const consumer =
      new GovernanceReadyRuntimeConsumer(
        {
          get() {
            return packageRecord;
          },
        },

        {
          list() {
            return [
              policy(
                "vision-2050-architecture",
              ),
            ];
          },
        },

        {
          execute(
            input,
          ) {
            return cycleResult(
              input,
            );
          },
        },
      );

    consumer.publish(
      signal(
        packageRecord.id,
      ),
    );

    const results =
      consumer.listResults();

    assert.equal(
      results.length,
      1,
    );

    assert.equal(
      results[0]
        ?.disposition,
      "executed",
    );
  },
);

test(
  "no active matching policy leaves package unmodified and unexecuted",
  () => {
    const packageRecord =
      knowledgePackage();

    let cycleCalls =
      0;

    const result =
      new GovernanceReadyRuntimeConsumer(
        {
          get() {
            return packageRecord;
          },
        },

        {
          list() {
            return [
              policy(
                "workspace-policy",
                {
                  scope:
                    "workspace",
                },
              ),
            ];
          },
        },

        {
          execute() {
            cycleCalls +=
              1;

            throw new Error(
              "must_not_execute",
            );
          },
        },
      ).consume(
        signal(
          packageRecord.id,
        ),
      );

    assert.equal(
      result.disposition,
      "no_policy",
    );

    assert.equal(
      cycleCalls,
      0,
    );
  },
);

test(
  "multiple active matching policies fail closed as ambiguous",
  () => {
    const packageRecord =
      knowledgePackage();

    let cycleCalls =
      0;

    const result =
      new GovernanceReadyRuntimeConsumer(
        {
          get() {
            return packageRecord;
          },
        },

        {
          list() {
            return [
              policy(
                "policy-a",
              ),

              policy(
                "policy-b",
              ),
            ];
          },
        },

        {
          execute() {
            cycleCalls +=
              1;

            throw new Error(
              "must_not_execute",
            );
          },
        },
      ).consume(
        signal(
          packageRecord.id,
        ),
      );

    assert.equal(
      result.disposition,
      "exception",
    );

    assert.match(
      result.reason ??
        "",
      /governance_ready_ambiguous_active_policy/,
    );

    assert.equal(
      cycleCalls,
      0,
    );
  },
);

test(
  "constitutional package remains individual review",
  () => {
    const packageRecord =
      knowledgePackage({
        authority:
          "constitutional",
      });

    let cycleCalls =
      0;

    const result =
      new GovernanceReadyRuntimeConsumer(
        {
          get() {
            return packageRecord;
          },
        },

        {
          list() {
            return [
              policy(
                "constitutional-policy",
                {
                  authority:
                    "constitutional",
                },
              ),
            ];
          },
        },

        {
          execute() {
            cycleCalls +=
              1;

            throw new Error(
              "must_not_execute",
            );
          },
        },
      ).consume(
        signal(
          packageRecord.id,
        ),
      );

    assert.equal(
      result.disposition,
      "individual_review",
    );

    assert.equal(
      cycleCalls,
      0,
    );
  },
);

test(
  "stale package version does not execute governance",
  () => {
    const packageRecord =
      knowledgePackage({
        version:
          "2.0.0",
      });

    let cycleCalls =
      0;

    const result =
      new GovernanceReadyRuntimeConsumer(
        {
          get() {
            return packageRecord;
          },
        },

        {
          list() {
            return [
              policy(
                "vision-2050-architecture",
              ),
            ];
          },
        },

        {
          execute() {
            cycleCalls +=
              1;

            throw new Error(
              "must_not_execute",
            );
          },
        },
      ).consume(
        signal(
          packageRecord.id,
        ),
      );

    assert.equal(
      result.disposition,
      "stale_signal",
    );

    assert.equal(
      cycleCalls,
      0,
    );
  },
);

test(
  "package no longer awaiting review does not execute governance",
  () => {
    const packageRecord =
      knowledgePackage({
        state:
          "approved",

        approvalState:
          "approved",
      });

    let cycleCalls =
      0;

    const result =
      new GovernanceReadyRuntimeConsumer(
        {
          get() {
            return packageRecord;
          },
        },

        {
          list() {
            return [
              policy(
                "vision-2050-architecture",
              ),
            ];
          },
        },

        {
          execute() {
            cycleCalls +=
              1;

            throw new Error(
              "must_not_execute",
            );
          },
        },
      ).consume(
        signal(
          packageRecord.id,
        ),
      );

    assert.equal(
      result.disposition,
      "not_ready",
    );

    assert.equal(
      cycleCalls,
      0,
    );
  },
);

test(
  "inactive matching policy is ignored",
  () => {
    const packageRecord =
      knowledgePackage();

    let cycleCalls =
      0;

    const result =
      new GovernanceReadyRuntimeConsumer(
        {
          get() {
            return packageRecord;
          },
        },

        {
          list() {
            return [
              policy(
                "old-policy",
                {
                  status:
                    "superseded",
                },
              ),
            ];
          },
        },

        {
          execute() {
            cycleCalls +=
              1;

            throw new Error(
              "must_not_execute",
            );
          },
        },
      ).consume(
        signal(
          packageRecord.id,
        ),
      );

    assert.equal(
      result.disposition,
      "no_policy",
    );

    assert.equal(
      cycleCalls,
      0,
    );
  },
);

test(
  "policy exclusion prevents automatic policy selection",
  () => {
    const packageRecord =
      knowledgePackage();

    let cycleCalls =
      0;

    const result =
      new GovernanceReadyRuntimeConsumer(
        {
          get() {
            return packageRecord;
          },
        },

        {
          list() {
            return [
              policy(
                "excluded-policy",
                {
                  rules: {
                    requireCompleteGovernanceIdentity:
                      true,

                    requireProvenance:
                      true,

                    requireValidationPassed:
                      true,

                    excludedAuthorities: [
                      "architecture",
                    ],
                  },
                },
              ),
            ];
          },
        },

        {
          execute() {
            cycleCalls +=
              1;

            throw new Error(
              "must_not_execute",
            );
          },
        },
      ).consume(
        signal(
          packageRecord.id,
        ),
      );

    assert.equal(
      result.disposition,
      "no_policy",
    );

    assert.equal(
      cycleCalls,
      0,
    );
  },
);

test(
  "orchestrator failure becomes exception result rather than escaping publisher boundary",
  () => {
    const packageRecord =
      knowledgePackage();

    const consumer =
      new GovernanceReadyRuntimeConsumer(
        {
          get() {
            return packageRecord;
          },
        },

        {
          list() {
            return [
              policy(
                "vision-2050-architecture",
              ),
            ];
          },
        },

        {
          execute() {
            throw new Error(
              "simulated_governance_cycle_failure",
            );
          },
        },
      );

    assert.doesNotThrow(
      () =>
        consumer.publish(
          signal(
            packageRecord.id,
          ),
        ),
    );

    const result =
      consumer
        .listResults()[0];

    assert.equal(
      result?.disposition,
      "exception",
    );

    assert.equal(
      result?.reason,
      "simulated_governance_cycle_failure",
    );
  },
);
