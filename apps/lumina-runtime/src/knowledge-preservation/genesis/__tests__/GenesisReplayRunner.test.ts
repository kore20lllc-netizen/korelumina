import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayAdmissionAdapter,
  GenesisReplayScope,
  GenesisSourceManifestBuildResult,
  GenesisSourceManifestEntry,
} from "../index.js";

import {
  GenesisSyntheticReplayAdmissionAdapter,
  createGenesisSourceManifestId,
  runGenesisReplay,
} from "../index.js";

function scope():
  GenesisReplayScope {
  return {
    mode:
      "partial",

    repository:
      "kore20lllc-netizen/korelumina",

    ref:
      "main",

    includedEvidenceTypes: [
      "commit",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],

    governancePolicyVersion:
      "governance-v1",

    replayContractVersion:
      "1.0",
  };
}

function entry(
  input: {
    id:
      string;

    eligibility:
      "eligible" |
      "excluded" |
      "blocked";

    checksum?:
      string;

    exclusionReason?:
      string;

    timestamp?:
      number;
  },
): GenesisSourceManifestEntry {
  return {
    historicalSourceId:
      `genesis-source:commit:${input.id}`,

    sourceType:
      "commit",

    evidenceType:
      "commit",

    authorityClass:
      "repository-history",

    provenanceLocator:
      `git:commit:${input.id}`,

    sourceChecksum:
      input.checksum ??
      `sha256:${input.id}`,

    historicalTimestamp:
      input.timestamp ??
      100,

    historicalTimestampSource:
      "fixture",

    discoveredAt:
      9000,

    discoveryMethod:
      "fixture",

    replayEligibility:
      input.eligibility,

    exclusionReason:
      input.exclusionReason,

    supersedes:
      [],

    conflictsWith:
      [],

    metadata: {
      subject:
        `commit ${input.id}`,
    },
  };
}

function build(
  entries:
    readonly GenesisSourceManifestEntry[],
  readiness:
    "READY" |
    "BLOCKED" =
      "READY",
): GenesisSourceManifestBuildResult {
  const replayScope =
    scope();

  const manifestId =
    createGenesisSourceManifestId({
      replayContractVersion:
        replayScope
          .replayContractVersion,

      scope:
        replayScope,

      entries,
    });

  return {
    manifest: {
      manifestId,

      replayContractVersion:
        "1.0",

      scope:
        replayScope,

      entries,

      discoveredAt:
        9000,
    },

    readiness,

    errors:
      readiness ===
      "READY"
        ? []
        : [
            {
              code:
                "DISCOVERY_FAILED",

              discovererId:
                "fixture",

              message:
                "fixture discovery failure",
            },
          ],

    observations:
      [],

    discovererIds: [
      "fixture",
    ],
  };
}

function timestamps(
  base =
    1000,
) {
  return (
    manifestIndex:
      number,
  ) =>
    base +
    manifestIndex;
}

test(
  "runner executes complete READY replay deterministically",
  async () => {
    const adapter =
      new GenesisSyntheticReplayAdmissionAdapter();

    const result =
      await runGenesisReplay({
        manifestBuild:
          build([
            entry({
              id:
                "a",

              eligibility:
                "eligible",
            }),

            entry({
              id:
                "b",

              eligibility:
                "eligible",
            }),
          ]),

        admissionAdapter:
          adapter,

        startedAt:
          900,

        executionTimestampForManifestIndex:
          timestamps(),
      });

    assert.equal(
      result.outcome,
      "COMPLETED",
    );

    assert.equal(
      result.failure,
      null,
    );

    assert.equal(
      result.stepsCompleted,
      2,
    );

    assert.equal(
      result.execution
        .state.status,
      "completed",
    );

    assert.equal(
      result.execution
        .state.corpusStatus,
      "COMPLETE",
    );

    assert.equal(
      adapter.listRecords()
        .length,
      2,
    );
  },
);

test(
  "runner executes SKIP_SCOPE without invoking admission adapter",
  async () => {
    let admissions =
      0;

    const adapter:
      GenesisReplayAdmissionAdapter =
      {
        async admit() {
          admissions +=
            1;

          return {
            evidenceId:
              "evidence:unexpected",
          };
        },
      };

    const result =
      await runGenesisReplay({
        manifestBuild:
          build([
            entry({
              id:
                "excluded",

              eligibility:
                "excluded",

              exclusionReason:
                "before_replay_scope",
            }),
          ]),

        admissionAdapter:
          adapter,

        startedAt:
          900,

        executionTimestampForManifestIndex:
          timestamps(),
      });

    assert.equal(
      admissions,
      0,
    );

    assert.equal(
      result.outcome,
      "COMPLETED",
    );

    assert.equal(
      result.execution
        .state
        .dispositions[0]
        .disposition,
      "SKIPPED",
    );

    assert.equal(
      result.execution
        .state
        .dispositions[0]
        .reason,
      "before_replay_scope",
    );
  },
);

test(
  "runner refuses BLOCKED manifest build before execution starts",
  async () => {
    await assert.rejects(
      () =>
        runGenesisReplay({
          manifestBuild:
            build(
              [
                entry({
                  id:
                    "a",

                  eligibility:
                    "eligible",
                }),
              ],
              "BLOCKED",
            ),

          admissionAdapter:
            new GenesisSyntheticReplayAdmissionAdapter(),

          startedAt:
            900,

          executionTimestampForManifestIndex:
            timestamps(),
        }),
      /genesis_source_manifest_discovery_incomplete/,
    );
  },
);

test(
  "runner refuses replay plan containing BLOCK source before execution",
  async () => {
    await assert.rejects(
      () =>
        runGenesisReplay({
          manifestBuild:
            build([
              entry({
                id:
                  "blocked",

                eligibility:
                  "blocked",

                exclusionReason:
                  "historical_timestamp_unavailable",
              }),
            ]),

          admissionAdapter:
            new GenesisSyntheticReplayAdmissionAdapter(),

          startedAt:
            900,

          executionTimestampForManifestIndex:
            timestamps(),
        }),
      /genesis_replay_plan_blocked/,
    );
  },
);

test(
  "runner stops on first admission failure and preserves last valid execution boundary",
  async () => {
    let calls =
      0;

    const adapter:
      GenesisReplayAdmissionAdapter =
      {
        async admit() {
          calls +=
            1;

          if (
            calls ===
            2
          ) {
            throw new Error(
              "second admission failed",
            );
          }

          return {
            evidenceId:
              "evidence:first",
          };
        },
      };

    const result =
      await runGenesisReplay({
        manifestBuild:
          build([
            entry({
              id:
                "a",

              eligibility:
                "eligible",
            }),

            entry({
              id:
                "b",

              eligibility:
                "eligible",
            }),

            entry({
              id:
                "c",

              eligibility:
                "eligible",
            }),
          ]),

        admissionAdapter:
          adapter,

        startedAt:
          900,

        executionTimestampForManifestIndex:
          timestamps(),
      });

    assert.equal(
      result.outcome,
      "FAILED",
    );

    assert.equal(
      result.stepsCompleted,
      1,
    );

    assert.equal(
      calls,
      2,
    );

    assert.equal(
      result.failure
        ?.manifestIndex,
      1,
    );

    assert.equal(
      result.failure
        ?.historicalSourceId,
      "genesis-source:commit:b",
    );

    assert.equal(
      result.failure
        ?.message,
      "second admission failed",
    );

    assert.equal(
      result.execution
        .state.status,
      "running",
    );

    assert.equal(
      result.execution
        .state
        .lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      result.execution
        .state
        .currentManifestIndex,
      1,
    );

    assert.equal(
      result.execution
        .state
        .dispositions.length,
      1,
    );

    assert.equal(
      result.execution
        .checkpoint
        ?.lastCompletedManifestIndex,
      0,
    );
  },
);

test(
  "runner never attempts sources after the first failed manifest position",
  async () => {
    const attempted:
      number[] =
        [];

    const adapter:
      GenesisReplayAdmissionAdapter =
      {
        async admit(
          request,
        ) {
          attempted.push(
            request.manifestIndex,
          );

          if (
            request.manifestIndex ===
            1
          ) {
            throw new Error(
              "stop here",
            );
          }

          return {
            evidenceId:
              `evidence:${request.manifestIndex}`,
          };
        },
      };

    const result =
      await runGenesisReplay({
        manifestBuild:
          build([
            entry({
              id:
                "a",

              eligibility:
                "eligible",
            }),

            entry({
              id:
                "b",

              eligibility:
                "eligible",
            }),

            entry({
              id:
                "c",

              eligibility:
                "eligible",
            }),
          ]),

        admissionAdapter:
          adapter,

        startedAt:
          900,

        executionTimestampForManifestIndex:
          timestamps(),
      });

    assert.equal(
      result.outcome,
      "FAILED",
    );

    assert.deepEqual(
      attempted,
      [
        0,
        1,
      ],
    );
  },
);

test(
  "empty READY manifest completes with zero steps and no checkpoint",
  async () => {
    const result =
      await runGenesisReplay({
        manifestBuild:
          build(
            [],
          ),

        admissionAdapter:
          new GenesisSyntheticReplayAdmissionAdapter(),

        startedAt:
          900,

        executionTimestampForManifestIndex:
          timestamps(),
      });

    assert.equal(
      result.outcome,
      "COMPLETED",
    );

    assert.equal(
      result.stepsCompleted,
      0,
    );

    assert.equal(
      result.execution
        .state.status,
      "completed",
    );

    assert.equal(
      result.execution
        .checkpoint,
      null,
    );
  },
);

test(
  "runner requires deterministic valid execution timestamps",
  async () => {
    const result =
      await runGenesisReplay({
        manifestBuild:
          build([
            entry({
              id:
                "a",

              eligibility:
                "eligible",
            }),
          ]),

        admissionAdapter:
          new GenesisSyntheticReplayAdmissionAdapter(),

        startedAt:
          900,

        executionTimestampForManifestIndex:
          () =>
            Number.NaN,
      });

    assert.equal(
      result.outcome,
      "FAILED",
    );

    assert.equal(
      result.stepsCompleted,
      0,
    );

    assert.equal(
      result.failure
        ?.message,
      "genesis_replay_runner_execution_timestamp_invalid",
    );

    assert.equal(
      result.execution
        .checkpoint,
      null,
    );
  },
);

test(
  "restarting from the beginning after failure reuses already-admitted prefix Evidence",
  async () => {
    const syntheticAdapter =
      new GenesisSyntheticReplayAdmissionAdapter();

    const sourceManifestBuild =
      build([
        entry({
          id:
            "a",

          eligibility:
            "eligible",
        }),

        entry({
          id:
            "b",

          eligibility:
            "eligible",
        }),
      ]);

    const failingAdapter:
      GenesisReplayAdmissionAdapter =
      {
        async admit(
          request,
        ) {
          if (
            request.manifestIndex ===
            1
          ) {
            throw new Error(
              "fixture second-source failure",
            );
          }

          return syntheticAdapter.admit(
            request,
          );
        },
      };

    const firstRun =
      await runGenesisReplay({
        manifestBuild:
          sourceManifestBuild,

        admissionAdapter:
          failingAdapter,

        startedAt:
          900,

        executionTimestampForManifestIndex:
          timestamps(),
      });

    assert.equal(
      firstRun.outcome,
      "FAILED",
    );

    assert.equal(
      firstRun.stepsCompleted,
      1,
    );

    assert.equal(
      syntheticAdapter
        .listRecords()
        .length,
      1,
    );

    const firstEvidenceId =
      syntheticAdapter
        .listRecords()[0]
        .evidence.id;

    const firstOccurrenceCount =
      syntheticAdapter
        .listRecords()[0]
        .occurrences.length;

    const retryRun =
      await runGenesisReplay({
        manifestBuild:
          sourceManifestBuild,

        admissionAdapter:
          syntheticAdapter,

        startedAt:
          1900,

        executionTimestampForManifestIndex:
          (
            manifestIndex,
          ) =>
            2000 +
            manifestIndex,
      });

    assert.equal(
      retryRun.outcome,
      "COMPLETED",
    );

    assert.equal(
      retryRun.stepsCompleted,
      2,
    );

    assert.equal(
      retryRun.execution
        .state.status,
      "completed",
    );

    assert.equal(
      retryRun.execution
        .state.corpusStatus,
      "COMPLETE",
    );

    const records =
      syntheticAdapter
        .listRecords();

    assert.equal(
      records.length,
      2,
    );

    const prefixRecord =
      records.find(
        (
          record,
        ) =>
          record.evidence
            .metadata
            .historicalSourceId ===
          "genesis-source:commit:a",
      );

    assert.ok(
      prefixRecord,
    );

    assert.equal(
      prefixRecord
        .evidence.id,
      firstEvidenceId,
    );

    assert.equal(
      prefixRecord
        .occurrences.length,
      firstOccurrenceCount,
    );

    assert.deepEqual(
      retryRun.execution
        .checkpoint
        ?.admittedEvidenceIds,
      [
        firstEvidenceId,
        records.find(
          (
            record,
          ) =>
            record.evidence
              .metadata
              .historicalSourceId ===
            "genesis-source:commit:b",
        )?.evidence.id,
      ],
    );
  },
);

test(
  "restarting from the beginning after failure reuses already-admitted prefix Evidence",
  async () => {
    const syntheticAdapter =
      new GenesisSyntheticReplayAdmissionAdapter();

    const sourceManifestBuild =
      build([
        entry({
          id:
            "a",

          eligibility:
            "eligible",
        }),

        entry({
          id:
            "b",

          eligibility:
            "eligible",
        }),
      ]);

    const failingAdapter:
      GenesisReplayAdmissionAdapter =
      {
        async admit(
          request,
        ) {
          if (
            request.manifestIndex ===
            1
          ) {
            throw new Error(
              "fixture second-source failure",
            );
          }

          return syntheticAdapter.admit(
            request,
          );
        },
      };

    const firstRun =
      await runGenesisReplay({
        manifestBuild:
          sourceManifestBuild,

        admissionAdapter:
          failingAdapter,

        startedAt:
          900,

        executionTimestampForManifestIndex:
          timestamps(),
      });

    assert.equal(
      firstRun.outcome,
      "FAILED",
    );

    assert.equal(
      firstRun.stepsCompleted,
      1,
    );

    assert.equal(
      syntheticAdapter
        .listRecords()
        .length,
      1,
    );

    const firstEvidenceId =
      syntheticAdapter
        .listRecords()[0]
        .evidence.id;

    const firstOccurrenceCount =
      syntheticAdapter
        .listRecords()[0]
        .occurrences.length;

    const retryRun =
      await runGenesisReplay({
        manifestBuild:
          sourceManifestBuild,

        admissionAdapter:
          syntheticAdapter,

        startedAt:
          1900,

        executionTimestampForManifestIndex:
          (
            manifestIndex,
          ) =>
            2000 +
            manifestIndex,
      });

    assert.equal(
      retryRun.outcome,
      "COMPLETED",
    );

    assert.equal(
      retryRun.stepsCompleted,
      2,
    );

    assert.equal(
      retryRun.execution
        .state.status,
      "completed",
    );

    assert.equal(
      retryRun.execution
        .state.corpusStatus,
      "COMPLETE",
    );

    const records =
      syntheticAdapter
        .listRecords();

    assert.equal(
      records.length,
      2,
    );

    const prefixRecord =
      records.find(
        (
          record,
        ) =>
          record.evidence
            .metadata
            .historicalSourceId ===
          "genesis-source:commit:a",
      );

    assert.ok(
      prefixRecord,
    );

    assert.equal(
      prefixRecord
        .evidence.id,
      firstEvidenceId,
    );

    assert.equal(
      prefixRecord
        .occurrences.length,
      firstOccurrenceCount,
    );

    assert.deepEqual(
      retryRun.execution
        .checkpoint
        ?.admittedEvidenceIds,
      [
        firstEvidenceId,
        records.find(
          (
            record,
          ) =>
            record.evidence
              .metadata
              .historicalSourceId ===
            "genesis-source:commit:b",
        )?.evidence.id,
      ],
    );
  },
);
