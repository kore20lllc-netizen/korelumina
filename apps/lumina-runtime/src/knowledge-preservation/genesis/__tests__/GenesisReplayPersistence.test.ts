import assert from "node:assert/strict";
import test from "node:test";

import {
  existsSync,
  mkdtempSync,
  readFileSync,
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
  GenesisSyntheticReplayAdmissionAdapter,
  createGenesisReplayId,
  createGenesisReplayPlan,
  createGenesisSourceManifestId,
  executeGenesisReplayNext,
  resumePersistedGenesisReplay,
  startGenesisReplayExecution,
} from "../index.js";

function storageRoot():
  string {
  return mkdtempSync(
    path.join(
      tmpdir(),
      "korelumina-genesis-persistence-",
    ),
  );
}

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

function manifestBuild(
  entries:
    readonly GenesisSourceManifestEntry[],
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

function replayId(
  build:
    GenesisSourceManifestBuildResult,
) {
  return createGenesisReplayId({
    manifestId:
      build.manifest
        .manifestId,

    replayContractVersion:
      build.manifest
        .replayContractVersion,

    scope:
      build.manifest.scope,
  });
}

test(
  "persistence uses deterministic safe replay directory beneath configured Genesis root",
  () => {
    const root =
      storageRoot();

    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          root,
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
      ]);

    const id =
      replayId(
        build,
      );

    const paths =
      store.pathsFor(
        id,
      );

    assert.equal(
      path.dirname(
        paths.replayDirectory,
      ),
      path.resolve(
        root,
      ),
    );

    assert.match(
      path.basename(
        paths.replayDirectory,
      ),
      /^[a-f0-9]{64}$/,
    );
  },
);

test(
  "manifest build persists and loads without identity drift",
  () => {
    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          storageRoot(),
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
      ]);

    const id =
      replayId(
        build,
      );

    store.saveManifestBuild(
      build,
    );

    assert.deepEqual(
      store.loadManifestBuild(
        id,
      ),
      build,
    );
  },
);

test(
  "execution snapshot persists replay state and checkpoint",
  async () => {
    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          storageRoot(),
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
        entry(
          "b",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        build,
      );

    let execution =
      startGenesisReplayExecution({
        plan,

        manifest:
          build.manifest,

        startedAt:
          1000,
      });

    const first =
      await executeGenesisReplayNext({
        execution,

        admissionAdapter:
          new GenesisSyntheticReplayAdmissionAdapter(),

        occurredAt:
          1100,
      });

    execution =
      first.execution;

    store.saveExecution(
      execution,
    );

    const loaded =
      store.loadExecution(
        plan.replayId,
      );

    assert.equal(
      loaded?.state
        .lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      loaded?.checkpoint
        ?.lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      loaded?.state
        .currentManifestIndex,
      1,
    );
  },
);

test(
  "runner result persists independently from execution snapshot",
  () => {
    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          storageRoot(),
      });

    const build =
      manifestBuild([]);

    const plan =
      createGenesisReplayPlan(
        build,
      );

    const execution =
      startGenesisReplayExecution({
        plan,

        manifest:
          build.manifest,

        startedAt:
          1000,
      });

    const result = {
      outcome:
        "COMPLETED" as const,

      execution,

      stepsCompleted:
        0,

      failure:
        null,
    };

    store.saveRunnerResult(
      result,
    );

    assert.deepEqual(
      store.loadRunnerResult(
        plan.replayId,
      ),
      result,
    );
  },
);

test(
  "persistence writes valid complete JSON artifacts",
  () => {
    const root =
      storageRoot();

    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          root,
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
      ]);

    const id =
      replayId(
        build,
      );

    store.saveManifestBuild(
      build,
    );

    const file =
      store.pathsFor(
        id,
      ).manifestBuildFile;

    assert.equal(
      existsSync(
        file,
      ),
      true,
    );

    assert.doesNotThrow(
      () =>
        JSON.parse(
          readFileSync(
            file,
            "utf8",
          ),
        ),
    );
  },
);

test(
  "tampered persisted manifest identity is rejected on load",
  () => {
    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          storageRoot(),
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
      ]);

    const id =
      replayId(
        build,
      );

    store.saveManifestBuild(
      build,
    );

    const file =
      store.pathsFor(
        id,
      ).manifestBuildFile;

    const tampered = {
      ...build,

      manifest: {
        ...build.manifest,

        manifestId:
          "genesis-manifest:tampered",
      },
    };

    writeFileSync(
      file,
      JSON.stringify(
        tampered,
      ),
      "utf8",
    );

    assert.throws(
      () =>
        store.loadManifestBuild(
          id,
        ),
      /genesis_replay_persistence_manifest_build_identity_mismatch/,
    );
  },
);

test(
  "persisted execution resumes from last completed manifest prefix",
  async () => {
    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          storageRoot(),
      });

    const adapter =
      new GenesisSyntheticReplayAdmissionAdapter();

    const build =
      manifestBuild([
        entry(
          "a",
        ),
        entry(
          "b",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        build,
      );

    let execution =
      startGenesisReplayExecution({
        plan,

        manifest:
          build.manifest,

        startedAt:
          1000,
      });

    const first =
      await executeGenesisReplayNext({
        execution,

        admissionAdapter:
          adapter,

        occurredAt:
          1100,
      });

    execution =
      first.execution;

    store.saveManifestBuild(
      build,
    );

    store.saveExecution(
      execution,
    );

    const result =
      await resumePersistedGenesisReplay(
        {
          replayId:
            plan.replayId,

          admissionAdapter:
            adapter,

          executionTimestampForManifestIndex:
            (
              manifestIndex,
            ) =>
              1200 +
              manifestIndex,
        },
        store,
      );

    assert.equal(
      result.outcome,
      "COMPLETED",
    );

    assert.equal(
      result.execution
        .state.status,
      "completed",
    );

    assert.equal(
      result.execution
        .checkpoint
        ?.lastCompletedManifestIndex,
      1,
    );

    assert.equal(
      adapter.listRecords()
        .length,
      2,
    );
  },
);

test(
  "failed resumed admission leaves persisted execution at last valid checkpoint",
  async () => {
    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          storageRoot(),
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        build,
      );

    const execution =
      startGenesisReplayExecution({
        plan,

        manifest:
          build.manifest,

        startedAt:
          1000,
      });

    store.saveExecution(
      execution,
    );

    const result =
      await resumePersistedGenesisReplay(
        {
          replayId:
            plan.replayId,

          admissionAdapter: {
            async admit() {
              throw new Error(
                "fixture persisted admission failure",
              );
            },
          },

          executionTimestampForManifestIndex:
            () =>
              1100,
        },
        store,
      );

    assert.equal(
      result.outcome,
      "FAILED",
    );

    const persisted =
      store.loadExecution(
        plan.replayId,
      );

    assert.equal(
      persisted?.state
        .currentManifestIndex,
      0,
    );

    assert.equal(
      persisted?.state
        .lastCompletedManifestIndex,
      null,
    );

    assert.equal(
      persisted?.checkpoint,
      null,
    );
  },
);

test(
  "Genesis persistence test root never touches production runtime knowledge paths",
  () => {
    const root =
      storageRoot();

    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          root,
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
      ]);

    store.saveManifestBuild(
      build,
    );

    const id =
      replayId(
        build,
      );

    const paths =
      store.pathsFor(
        id,
      );

    assert.equal(
      paths.replayDirectory
        .startsWith(
          path.resolve(
            root,
          ),
        ),
      true,
    );

    assert.equal(
      paths.replayDirectory
        .includes(
          `${path.sep}runtime${path.sep}knowledge${path.sep}`,
        ),
      false,
    );
  },
);

test(
  "corrupted persisted JSON is rejected explicitly and preserved for diagnosis",
  () => {
    const root =
      storageRoot();

    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          root,
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
      ]);

    const id =
      replayId(
        build,
      );

    store.saveManifestBuild(
      build,
    );

    const file =
      store.pathsFor(
        id,
      ).manifestBuildFile;

    const corrupt =
      '{"manifest":{"manifestId":"truncated"';

    writeFileSync(
      file,
      corrupt,
      "utf8",
    );

    assert.throws(
      () =>
        store.loadManifestBuild(
          id,
        ),
      /genesis_replay_persistence_corrupt_json/,
    );

    assert.equal(
      readFileSync(
        file,
        "utf8",
      ),
      corrupt,
    );
  },
);

test(
  "persisted checkpoint is independently revalidated against manifest checksums",
  async () => {
    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          storageRoot(),
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
        entry(
          "b",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        build,
      );

    const started =
      startGenesisReplayExecution({
        plan,

        manifest:
          build.manifest,

        startedAt:
          1000,
      });

    const first =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter:
          new GenesisSyntheticReplayAdmissionAdapter(),

        occurredAt:
          1100,
      });

    store.saveExecution(
      first.execution,
    );

    const file =
      store.pathsFor(
        plan.replayId,
      ).executionFile;

    const persisted =
      JSON.parse(
        readFileSync(
          file,
          "utf8",
        ),
      );

    persisted.checkpoint
      .completedSourceSnapshots[0]
      .sourceChecksum =
        "sha256:tampered";

    writeFileSync(
      file,
      JSON.stringify(
        persisted,
      ),
      "utf8",
    );

    assert.throws(
      () =>
        store.loadExecution(
          plan.replayId,
        ),
      /genesis_replay_checkpoint_source_checksum_mismatch/,
    );
  },
);

test(
  "persisted execution rejects replay state that disagrees with its checkpoint",
  async () => {
    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          storageRoot(),
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
        entry(
          "b",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        build,
      );

    const started =
      startGenesisReplayExecution({
        plan,

        manifest:
          build.manifest,

        startedAt:
          1000,
      });

    const first =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter:
          new GenesisSyntheticReplayAdmissionAdapter(),

        occurredAt:
          1100,
      });

    store.saveExecution(
      first.execution,
    );

    const file =
      store.pathsFor(
        plan.replayId,
      ).executionFile;

    const persisted =
      JSON.parse(
        readFileSync(
          file,
          "utf8",
        ),
      );

    persisted.state
      .lastCompletedManifestIndex =
        null;

    writeFileSync(
      file,
      JSON.stringify(
        persisted,
      ),
      "utf8",
    );

    assert.throws(
      () =>
        store.loadExecution(
          plan.replayId,
        ),
      /genesis_replay_persistence_state_checkpoint_position_mismatch/,
    );
  },
);

test(
  "persisted execution with a completed prefix cannot silently lose its checkpoint",
  async () => {
    const store =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          storageRoot(),
      });

    const build =
      manifestBuild([
        entry(
          "a",
        ),
        entry(
          "b",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        build,
      );

    const started =
      startGenesisReplayExecution({
        plan,

        manifest:
          build.manifest,

        startedAt:
          1000,
      });

    const first =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter:
          new GenesisSyntheticReplayAdmissionAdapter(),

        occurredAt:
          1100,
      });

    store.saveExecution(
      first.execution,
    );

    const file =
      store.pathsFor(
        plan.replayId,
      ).executionFile;

    const persisted =
      JSON.parse(
        readFileSync(
          file,
          "utf8",
        ),
      );

    persisted.checkpoint =
      null;

    writeFileSync(
      file,
      JSON.stringify(
        persisted,
      ),
      "utf8",
    );

    assert.throws(
      () =>
        store.loadExecution(
          plan.replayId,
        ),
      /genesis_replay_persistence_checkpoint_missing_for_completed_prefix/,
    );
  },
);
