import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
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
  createGenesisReplayPlan,
  createGenesisSourceManifestId,
  executeGenesisReplayNext,
  inspectGenesisReplayStatus,
  resumePersistedGenesisReplay,
  startGenesisReplayExecution,
} from "../index.js";

function isolatedRoot():
  string {
  return mkdtempSync(
    path.join(
      tmpdir(),
      "korelumina-genesis-recovery-certification-",
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
      "recovery-certification",

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
):
  GenesisSourceManifestEntry {
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
):
  GenesisSourceManifestBuildResult {
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
      "recovery-certification",
    ],
  };
}

test(
  "persisted Replay resumes after process interruption without replaying completed prefix",
  async () => {
    const root =
      isolatedRoot();

    const build =
      manifestBuild([
        entry(
          "a",
        ),
        entry(
          "b",
        ),
        entry(
          "c",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        build,
      );

    /*
     * Runtime process A.
     *
     * It creates the Replay and successfully completes exactly
     * one manifest entry before the simulated interruption.
     */
    const processAStore =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          root,
      });

    const processAAdapter =
      new GenesisSyntheticReplayAdmissionAdapter();

    let execution =
      startGenesisReplayExecution({
        plan,

        manifest:
          build.manifest,

        startedAt:
          1000,
      });

    const firstStep =
      await executeGenesisReplayNext({
        execution,

        admissionAdapter:
          processAAdapter,

        occurredAt:
          1100,
      });

    execution =
      firstStep.execution;

    assert.equal(
      execution.state
        .lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      execution.state
        .currentManifestIndex,
      1,
    );

    assert.equal(
      execution.state
        .dispositions.length,
      1,
    );

    assert.equal(
      processAAdapter
        .listRecords()
        .length,
      1,
    );

    processAStore
      .saveManifestBuild(
        build,
      );

    processAStore
      .saveExecution(
        execution,
      );

    /*
     * Simulated process death:
     *
     * processAStore, execution, and processAAdapter are no
     * longer used from this point onward.
     *
     * Runtime process B reconstructs exclusively from persisted
     * state using a fresh store and fresh admission adapter.
     */
    const processBStore =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          root,
      });

    const beforeResume =
      inspectGenesisReplayStatus({
        replayId:
          plan.replayId,

        persistence:
          processBStore,
      });

    assert.equal(
      beforeResume.found,
      true,
    );

    assert.equal(
      beforeResume.executionStatus,
      "running",
    );

    assert.equal(
      beforeResume.currentManifestIndex,
      1,
    );

    assert.equal(
      beforeResume.lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      beforeResume.checkpoint
        ?.lastCompletedManifestIndex,
      0,
    );

    assert.deepEqual(
      beforeResume.recovery,
      {
        eligible:
          true,

        reason:
          "ELIGIBLE",
      },
    );

    const processBAdapter =
      new GenesisSyntheticReplayAdmissionAdapter();

    const resumed =
      await resumePersistedGenesisReplay(
        {
          replayId:
            plan.replayId,

          admissionAdapter:
            processBAdapter,

          executionTimestampForManifestIndex:
            manifestIndex =>
              1200 +
              manifestIndex,
        },
        processBStore,
      );

    assert.equal(
      resumed.outcome,
      "COMPLETED",
    );

    assert.equal(
      resumed.failure,
      null,
    );

    assert.equal(
      resumed.execution
        .state.status,
      "completed",
    );

    assert.equal(
      resumed.execution
        .state.lastCompletedManifestIndex,
      2,
    );

    assert.equal(
      resumed.execution
        .checkpoint
        ?.lastCompletedManifestIndex,
      2,
    );

    /*
     * The fresh process-B adapter saw only b and c.
     *
     * If recovery had replayed completed prefix a, this would
     * contain three admissions rather than two.
     */
    assert.equal(
      processBAdapter
        .listRecords()
        .length,
      2,
    );

    const dispositions =
      resumed.execution
        .state.dispositions;

    assert.equal(
      dispositions.length,
      3,
    );

    assert.deepEqual(
      dispositions.map(
        disposition =>
          disposition
            .historicalSourceId,
      ),
      [
        "genesis-source:commit:a",
        "genesis-source:commit:b",
        "genesis-source:commit:c",
      ],
    );

    assert.equal(
      new Set(
        dispositions.map(
          disposition =>
            disposition
              .historicalSourceId,
        ),
      ).size,
      3,
    );

    const persisted =
      processBStore
        .loadExecution(
          plan.replayId,
        );

    assert.equal(
      persisted?.state.status,
      "completed",
    );

    assert.equal(
      persisted?.state
        .dispositions.length,
      3,
    );

    const afterResume =
      inspectGenesisReplayStatus({
        replayId:
          plan.replayId,

        persistence:
          processBStore,
      });

    assert.equal(
      afterResume.executionStatus,
      "completed",
    );

    assert.equal(
      afterResume.runnerOutcome,
      "COMPLETED",
    );

    assert.deepEqual(
      afterResume.recovery,
      {
        eligible:
          false,

        reason:
          "ALREADY_COMPLETED",
      },
    );
  },
);
