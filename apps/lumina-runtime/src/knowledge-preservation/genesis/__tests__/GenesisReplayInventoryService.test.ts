import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import type {
  GenesisReplayScope,
  GenesisSourceManifestBuildResult,
  GenesisSourceManifestEntry,
} from "../index.js";

import {
  FileGenesisReplayPersistenceStore,
  createGenesisReplayPlan,
  createGenesisSourceManifestId,
  listGenesisReplayInventory,
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
      9000,

    discoveryMethod:
      "fixture",

    replayEligibility:
      "eligible",

    supersedes:
      [],

    conflictsWith:
      [],

    metadata: {
      subject:
        id,
    },
  };
}

function build(
  id:
    string,
): GenesisSourceManifestBuildResult {
  const replayScope =
    scope();

  const entries = [
    entry(
      id,
    ),
  ];

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
        replayScope
          .replayContractVersion,

      scope:
        replayScope,

      entries,

      discoveredAt:
        9000,
    },

    readiness:
      "READY",

    errors:
      [],

    observations:
      [],

    discovererIds: [
      "fixture",
    ],
  };
}

function store() {
  return new FileGenesisReplayPersistenceStore({
    storageRoot:
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-genesis-inventory-",
        ),
      ),
  });
}

function persistReplay(
  persistence:
    FileGenesisReplayPersistenceStore,

  id:
    string,
) {
  const manifestBuild =
    build(
      id,
    );

  const plan =
    createGenesisReplayPlan(
      manifestBuild,
    );

  const execution =
    startGenesisReplayExecution({
      plan,

      manifest:
        manifestBuild.manifest,

      startedAt:
        1000,
    });

  persistence.saveManifestBuild(
    manifestBuild,
  );

  persistence.saveExecution(
    execution,
  );

  return {
    manifestBuild,
    plan,
    execution,
  };
}

test(
  "empty persistence root produces empty replay inventory",
  () => {
    const persistence =
      store();

    assert.deepEqual(
      listGenesisReplayInventory({
        persistence,
      }),
      {
        total:
          0,

        replayIds:
          [],

        replays:
          [],
      },
    );
  },
);

test(
  "inventory enumerates persisted Replay Identities and delegates status projection",
  () => {
    const persistence =
      store();

    const first =
      persistReplay(
        persistence,
        "inventory-a",
      );

    const second =
      persistReplay(
        persistence,
        "inventory-b",
      );

    const inventory =
      listGenesisReplayInventory({
        persistence,
      });

    assert.equal(
      inventory.total,
      2,
    );

    assert.deepEqual(
      inventory.replayIds,
      [
        first.plan.replayId,
        second.plan.replayId,
      ].sort(),
    );

    assert.equal(
      inventory.replays.every(
        (
          replay,
        ) =>
          replay.found &&
          replay.executionPresent &&
          replay.manifestPresent,
      ),
      true,
    );
  },
);

test(
  "inventory is read only and does not create new replay artifacts",
  () => {
    const persistence =
      store();

    persistReplay(
      persistence,
      "read-only",
    );

    persistence.saveManifestBuild =
      () => {
        throw new Error(
          "inventory attempted manifest write",
        );
      };

    persistence.saveExecution =
      () => {
        throw new Error(
          "inventory attempted execution write",
        );
      };

    persistence.saveRunnerResult =
      () => {
        throw new Error(
          "inventory attempted runner-result write",
        );
      };

    assert.doesNotThrow(
      () =>
        listGenesisReplayInventory({
          persistence,
        }),
    );
  },
);

test(
  "Knowledge Manufacturing Runs cannot invent Genesis replay inventory entries",
  () => {
    const persistence =
      store();

    const inventory =
      listGenesisReplayInventory({
        persistence,

        manufacturingRuns: {
          list() {
            return [
              {
                id:
                  "knowledge-run:orphan",

                evidenceId:
                  "genesis-evidence:orphan",

                currentStage:
                  "Canonical Review",

                status:
                  "active",

                canonicalKnowledgeIds:
                  [],

                stageHistory:
                  [],

                createdAt:
                  1000,

                updatedAt:
                  1000,
              },
            ];
          },
        },
      });

    assert.equal(
      inventory.total,
      0,
    );
  },
);

test(
  "inventory detects replay-directory identity mismatch",
  () => {
    const persistence =
      store();

    const replay =
      persistReplay(
        persistence,
        "directory-mismatch-source",
      );

    const sourceDirectory =
      persistence.pathsFor(
        replay.plan.replayId,
      ).replayDirectory;

    const badDirectory =
      path.join(
        persistence.storageRoot,
        "0".repeat(
          64,
        ),
      );

    mkdirSync(
      badDirectory,
      {
        recursive:
          true,
      },
    );

    const execution =
      persistence.loadExecution(
        replay.plan.replayId,
      );

    assert.ok(
      execution,
    );

    writeFileSync(
      path.join(
        badDirectory,
        "execution.json",
      ),
      `${JSON.stringify(
        execution,
        null,
        2,
      )}\n`,
      "utf8",
    );

    assert.notEqual(
      badDirectory,
      sourceDirectory,
    );

    assert.throws(
      () =>
        listGenesisReplayInventory({
          persistence,
        }),
      /genesis_replay_inventory_directory_identity_mismatch/,
    );
  },
);

test(
  "inventory fails closed on corrupt persisted JSON",
  () => {
    const persistence =
      store();

    const corruptDirectory =
      path.join(
        persistence.storageRoot,
        "a".repeat(
          64,
        ),
      );

    mkdirSync(
      corruptDirectory,
      {
        recursive:
          true,
      },
    );

    writeFileSync(
      path.join(
        corruptDirectory,
        "execution.json",
      ),
      '{"plan":',
      "utf8",
    );

    assert.throws(
      () =>
        listGenesisReplayInventory({
          persistence,
        }),
      /genesis_replay_inventory_corrupt_json/,
    );
  },
);

test(
  "manifest-only replay is enumerated through deterministic manifest-derived Replay Identity",
  () => {
    const persistence =
      store();

    const manifestBuild =
      build(
        "manifest-only",
      );

    const plan =
      createGenesisReplayPlan(
        manifestBuild,
      );

    persistence.saveManifestBuild(
      manifestBuild,
    );

    const inventory =
      listGenesisReplayInventory({
        persistence,
      });

    assert.equal(
      inventory.total,
      1,
    );

    assert.deepEqual(
      inventory.replayIds,
      [
        plan.replayId,
      ],
    );

    assert.equal(
      inventory.replays[0]
        .replayId,
      plan.replayId,
    );

    assert.equal(
      inventory.replays[0]
        .manifestPresent,
      true,
    );

    assert.equal(
      inventory.replays[0]
        .executionPresent,
      false,
    );

    assert.deepEqual(
      inventory.replays[0]
        .recovery,
      {
        eligible:
          false,

        reason:
          "EXECUTION_NOT_FOUND",
      },
    );
  },
);

test(
  "manifest-derived and execution-declared Replay Identities must agree",
  () => {
    const persistence =
      store();

    const first =
      persistReplay(
        persistence,
        "identity-source-a",
      );

    const secondBuild =
      build(
        "identity-source-b",
      );

    const secondPlan =
      createGenesisReplayPlan(
        secondBuild,
      );

    assert.notEqual(
      first.plan.replayId,
      secondPlan.replayId,
    );

    const executionFile =
      persistence.pathsFor(
        first.plan.replayId,
      ).executionFile;

    const execution =
      persistence.loadExecution(
        first.plan.replayId,
      );

    assert.ok(
      execution,
    );

    writeFileSync(
      executionFile,
      `${JSON.stringify(
        {
          ...execution,

          plan: {
            ...execution.plan,

            replayId:
              secondPlan.replayId,
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    assert.throws(
      () =>
        listGenesisReplayInventory({
          persistence,
        }),
      /genesis_replay_inventory_identity_ambiguity/,
    );
  },
);
