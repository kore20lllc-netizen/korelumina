import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceGenesisReplayState,
  createGenesisReplayState,
  failGenesisReplay,
  genesisReplayCanClaimComplete,
  startGenesisReplay,
} from "../index.js";

import type {
  GenesisReplayId,
  GenesisSourceManifest,
  GenesisSourceManifestEntry,
} from "../index.js";

const replayId =
  "genesis-replay:state-fixture" as
    GenesisReplayId;

function entry(
  id:
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
      `sha256:${id}`,

    historicalTimestamp:
      100,

    historicalTimestampSource:
      "fixture",

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
  ids:
    readonly string[] = [
      "a",
      "b",
      "c",
    ],
): GenesisSourceManifest {
  return {
    manifestId:
      "genesis-manifest:state-fixture",

    replayContractVersion:
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
        "1.0",
    },

    entries:
      ids.map(
        entry,
      ),

    discoveredAt:
      2000,
  };
}

test(
  "new replay begins pending and PARTIAL",
  () => {
    const current =
      createGenesisReplayState({
        replayId,

        manifest:
          manifest(),
      });

    assert.equal(
      current.status,
      "pending",
    );

    assert.equal(
      current.corpusStatus,
      "PARTIAL",
    );

    assert.equal(
      current.progress.totalSources,
      3,
    );

    assert.equal(
      current.progress.completedSources,
      0,
    );
  },
);

test(
  "starting replay selects the first deterministic manifest source",
  () => {
    const sourceManifest =
      manifest();

    const started =
      startGenesisReplay(
        createGenesisReplayState({
          replayId,

          manifest:
            sourceManifest,
        }),
        sourceManifest,
        5000,
      );

    assert.equal(
      started.status,
      "running",
    );

    assert.equal(
      started.currentManifestIndex,
      0,
    );

    assert.equal(
      started.currentHistoricalSourceId,
      "genesis-source:commit:a",
    );
  },
);

test(
  "ADMITTED advances exactly one manifest position",
  () => {
    const sourceManifest =
      manifest();

    const started =
      startGenesisReplay(
        createGenesisReplayState({
          replayId,

          manifest:
            sourceManifest,
        }),
        sourceManifest,
        5000,
      );

    const advanced =
      advanceGenesisReplayState({
        state:
          started,

        manifest:
          sourceManifest,

        disposition: {
          historicalSourceId:
            "genesis-source:commit:a",

          disposition:
            "ADMITTED",

          evidenceId:
            "evidence:a",
        },

        occurredAt:
          5100,
      });

    assert.equal(
      advanced.status,
      "running",
    );

    assert.equal(
      advanced.lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      advanced.currentManifestIndex,
      1,
    );

    assert.equal(
      advanced.currentHistoricalSourceId,
      "genesis-source:commit:b",
    );

    assert.equal(
      advanced.progress.admittedSources,
      1,
    );
  },
);

test(
  "SKIPPED is terminal and advances when a reason is retained",
  () => {
    const sourceManifest =
      manifest([
        "a",
        "b",
      ]);

    let state =
      startGenesisReplay(
        createGenesisReplayState({
          replayId,

          manifest:
            sourceManifest,
        }),
        sourceManifest,
        1,
      );

    state =
      advanceGenesisReplayState({
        state,

        manifest:
          sourceManifest,

        disposition: {
          historicalSourceId:
            "genesis-source:commit:a",

          disposition:
            "SKIPPED",

          reason:
            "approved scope exclusion",
        },

        occurredAt:
          2,
      });

    assert.equal(
      state.currentManifestIndex,
      1,
    );

    assert.equal(
      state.progress.skippedSources,
      1,
    );
  },
);

test(
  "BLOCKED halts replay and corpus becomes BLOCKED",
  () => {
    const sourceManifest =
      manifest();

    const started =
      startGenesisReplay(
        createGenesisReplayState({
          replayId,

          manifest:
            sourceManifest,
        }),
        sourceManifest,
        1,
      );

    const blocked =
      advanceGenesisReplayState({
        state:
          started,

        manifest:
          sourceManifest,

        disposition: {
          historicalSourceId:
            "genesis-source:commit:a",

          disposition:
            "BLOCKED",

          reason:
            "provenance incomplete",
        },

        occurredAt:
          2,
      });

    assert.equal(
      blocked.status,
      "blocked",
    );

    assert.equal(
      blocked.corpusStatus,
      "BLOCKED",
    );

    assert.equal(
      blocked.progress.blockedSources,
      1,
    );

    assert.equal(
      genesisReplayCanClaimComplete(
        blocked,
        sourceManifest,
      ),
      false,
    );
  },
);

test(
  "replay cannot process sources out of deterministic order",
  () => {
    const sourceManifest =
      manifest();

    const started =
      startGenesisReplay(
        createGenesisReplayState({
          replayId,

          manifest:
            sourceManifest,
        }),
        sourceManifest,
        1,
      );

    assert.throws(
      () =>
        advanceGenesisReplayState({
          state:
            started,

          manifest:
            sourceManifest,

          disposition: {
            historicalSourceId:
              "genesis-source:commit:b",

            disposition:
              "ADMITTED",

            evidenceId:
              "evidence:b",
          },

          occurredAt:
            2,
        }),
      /genesis_replay_state_out_of_order_disposition/,
    );
  },
);

test(
  "replay cannot complete before every manifest source has a terminal disposition",
  () => {
    const sourceManifest =
      manifest();

    let state =
      startGenesisReplay(
        createGenesisReplayState({
          replayId,

          manifest:
            sourceManifest,
        }),
        sourceManifest,
        1,
      );

    state =
      advanceGenesisReplayState({
        state,

        manifest:
          sourceManifest,

        disposition: {
          historicalSourceId:
            "genesis-source:commit:a",

          disposition:
            "ADMITTED",

          evidenceId:
            "evidence:a",
        },

        occurredAt:
          2,
      });

    assert.equal(
      genesisReplayCanClaimComplete(
        state,
        sourceManifest,
      ),
      false,
    );

    assert.equal(
      state.corpusStatus,
      "PARTIAL",
    );
  },
);

test(
  "final non-blocked disposition completes replay truthfully",
  () => {
    const sourceManifest =
      manifest([
        "a",
        "b",
      ]);

    let state =
      startGenesisReplay(
        createGenesisReplayState({
          replayId,

          manifest:
            sourceManifest,
        }),
        sourceManifest,
        1,
      );

    state =
      advanceGenesisReplayState({
        state,

        manifest:
          sourceManifest,

        disposition: {
          historicalSourceId:
            "genesis-source:commit:a",

          disposition:
            "ADMITTED",

          evidenceId:
            "evidence:a",
        },

        occurredAt:
          2,
      });

    state =
      advanceGenesisReplayState({
        state,

        manifest:
          sourceManifest,

        disposition: {
          historicalSourceId:
            "genesis-source:commit:b",

          disposition:
            "SKIPPED",

          reason:
            "approved exclusion",
        },

        occurredAt:
          3,
      });

    assert.equal(
      state.status,
      "completed",
    );

    assert.equal(
      state.corpusStatus,
      "COMPLETE",
    );

    assert.equal(
      state.progress.completedSources,
      2,
    );

    assert.equal(
      state.progress.blockedSources,
      0,
    );

    assert.equal(
      genesisReplayCanClaimComplete(
        state,
        sourceManifest,
      ),
      true,
    );
  },
);

test(
  "empty approved manifest completes immediately when replay starts",
  () => {
    const sourceManifest =
      manifest(
        [],
      );

    const state =
      startGenesisReplay(
        createGenesisReplayState({
          replayId,

          manifest:
            sourceManifest,
        }),
        sourceManifest,
        100,
      );

    assert.equal(
      state.status,
      "completed",
    );

    assert.equal(
      state.corpusStatus,
      "COMPLETE",
    );

    assert.equal(
      genesisReplayCanClaimComplete(
        state,
        sourceManifest,
      ),
      true,
    );
  },
);

test(
  "failure preserves PARTIAL truth when no source is blocked",
  () => {
    const sourceManifest =
      manifest();

    const started =
      startGenesisReplay(
        createGenesisReplayState({
          replayId,

          manifest:
            sourceManifest,
        }),
        sourceManifest,
        1,
      );

    const failed =
      failGenesisReplay(
        started,
        "evidence admission failed",
        2,
      );

    assert.equal(
      failed.status,
      "failed",
    );

    assert.equal(
      failed.corpusStatus,
      "PARTIAL",
    );

    assert.equal(
      failed.failureReason,
      "evidence admission failed",
    );
  },
);

test(
  "failed or blocked replay cannot claim COMPLETE",
  () => {
    const sourceManifest =
      manifest();

    const started =
      startGenesisReplay(
        createGenesisReplayState({
          replayId,

          manifest:
            sourceManifest,
        }),
        sourceManifest,
        1,
      );

    const failed =
      failGenesisReplay(
        started,
        "failure",
        2,
      );

    assert.equal(
      genesisReplayCanClaimComplete(
        failed,
        sourceManifest,
      ),
      false,
    );
  },
);

test(
  "state rejects a different manifest identity",
  () => {
    const first =
      manifest();

    const state =
      createGenesisReplayState({
        replayId,

        manifest:
          first,
      });

    const second = {
      ...first,

      manifestId:
        "genesis-manifest:different",
    };

    assert.throws(
      () =>
        startGenesisReplay(
          state,
          second,
          1,
        ),
      /genesis_replay_state_manifest_id_mismatch/,
    );
  },
);
