import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import type {
  KnowledgeManufacturingRun,
} from "../../manufacturing/index.js";

import type {
  GovernanceReadyConsumptionResult,
} from "../GovernanceReadyRuntimeConsumer.js";

import type {
  GovernanceReadySignal,
} from "../GovernanceReadySignal.js";

import {
  GovernanceReadyRecoverySweep,
} from "../GovernanceReadyRecoverySweep.js";

const suffix =
  `${Date.now()}-${process.pid}`;

function knowledgePackage(
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

function run(
  packageId:
    string,

  overrides:
    Partial<KnowledgeManufacturingRun> =
      {},
):
  KnowledgeManufacturingRun {
  return {
    id:
      `KMR-${packageId}`,

    evidenceId:
      `evidence:${packageId}`,

    currentStage:
      "Canonical Review",

    status:
      "active",

    packageId,

    canonicalKnowledgeIds:
      [],

    stageHistory: [
      {
        stage:
          "Canonical Review",

        outcome:
          "entered",

        at:
          1000,
      },

      {
        stage:
          "Canonical Review",

        outcome:
          "awaiting_human_review",

        at:
          1100,
      },
    ],

    createdAt:
      900,

    updatedAt:
      1100,

    ...overrides,
  };
}

function executed(
  signal:
    GovernanceReadySignal,
):
  GovernanceReadyConsumptionResult {
  return {
    signal,

    disposition:
      "executed",

    policyId:
      "vision-2050",

    policyVersion:
      "1.0.0",
  };
}

test(
  "stranded package parked at Canonical Review is recovered through existing consumer",
  () => {
    const packageId =
      `PKG-RECOVER-${suffix}`;

    const received:
      GovernanceReadySignal[] =
        [];

    const sweep =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              knowledgePackage(
                packageId,
              ),
            ];
          },
        },

        {
          findByPackageId(
            id,
          ) {
            return id ===
              packageId
              ? run(
                  packageId,
                )
              : undefined;
          },
        },

        {
          consume(
            signal,
          ) {
            received.push(
              signal,
            );

            return executed(
              signal,
            );
          },
        },

        () => 5000,
      );

    const result =
      sweep.execute();

    assert.equal(
      result.scanned,
      1,
    );

    assert.equal(
      result.recoverable,
      1,
    );

    assert.equal(
      result.recovered,
      1,
    );

    assert.equal(
      result.ignored,
      0,
    );

    assert.equal(
      result.exceptions,
      0,
    );

    assert.deepEqual(
      received,
      [
        {
          packageId,

          packageVersion:
            "1.0.0",

          manufacturingRunId:
            `KMR-${packageId}`,

          evidenceId:
            `evidence:${packageId}`,

          emittedAt:
            5000,
        },
      ],
    );
  },
);

test(
  "canonical approved and adapted packages are never reconsidered",
  () => {
    let consumerCalls =
      0;

    const result =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              knowledgePackage(
                `PKG-CANONICAL-${suffix}`,
                {
                  state:
                    "canonical",

                  approvalState:
                    "approved",
                },
              ),

              knowledgePackage(
                `PKG-APPROVED-${suffix}`,
                {
                  state:
                    "approved",

                  approvalState:
                    "approved",
                },
              ),

              knowledgePackage(
                `PKG-ADAPTED-${suffix}`,
                {
                  state:
                    "adapted",

                  approvalState:
                    "approved",
                },
              ),
            ];
          },
        },

        {
          findByPackageId() {
            throw new Error(
              "must_not_read_run",
            );
          },
        },

        {
          consume() {
            consumerCalls +=
              1;

            throw new Error(
              "must_not_consume",
            );
          },
        },
      ).execute();

    assert.equal(
      result.scanned,
      0,
    );

    assert.equal(
      consumerCalls,
      0,
    );
  },
);

test(
  "archived legacy historical reconciliation is never reconsidered",
  () => {
    const packageId =
      `PKG-ARCHIVED-LEGACY-${suffix}`;

    let runReads =
      0;

    let consumerCalls =
      0;

    const result =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              knowledgePackage(
                packageId,
                {
                  state:
                    "archived",

                  approvalState:
                    "pending_review",

                  authority:
                    null,

                  owner:
                    null,

                  scope:
                    null,

                  version:
                    null,

                  metadata: {
                    governanceException: {
                      type:
                        "incomplete_governance_identity",

                      disposition:
                        "manual_reclassification_required",

                      source:
                        "legacy_governance_identity_audit",

                      recordedAt:
                        2000,

                      recordedBy:
                        "human:founder",
                    },

                    historicalReconciliation: {
                      disposition:
                        "represented_as_genesis_historical_correlation",

                      replayId:
                        "genesis-replay:test",

                      evidenceId:
                        "genesis-evidence:test",

                      historicalSourceId:
                        "genesis-source:commit:test",

                      sourceReferenceId:
                        "genesis-source-ref:test",

                      sourceRevisionId:
                        "genesis-source-revision:test",

                      eventId:
                        "genesis-event:test",

                      eventKind:
                        "implementation-committed",

                      sourceChecksum:
                        "sha256:test",

                      reconciledAt:
                        3000,

                      reconciledBy:
                        "human:founder",
                    },
                  },
                },
              ),
            ];
          },
        },

        {
          findByPackageId() {
            runReads +=
              1;

            throw new Error(
              "must_not_read_manufacturing_run",
            );
          },
        },

        {
          consume() {
            consumerCalls +=
              1;

            throw new Error(
              "must_not_consume",
            );
          },
        },
      ).execute();

    assert.equal(
      result.scanned,
      0,
    );

    assert.equal(
      result.recoverable,
      0,
    );

    assert.equal(
      result.recovered,
      0,
    );

    assert.equal(
      result.ignored,
      0,
    );

    assert.equal(
      result.exceptions,
      0,
    );

    assert.equal(
      runReads,
      0,
    );

    assert.equal(
      consumerCalls,
      0,
    );
  },
);


test(
  "awaiting package without manufacturing run becomes exception",
  () => {
    const packageId =
      `PKG-NO-RUN-${suffix}`;

    let consumerCalls =
      0;

    const result =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              knowledgePackage(
                packageId,
              ),
            ];
          },
        },

        {
          findByPackageId() {
            return undefined;
          },
        },

        {
          consume() {
            consumerCalls +=
              1;

            throw new Error(
              "must_not_consume",
            );
          },
        },
      ).execute();

    assert.equal(
      result.exceptions,
      1,
    );

    assert.equal(
      result.recoverable,
      0,
    );

    assert.equal(
      result.packages[0]
        ?.reason,
      "governance_recovery_manufacturing_run_not_found",
    );

    assert.equal(
      consumerCalls,
      0,
    );
  },
);

test(
  "run not durably parked at Canonical Review is ignored",
  () => {
    const packageId =
      `PKG-NOT-PARKED-${suffix}`;

    let consumerCalls =
      0;

    const result =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              knowledgePackage(
                packageId,
              ),
            ];
          },
        },

        {
          findByPackageId() {
            return run(
              packageId,
              {
                currentStage:
                  "Validation",

                stageHistory: [
                  {
                    stage:
                      "Validation",

                    outcome:
                      "entered",

                    at:
                      1000,
                  },
                ],
              },
            );
          },
        },

        {
          consume() {
            consumerCalls +=
              1;

            throw new Error(
              "must_not_consume",
            );
          },
        },
      ).execute();

    assert.equal(
      result.ignored,
      1,
    );

    assert.equal(
      result.recoverable,
      0,
    );

    assert.equal(
      result.packages[0]
        ?.reason,
      "governance_recovery_run_not_parked_at_canonical_review",
    );

    assert.equal(
      consumerCalls,
      0,
    );
  },
);

test(
  "run must contain durable awaiting-human-review history",
  () => {
    const packageId =
      `PKG-NO-AWAITING-EVENT-${suffix}`;

    let consumerCalls =
      0;

    const result =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              knowledgePackage(
                packageId,
              ),
            ];
          },
        },

        {
          findByPackageId() {
            return run(
              packageId,
              {
                stageHistory: [
                  {
                    stage:
                      "Canonical Review",

                    outcome:
                      "entered",

                    at:
                      1000,
                  },
                ],
              },
            );
          },
        },

        {
          consume() {
            consumerCalls +=
              1;

            throw new Error(
              "must_not_consume",
            );
          },
        },
      ).execute();

    assert.equal(
      result.ignored,
      1,
    );

    assert.equal(
      consumerCalls,
      0,
    );
  },
);

test(
  "missing package version fails closed",
  () => {
    const packageId =
      `PKG-NO-VERSION-${suffix}`;

    let runReads =
      0;

    let consumerCalls =
      0;

    const result =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              knowledgePackage(
                packageId,
                {
                  version:
                    null,
                },
              ),
            ];
          },
        },

        {
          findByPackageId() {
            runReads +=
              1;

            return run(
              packageId,
            );
          },
        },

        {
          consume() {
            consumerCalls +=
              1;

            throw new Error(
              "must_not_consume",
            );
          },
        },
      ).execute();

    assert.equal(
      result.exceptions,
      1,
    );

    assert.equal(
      result.packages[0]
        ?.reason,
      "governance_recovery_package_version_missing",
    );

    assert.equal(
      runReads,
      0,
    );

    assert.equal(
      consumerCalls,
      0,
    );
  },
);

test(
  "individual-review and no-policy outcomes remain ignored rather than failures",
  () => {
    const constitutional =
      `PKG-CONSTITUTIONAL-${suffix}`;

    const noPolicy =
      `PKG-NO-POLICY-${suffix}`;

    const result =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              knowledgePackage(
                constitutional,
                {
                  authority:
                    "constitutional",
                },
              ),

              knowledgePackage(
                noPolicy,
              ),
            ];
          },
        },

        {
          findByPackageId(
            packageId,
          ) {
            return run(
              packageId,
            );
          },
        },

        {
          consume(
            signal,
          ) {
            if (
              signal.packageId ===
                constitutional
            ) {
              return {
                signal,

                disposition:
                  "individual_review",

                reason:
                  "constitutional_authority_requires_individual_review",
              };
            }

            return {
              signal,

              disposition:
                "no_policy",

              reason:
                "governance_ready_no_active_policy",
            };
          },
        },
      ).execute();

    assert.equal(
      result.recoverable,
      2,
    );

    assert.equal(
      result.recovered,
      0,
    );

    assert.equal(
      result.ignored,
      2,
    );

    assert.equal(
      result.exceptions,
      0,
    );
  },
);

test(
  "consumer exception does not stop recovery of next package",
  () => {
    const first =
      `PKG-FIRST-${suffix}`;

    const second =
      `PKG-SECOND-${suffix}`;

    const consumed:
      string[] =
        [];

    const result =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              knowledgePackage(
                first,
              ),

              knowledgePackage(
                second,
              ),
            ];
          },
        },

        {
          findByPackageId(
            packageId,
          ) {
            return run(
              packageId,
            );
          },
        },

        {
          consume(
            signal,
          ) {
            consumed.push(
              signal.packageId,
            );

            if (
              signal.packageId ===
                first
            ) {
              return {
                signal,

                disposition:
                  "exception",

                reason:
                  "simulated_governance_failure",
              };
            }

            return executed(
              signal,
            );
          },
        },
      ).execute();

    assert.deepEqual(
      consumed,
      [
        first,
        second,
      ],
    );

    assert.equal(
      result.exceptions,
      1,
    );

    assert.equal(
      result.recovered,
      1,
    );
  },
);

test(
  "second sweep does not reconsider package once first recovery moved it out of awaiting review",
  () => {
    const packageId =
      `PKG-IDEMPOTENT-${suffix}`;

    let state:
      KnowledgePackage =
        knowledgePackage(
          packageId,
        );

    let consumerCalls =
      0;

    const sweep =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              state,
            ];
          },
        },

        {
          findByPackageId() {
            return run(
              packageId,
            );
          },
        },

        {
          consume(
            signal,
          ) {
            consumerCalls +=
              1;

            state = {
              ...state,

              state:
                "canonical",

              approvalState:
                "approved",
            };

            return executed(
              signal,
            );
          },
        },
      );

    const first =
      sweep.execute();

    const second =
      sweep.execute();

    assert.equal(
      first.recovered,
      1,
    );

    assert.equal(
      second.scanned,
      0,
    );

    assert.equal(
      consumerCalls,
      1,
    );
  },
);
