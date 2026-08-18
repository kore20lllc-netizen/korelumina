import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayAdmissionAdapter,
  GenesisReplayPlan,
  GenesisReplayScope,
  GenesisSourceManifest,
  GenesisSourceManifestEntry,
} from "../index.js";

import {
  createGenesisReplayId,
  createGenesisSourceManifestId,
  executeGenesisReplayNext,
  startGenesisReplayExecution,
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

function manifestEntry(
  input: {
    id:
      string;

    checksum:
      string;

    eligibility:
      "eligible" |
      "excluded" |
      "blocked";

    exclusionReason?:
      string;
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
      input.checksum,

    historicalTimestamp:
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

    metadata:
      {},
  };
}

function manifest(
  entries:
    readonly GenesisSourceManifestEntry[],
): GenesisSourceManifest {
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
    manifestId,

    replayContractVersion:
      "1.0",

    scope:
      replayScope,

    entries,

    discoveredAt:
      9000,
  };
}

function plan(
  sourceManifest:
    GenesisSourceManifest,
): GenesisReplayPlan {
  const replayId =
    createGenesisReplayId({
      manifestId:
        sourceManifest.manifestId,

      replayContractVersion:
        sourceManifest
          .replayContractVersion,

      scope:
        sourceManifest.scope,
    });

  const entries =
    sourceManifest.entries.map(
      (
        entry,
        manifestIndex,
      ) => {
        if (
          entry.replayEligibility ===
          "eligible"
        ) {
          return {
            manifestIndex,

            historicalSourceId:
              entry.historicalSourceId,

            sourceChecksum:
              entry.sourceChecksum,

            action:
              "ADMIT" as const,
          };
        }

        if (
          entry.replayEligibility ===
          "excluded"
        ) {
          return {
            manifestIndex,

            historicalSourceId:
              entry.historicalSourceId,

            sourceChecksum:
              entry.sourceChecksum,

            action:
              "SKIP_SCOPE" as const,

            reason:
              entry.exclusionReason ??
              "scope exclusion",
          };
        }

        return {
          manifestIndex,

          historicalSourceId:
            entry.historicalSourceId,

          sourceChecksum:
            entry.sourceChecksum,

          action:
            "BLOCK" as const,

          reason:
            entry.exclusionReason ??
            "blocked",
        };
      },
    );

  const block =
    entries.filter(
      (
        entry,
      ) =>
        entry.action ===
        "BLOCK",
    ).length;

  return {
    replayId,

    manifestId:
      sourceManifest.manifestId,

    replayContractVersion:
      sourceManifest
        .replayContractVersion,

    readiness:
      block >
        0
        ? "BLOCKED"
        : "READY",

    entries,

    summary: {
      totalSources:
        entries.length,

      admit:
        entries.filter(
          (
            entry,
          ) =>
            entry.action ===
            "ADMIT",
        ).length,

      skipScope:
        entries.filter(
          (
            entry,
          ) =>
            entry.action ===
            "SKIP_SCOPE",
        ).length,

      block,
    },
  };
}

function adapter(
  evidenceId =
    "evidence:fixture",
): GenesisReplayAdmissionAdapter {
  return {
    async admit() {
      return {
        evidenceId,
      };
    },
  };
}

test(
  "READY replay plan starts existing replay state deterministically",
  () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),
      ]);

    const execution =
      startGenesisReplayExecution({
        plan:
          plan(
            sourceManifest,
          ),

        manifest:
          sourceManifest,

        startedAt:
          1000,
      });

    assert.equal(
      execution.state.status,
      "running",
    );

    assert.equal(
      execution.state
        .currentManifestIndex,
      0,
    );

    assert.equal(
      execution.checkpoint,
      null,
    );
  },
);

test(
  "BLOCKED replay plan cannot start execution",
  () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "blocked",

          exclusionReason:
            "provenance incomplete",
        }),
      ]);

    assert.throws(
      () =>
        startGenesisReplayExecution({
          plan:
            plan(
              sourceManifest,
            ),

          manifest:
            sourceManifest,

          startedAt:
            1000,
        }),
      /genesis_replay_plan_blocked/,
    );
  },
);

test(
  "execution verifies plan source checksum against manifest before processing",
  () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),
      ]);

    const replayPlan =
      plan(
        sourceManifest,
      );

    const tampered:
      GenesisReplayPlan =
      {
        ...replayPlan,

        entries: [
          {
            ...replayPlan.entries[0],

            sourceChecksum:
              "sha256:tampered",
          },
        ],
      };

    assert.throws(
      () =>
        startGenesisReplayExecution({
          plan:
            tampered,

          manifest:
            sourceManifest,

          startedAt:
            1000,
        }),
      /genesis_replay_execution_source_checksum_mismatch/,
    );
  },
);

test(
  "execution verifies source identity against manifest before processing",
  () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),
      ]);

    const replayPlan =
      plan(
        sourceManifest,
      );

    const tampered:
      GenesisReplayPlan =
      {
        ...replayPlan,

        entries: [
          {
            ...replayPlan.entries[0],

            historicalSourceId:
              "genesis-source:commit:other",
          },
        ],
      };

    assert.throws(
      () =>
        startGenesisReplayExecution({
          plan:
            tampered,

          manifest:
            sourceManifest,

          startedAt:
            1000,
        }),
      /genesis_replay_execution_source_identity_mismatch/,
    );
  },
);

test(
  "ADMIT calls only the admission adapter boundary and records ADMITTED evidence identity",
  async () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),
      ]);

    const calls:
      string[] =
        [];

    const admission:
      GenesisReplayAdmissionAdapter =
      {
        async admit(
          request,
        ) {
          calls.push(
            request
              .planEntry
              .historicalSourceId,
          );

          return {
            evidenceId:
              "evidence:a",
          };
        },
      } as GenesisReplayAdmissionAdapter;

    const started =
      startGenesisReplayExecution({
        plan:
          plan(
            sourceManifest,
          ),

        manifest:
          sourceManifest,

        startedAt:
          1,
      });

    const result =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter:
          admission,

        occurredAt:
          2,
      });

    assert.deepEqual(
      calls,
      [
        "genesis-source:commit:a",
      ],
    );

    assert.equal(
      result.disposition
        ?.disposition,
      "ADMITTED",
    );

    assert.equal(
      result.disposition
        ?.evidenceId,
      "evidence:a",
    );

    assert.equal(
      result.execution
        .state.status,
      "completed",
    );
  },
);

test(
  "ADMIT rejects empty Evidence identity returned by adapter",
  async () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),
      ]);

    const started =
      startGenesisReplayExecution({
        plan:
          plan(
            sourceManifest,
          ),

        manifest:
          sourceManifest,

        startedAt:
          1,
      });

    await assert.rejects(
      () =>
        executeGenesisReplayNext({
          execution:
            started,

          admissionAdapter:
            adapter(
              " ",
            ),

          occurredAt:
            2,
        }),
      /genesis_replay_execution_admission_evidence_id_required/,
    );
  },
);

test(
  "SKIP_SCOPE never invokes admission adapter and becomes terminal SKIPPED",
  async () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "excluded",

          exclusionReason:
            "before_replay_scope",
        }),
      ]);

    let called =
      false;

    const admission:
      GenesisReplayAdmissionAdapter =
      {
        async admit() {
          called =
            true;

          return {
            evidenceId:
              "evidence:unexpected",
          };
        },
      };

    const started =
      startGenesisReplayExecution({
        plan:
          plan(
            sourceManifest,
          ),

        manifest:
          sourceManifest,

        startedAt:
          1,
      });

    const result =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter:
          admission,

        occurredAt:
          2,
      });

    assert.equal(
      called,
      false,
    );

    assert.equal(
      result.disposition
        ?.disposition,
      "SKIPPED",
    );

    assert.equal(
      result.disposition
        ?.reason,
      "before_replay_scope",
    );
  },
);

test(
  "every completed execution step produces checkpoint aligned to replay state",
  async () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),

        manifestEntry({
          id:
            "b",

          checksum:
            "sha256:b",

          eligibility:
            "excluded",

          exclusionReason:
            "explicit_source_exclusion",
        }),
      ]);

    let execution =
      startGenesisReplayExecution({
        plan:
          plan(
            sourceManifest,
          ),

        manifest:
          sourceManifest,

        startedAt:
          1,
      });

    const first =
      await executeGenesisReplayNext({
        execution,

        admissionAdapter:
          adapter(
            "evidence:a",
          ),

        occurredAt:
          2,
      });

    execution =
      first.execution;

    assert.equal(
      execution.checkpoint
        ?.lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      execution.checkpoint
        ?.completedSourceSnapshots[0]
        .sourceChecksum,
      "sha256:a",
    );

    const second =
      await executeGenesisReplayNext({
        execution,

        admissionAdapter:
          adapter(),
        occurredAt:
          3,
      });

    assert.equal(
      second.execution
        .checkpoint
        ?.lastCompletedManifestIndex,
      1,
    );

    assert.equal(
      second.execution
        .state.status,
      "completed",
    );

    assert.equal(
      second.execution
        .state.corpusStatus,
      "COMPLETE",
    );
  },
);

test(
  "execution processes exactly one deterministic manifest position per call",
  async () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),

        manifestEntry({
          id:
            "b",

          checksum:
            "sha256:b",

          eligibility:
            "eligible",
        }),
      ]);

    const started =
      startGenesisReplayExecution({
        plan:
          plan(
            sourceManifest,
          ),

        manifest:
          sourceManifest,

        startedAt:
          1,
      });

    const first =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter:
          adapter(
            "evidence:a",
          ),

        occurredAt:
          2,
      });

    assert.equal(
      first.execution.state
        .lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      first.execution.state
        .currentManifestIndex,
      1,
    );

    assert.equal(
      first.execution.state
        .dispositions.length,
      1,
    );
  },
);

test(
  "completed execution is idempotent and performs no additional admission",
  async () => {
    const sourceManifest =
      manifest([]);

    const started =
      startGenesisReplayExecution({
        plan:
          plan(
            sourceManifest,
          ),

        manifest:
          sourceManifest,

        startedAt:
          1,
      });

    let called =
      false;

    const result =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter: {
          async admit() {
            called =
              true;

            return {
              evidenceId:
                "evidence:unexpected",
            };
          },
        },

        occurredAt:
          2,
      });

    assert.equal(
      called,
      false,
    );

    assert.equal(
      result.disposition,
      null,
    );

    assert.equal(
      result.execution.state
        .status,
      "completed",
    );
  },
);

test(
  "execution rejects a replay identity that no longer matches the manifest contract",
  () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),
      ]);

    const replayPlan =
      plan(
        sourceManifest,
      );

    const tampered:
      GenesisReplayPlan =
      {
        ...replayPlan,

        replayId:
          "genesis-replay:tampered",
      };

    assert.throws(
      () =>
        startGenesisReplayExecution({
          plan:
            tampered,

          manifest:
            sourceManifest,

          startedAt:
            1,
        }),
      /genesis_replay_execution_replay_id_mismatch/,
    );
  },
);

test(
  "execution rejects plan action that contradicts manifest replay eligibility",
  () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),
      ]);

    const replayPlan =
      plan(
        sourceManifest,
      );

    const tampered:
      GenesisReplayPlan =
      {
        ...replayPlan,

        entries: [
          {
            ...replayPlan.entries[0],

            action:
              "SKIP_SCOPE",

            reason:
              "tampered scope",
          },
        ],

        summary: {
          totalSources:
            1,

          admit:
            0,

          skipScope:
            1,

          block:
            0,
        },
      };

    assert.throws(
      () =>
        startGenesisReplayExecution({
          plan:
            tampered,

          manifest:
            sourceManifest,

          startedAt:
            1,
        }),
      /genesis_replay_execution_plan_action_mismatch/,
    );
  },
);

test(
  "admission adapter failure leaves replay state and checkpoint unchanged",
  async () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),
      ]);

    const started =
      startGenesisReplayExecution({
        plan:
          plan(
            sourceManifest,
          ),

        manifest:
          sourceManifest,

        startedAt:
          1,
      });

    const stateBefore =
      started.state;

    const checkpointBefore =
      started.checkpoint;

    const dispositionsBefore =
      started.state.dispositions;

    await assert.rejects(
      () =>
        executeGenesisReplayNext({
          execution:
            started,

          admissionAdapter: {
            async admit() {
              throw new Error(
                "fixture admission failure",
              );
            },
          },

          occurredAt:
            2,
        }),
      /fixture admission failure/,
    );

    assert.equal(
      started.state,
      stateBefore,
    );

    assert.equal(
      started.checkpoint,
      checkpointBefore,
    );

    assert.equal(
      started.state.dispositions,
      dispositionsBefore,
    );

    assert.equal(
      started.state.status,
      "running",
    );

    assert.equal(
      started.state
        .currentManifestIndex,
      0,
    );

    assert.equal(
      started.state
        .lastCompletedManifestIndex,
      null,
    );

    assert.equal(
      started.state
        .dispositions.length,
      0,
    );

    assert.equal(
      started.checkpoint,
      null,
    );
  },
);

test(
  "admission failure after an earlier completed step preserves the last valid checkpoint exactly",
  async () => {
    const sourceManifest =
      manifest([
        manifestEntry({
          id:
            "a",

          checksum:
            "sha256:a",

          eligibility:
            "eligible",
        }),

        manifestEntry({
          id:
            "b",

          checksum:
            "sha256:b",

          eligibility:
            "eligible",
        }),
      ]);

    const started =
      startGenesisReplayExecution({
        plan:
          plan(
            sourceManifest,
          ),

        manifest:
          sourceManifest,

        startedAt:
          1,
      });

    const first =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter:
          adapter(
            "evidence:a",
          ),

        occurredAt:
          2,
      });

    const executionBeforeFailure =
      first.execution;

    const stateBefore =
      executionBeforeFailure.state;

    const checkpointBefore =
      executionBeforeFailure.checkpoint;

    assert.ok(
      checkpointBefore,
    );

    assert.equal(
      checkpointBefore
        .lastCompletedManifestIndex,
      0,
    );

    await assert.rejects(
      () =>
        executeGenesisReplayNext({
          execution:
            executionBeforeFailure,

          admissionAdapter: {
            async admit() {
              throw new Error(
                "second admission failed",
              );
            },
          },

          occurredAt:
            3,
        }),
      /second admission failed/,
    );

    assert.equal(
      executionBeforeFailure.state,
      stateBefore,
    );

    assert.equal(
      executionBeforeFailure.checkpoint,
      checkpointBefore,
    );

    assert.equal(
      executionBeforeFailure
        .state
        .lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      executionBeforeFailure
        .state
        .currentManifestIndex,
      1,
    );

    assert.equal(
      executionBeforeFailure
        .state
        .dispositions.length,
      1,
    );

    assert.equal(
      executionBeforeFailure
        .checkpoint
        ?.lastCompletedManifestIndex,
      0,
    );

    assert.deepEqual(
      executionBeforeFailure
        .checkpoint
        ?.admittedEvidenceIds,
      [
        "evidence:a",
      ],
    );
  },
);
