import assert from "node:assert/strict";
import test from "node:test";

import {
  createGenesisReplayCheckpoint,
  nextGenesisReplayManifestIndex,
  validateGenesisReplayResume,
} from "../index.js";

import type {
  GenesisReplayCheckpointDisposition,
  GenesisReplayId,
  GenesisSourceManifest,
  GenesisSourceManifestEntry,
} from "../index.js";

const replayId =
  "genesis-replay:fixture" as
    GenesisReplayId;

function entry(
  id:
    string,

  checksum:
    string,
): GenesisSourceManifestEntry {
  return {
    historicalSourceId:
      `genesis-source:commit:${id}`,

    sourceType:
      "commit",

    evidenceType:
      "commit",

    authorityClass:
      "repository-history",

    provenanceLocator:
      `git:commit:${id}`,

    sourceChecksum:
      checksum,

    historicalTimestamp:
      100,

    historicalTimestampSource:
      "git-committer-time",

    discoveredAt:
      1000,

    discoveryMethod:
      "fixture",

    replayEligibility:
      "eligible",

    supersedes:
      [],

    conflictsWith:
      [],

    metadata:
      {},
  };
}

function manifest(
  overrides: {
    manifestId?:
      string;

    replayContractVersion?:
      string;

    entries?:
      readonly GenesisSourceManifestEntry[];
  } = {},
): GenesisSourceManifest {
  return {
    manifestId:
      overrides.manifestId ??
      "genesis-manifest:fixture",

    replayContractVersion:
      overrides.replayContractVersion ??
      "1.0",

    scope: {
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
        overrides.replayContractVersion ??
        "1.0",
    },

    entries:
      overrides.entries ??
      [
        entry(
          "a",
          "sha256:a",
        ),

        entry(
          "b",
          "sha256:b",
        ),

        entry(
          "c",
          "sha256:c",
        ),
      ],

    discoveredAt:
      2000,
  };
}

function admitted(
  id:
    string,

  evidenceId:
    string,
): GenesisReplayCheckpointDisposition {
  return {
    historicalSourceId:
      `genesis-source:commit:${id}`,

    disposition:
      "ADMITTED",

    evidenceId,
  };
}

test(
  "checkpoint records the last completed manifest position",
  () => {
    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          manifest(),

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          1,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),

          admitted(
            "b",
            "evidence:b",
          ),
        ],

        checkpointCreatedAt:
          5000,
      });

    assert.equal(
      checkpoint
        .lastCompletedManifestIndex,
      1,
    );

    assert.equal(
      checkpoint
        .lastCompletedHistoricalSourceId,
      "genesis-source:commit:b",
    );

    assert.deepEqual(
      checkpoint.admittedEvidenceIds,
      [
        "evidence:a",
        "evidence:b",
      ],
    );

    assert.equal(
      checkpoint.checkpointCreatedAt,
      5000,
    );
  },
);

test(
  "checkpoint supports ADMITTED SKIPPED and BLOCKED terminal dispositions",
  () => {
    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          manifest(),

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          2,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),

          {
            historicalSourceId:
              "genesis-source:commit:b",

            disposition:
              "SKIPPED",

            reason:
              "approved exclusion",
          },

          {
            historicalSourceId:
              "genesis-source:commit:c",

            disposition:
              "BLOCKED",

            reason:
              "provenance incomplete",
          },
        ],
      });

    assert.deepEqual(
      checkpoint.skippedSourceIds,
      [
        "genesis-source:commit:b",
      ],
    );

    assert.deepEqual(
      checkpoint.blockedSourceIds,
      [
        "genesis-source:commit:c",
      ],
    );
  },
);

test(
  "checkpoint does not advance when a prefix source has no terminal disposition",
  () => {
    assert.throws(
      () =>
        createGenesisReplayCheckpoint({
          replayId,

          manifest:
            manifest(),

          replayContractVersion:
            "1.0",

          lastCompletedManifestIndex:
            1,

          dispositions: [
            admitted(
              "a",
              "evidence:a",
            ),
          ],
        }),
      /genesis_replay_checkpoint_prefix_incomplete/,
    );
  },
);

test(
  "checkpoint rejects a disposition beyond the completed manifest position",
  () => {
    assert.throws(
      () =>
        createGenesisReplayCheckpoint({
          replayId,

          manifest:
            manifest(),

          replayContractVersion:
            "1.0",

          lastCompletedManifestIndex:
            0,

          dispositions: [
            admitted(
              "a",
              "evidence:a",
            ),

            admitted(
              "b",
              "evidence:b",
            ),
          ],
        }),
      /genesis_replay_checkpoint_disposition_beyond_checkpoint/,
    );
  },
);

test(
  "ADMITTED disposition requires Evidence identity",
  () => {
    assert.throws(
      () =>
        createGenesisReplayCheckpoint({
          replayId,

          manifest:
            manifest(),

          replayContractVersion:
            "1.0",

          lastCompletedManifestIndex:
            0,

          dispositions: [
            {
              historicalSourceId:
                "genesis-source:commit:a",

              disposition:
                "ADMITTED",
            },
          ],
        }),
      /genesis_replay_checkpoint_admitted_evidence_id_required/,
    );
  },
);

test(
  "SKIPPED disposition requires a reason",
  () => {
    assert.throws(
      () =>
        createGenesisReplayCheckpoint({
          replayId,

          manifest:
            manifest(),

          replayContractVersion:
            "1.0",

          lastCompletedManifestIndex:
            0,

          dispositions: [
            {
              historicalSourceId:
                "genesis-source:commit:a",

              disposition:
                "SKIPPED",
            },
          ],
        }),
      /genesis_replay_checkpoint_skipped_reason_required/,
    );
  },
);

test(
  "BLOCKED disposition requires a reason",
  () => {
    assert.throws(
      () =>
        createGenesisReplayCheckpoint({
          replayId,

          manifest:
            manifest(),

          replayContractVersion:
            "1.0",

          lastCompletedManifestIndex:
            0,

          dispositions: [
            {
              historicalSourceId:
                "genesis-source:commit:a",

              disposition:
                "BLOCKED",
            },
          ],
        }),
      /genesis_replay_checkpoint_blocked_reason_required/,
    );
  },
);

test(
  "duplicate source dispositions are rejected",
  () => {
    assert.throws(
      () =>
        createGenesisReplayCheckpoint({
          replayId,

          manifest:
            manifest(),

          replayContractVersion:
            "1.0",

          lastCompletedManifestIndex:
            0,

          dispositions: [
            admitted(
              "a",
              "evidence:a",
            ),

            admitted(
              "a",
              "evidence:a2",
            ),
          ],
        }),
      /genesis_replay_checkpoint_duplicate_source_disposition/,
    );
  },
);

test(
  "resume succeeds for matching replay manifest and contract",
  () => {
    const currentManifest =
      manifest();

    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          currentManifest,

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          1,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),

          admitted(
            "b",
            "evidence:b",
          ),
        ],
      });

    assert.doesNotThrow(
      () =>
        validateGenesisReplayResume({
          checkpoint,

          replayId,

          manifest:
            currentManifest,

          replayContractVersion:
            "1.0",
        }),
    );
  },
);

test(
  "resume rejects a different replay identity",
  () => {
    const currentManifest =
      manifest();

    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          currentManifest,

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          0,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),
        ],
      });

    assert.throws(
      () =>
        validateGenesisReplayResume({
          checkpoint,

          replayId:
            "genesis-replay:other" as
              GenesisReplayId,

          manifest:
            currentManifest,

          replayContractVersion:
            "1.0",
        }),
      /genesis_replay_checkpoint_replay_id_mismatch/,
    );
  },
);

test(
  "resume rejects a different manifest identity",
  () => {
    const original =
      manifest();

    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          original,

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          0,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),
        ],
      });

    assert.throws(
      () =>
        validateGenesisReplayResume({
          checkpoint,

          replayId,

          manifest:
            manifest({
              manifestId:
                "genesis-manifest:other",
            }),

          replayContractVersion:
            "1.0",
        }),
      /genesis_replay_checkpoint_manifest_id_mismatch/,
    );
  },
);

test(
  "resume rejects replay contract mismatch",
  () => {
    const original =
      manifest();

    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          original,

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          0,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),
        ],
      });

    assert.throws(
      () =>
        validateGenesisReplayResume({
          checkpoint,

          replayId,

          manifest:
            manifest({
              replayContractVersion:
                "2.0",
            }),

          replayContractVersion:
            "2.0",
        }),
      /genesis_replay_checkpoint_contract_version_mismatch/,
    );
  },
);

test(
  "resume rejects changed completed-position identity",
  () => {
    const original =
      manifest();

    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          original,

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          1,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),

          admitted(
            "b",
            "evidence:b",
          ),
        ],
      });

    const changed =
      manifest({
        entries: [
          entry(
            "a",
            "sha256:a",
          ),

          entry(
            "x",
            "sha256:x",
          ),

          entry(
            "c",
            "sha256:c",
          ),
        ],
      });

    assert.throws(
      () =>
        validateGenesisReplayResume({
          checkpoint,

          replayId,

          manifest:
            changed,

          replayContractVersion:
            "1.0",
        }),
      /genesis_replay_checkpoint_prefix_incomplete|genesis_replay_checkpoint_position_mismatch/,
    );
  },
);

test(
  "next manifest index resumes immediately after the completed source",
  () => {
    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          manifest(),

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          1,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),

          admitted(
            "b",
            "evidence:b",
          ),
        ],
      });

    assert.equal(
      nextGenesisReplayManifestIndex(
        checkpoint,
      ),
      2,
    );
  },
);

test(
  "checkpoint retains source identity and checksum through the completed prefix",
  () => {
    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          manifest(),

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          1,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),

          admitted(
            "b",
            "evidence:b",
          ),
        ],
      });

    assert.deepEqual(
      checkpoint.completedSourceSnapshots,
      [
        {
          historicalSourceId:
            "genesis-source:commit:a",

          sourceChecksum:
            "sha256:a",
        },

        {
          historicalSourceId:
            "genesis-source:commit:b",

          sourceChecksum:
            "sha256:b",
        },
      ],
    );
  },
);

test(
  "resume rejects checksum mutation within the completed checkpoint prefix",
  () => {
    const original =
      manifest();

    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          original,

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          1,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),

          admitted(
            "b",
            "evidence:b",
          ),
        ],
      });

    const mutated =
      manifest({
        entries: [
          entry(
            "a",
            "sha256:a",
          ),

          entry(
            "b",
            "sha256:MUTATED",
          ),

          entry(
            "c",
            "sha256:c",
          ),
        ],
      });

    assert.throws(
      () =>
        validateGenesisReplayResume({
          checkpoint,

          replayId,

          manifest:
            mutated,

          replayContractVersion:
            "1.0",
        }),
      /genesis_replay_checkpoint_source_checksum_mismatch/,
    );
  },
);

test(
  "checksum changes after the completed checkpoint position do not invalidate resume",
  () => {
    const original =
      manifest();

    const checkpoint =
      createGenesisReplayCheckpoint({
        replayId,

        manifest:
          original,

        replayContractVersion:
          "1.0",

        lastCompletedManifestIndex:
          1,

        dispositions: [
          admitted(
            "a",
            "evidence:a",
          ),

          admitted(
            "b",
            "evidence:b",
          ),
        ],
      });

    const futureChanged =
      manifest({
        entries: [
          entry(
            "a",
            "sha256:a",
          ),

          entry(
            "b",
            "sha256:b",
          ),

          entry(
            "c",
            "sha256:changed-after-checkpoint",
          ),
        ],
      });

    assert.doesNotThrow(
      () =>
        validateGenesisReplayResume({
          checkpoint,

          replayId,

          manifest:
            futureChanged,

          replayContractVersion:
            "1.0",
        }),
    );
  },
);
