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

function store() {
  return new FileGenesisReplayPersistenceStore({
    storageRoot:
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-genesis-status-",
        ),
      ),
  });
}

test(
  "unknown Replay Identity reports not found without creating artifacts",
  () => {
    const persistence =
      store();

    const result =
      inspectGenesisReplayStatus({
        replayId:
          "genesis-replay:missing" as const,

        persistence,
      });

    assert.equal(
      result.found,
      false,
    );

    assert.equal(
      result.manifestPresent,
      false,
    );

    assert.equal(
      result.executionPresent,
      false,
    );

    assert.equal(
      result.runnerOutcome,
      null,
    );

    assert.deepEqual(
      result.recovery,
      {
        eligible:
          false,

        reason:
          "REPLAY_NOT_FOUND",
      },
    );
  },
);

test(
  "manifest-only persistence reports readiness but is not recoverable",
  () => {
    const persistence =
      store();

    const manifestBuild =
      build([
        entry(
          "manifest-only",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        manifestBuild,
      );

    persistence.saveManifestBuild(
      manifestBuild,
    );

    const result =
      inspectGenesisReplayStatus({
        replayId:
          plan.replayId,

        persistence,
      });

    assert.equal(
      result.found,
      true,
    );

    assert.equal(
      result.manifestPresent,
      true,
    );

    assert.equal(
      result.executionPresent,
      false,
    );

    assert.equal(
      result.manifestReadiness,
      "READY",
    );

    assert.equal(
      result.totalManifestSources,
      1,
    );

    assert.equal(
      result.recovery.reason,
      "EXECUTION_NOT_FOUND",
    );
  },
);

test(
  "running replay reports persisted current position progress and checkpoint",
  async () => {
    const persistence =
      store();

    const manifestBuild =
      build([
        entry(
          "a",
        ),
        entry(
          "b",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        manifestBuild,
      );

    const started =
      startGenesisReplayExecution({
        plan,

        manifest:
          manifestBuild.manifest,

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

    persistence.saveManifestBuild(
      manifestBuild,
    );

    persistence.saveExecution(
      first.execution,
    );

    const result =
      inspectGenesisReplayStatus({
        replayId:
          plan.replayId,

        persistence,
      });

    assert.equal(
      result.executionStatus,
      "running",
    );

    assert.equal(
      result.currentManifestIndex,
      1,
    );

    assert.equal(
      result.lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      result.progress
        ?.completedSources,
      1,
    );

    assert.equal(
      result.checkpoint
        ?.lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      result.recovery.eligible,
      true,
    );
  },
);

test(
  "completed replay reports persisted runner outcome and is not recovery eligible",
  () => {
    const persistence =
      store();

    const manifestBuild =
      build([]);

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

    persistence.saveRunnerResult({
      outcome:
        "COMPLETED",

      execution,

      stepsCompleted:
        0,

      failure:
        null,
    });

    const result =
      inspectGenesisReplayStatus({
        replayId:
          plan.replayId,

        persistence,
      });

    assert.equal(
      result.executionStatus,
      "completed",
    );

    assert.equal(
      result.corpusStatus,
      "COMPLETE",
    );

    assert.equal(
      result.runnerOutcome,
      "COMPLETED",
    );

    assert.equal(
      result.recovery.eligible,
      false,
    );

    assert.equal(
      result.recovery.reason,
      "ALREADY_COMPLETED",
    );
  },
);

test(
  "status links admitted Evidence to existing Knowledge Manufacturing Run",
  async () => {
    const persistence =
      store();

    const manifestBuild =
      build([
        entry(
          "linked",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        manifestBuild,
      );

    const synthetic =
      new GenesisSyntheticReplayAdmissionAdapter();

    const started =
      startGenesisReplayExecution({
        plan,

        manifest:
          manifestBuild.manifest,

        startedAt:
          1000,
      });

    const completed =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter:
          synthetic,

        occurredAt:
          1100,
      });

    persistence.saveManifestBuild(
      manifestBuild,
    );

    persistence.saveExecution(
      completed.execution,
    );

    const evidenceId =
      completed.execution
        .checkpoint
        ?.admittedEvidenceIds[0];

    assert.ok(
      evidenceId,
    );

    const result =
      inspectGenesisReplayStatus({
        replayId:
          plan.replayId,

        persistence,

        manufacturingRuns: {
          list() {
            return [
              {
                id:
                  "knowledge-run:linked",

                evidenceId,

                currentStage:
                  "Canonical Review",

                status:
                  "active",

                packageId:
                  "knowledge-package:linked",

                canonicalKnowledgeIds:
                  [],

                stageHistory:
                  [],

                createdAt:
                  1000,

                updatedAt:
                  1100,
              },
            ];
          },
        },
      });

    assert.equal(
      result.admissionLinks
        .length,
      1,
    );

    assert.deepEqual(
      result.admissionLinks[0],
      {
        evidenceId,

        manufacturingRunId:
          "knowledge-run:linked",

        linked:
          true,

        ambiguous:
          false,

        matchingManufacturingRunIds: [
          "knowledge-run:linked",
        ],

        status:
          "active",

        currentStage:
          "Canonical Review",

        packageId:
          "knowledge-package:linked",

        canonicalKnowledgeIds:
          [],
      },
    );

    assert.equal(
      result.allAdmittedEvidenceLinked,
      true,
    );
  },
);

test(
  "missing Knowledge Manufacturing linkage is reported truthfully without fabricating a run",
  async () => {
    const persistence =
      store();

    const manifestBuild =
      build([
        entry(
          "unlinked",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        manifestBuild,
      );

    const started =
      startGenesisReplayExecution({
        plan,

        manifest:
          manifestBuild.manifest,

        startedAt:
          1000,
      });

    const completed =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter:
          new GenesisSyntheticReplayAdmissionAdapter(),

        occurredAt:
          1100,
      });

    persistence.saveManifestBuild(
      manifestBuild,
    );

    persistence.saveExecution(
      completed.execution,
    );

    const result =
      inspectGenesisReplayStatus({
        replayId:
          plan.replayId,

        persistence,

        manufacturingRuns: {
          list() {
            return [];
          },
        },
      });

    assert.equal(
      result.admittedEvidenceIds
        .length,
      1,
    );

    assert.equal(
      result.admissionLinks[0]
        .linked,
      false,
    );

    assert.equal(
      result.admissionLinks[0]
        .manufacturingRunId,
      null,
    );

    assert.equal(
      result.allAdmittedEvidenceLinked,
      false,
    );
  },
);

test(
  "status service reports failed persisted Runner Result without altering Replay Execution",
  async () => {
    const persistence =
      store();

    const manifestBuild =
      build([
        entry(
          "failure",
        ),
      ]);

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

    persistence.saveRunnerResult({
      outcome:
        "FAILED",

      execution,

      stepsCompleted:
        0,

      failure: {
        manifestIndex:
          0,

        historicalSourceId:
          manifestBuild.manifest
            .entries[0]
            .historicalSourceId,

        message:
          "fixture failure",
      },
    });

    const before =
      persistence.loadExecution(
        plan.replayId,
      );

    const result =
      inspectGenesisReplayStatus({
        replayId:
          plan.replayId,

        persistence,
      });

    assert.equal(
      result.runnerOutcome,
      "FAILED",
    );

    assert.equal(
      result.runnerFailure
        ?.message,
      "fixture failure",
    );

    assert.equal(
      result.executionStatus,
      "running",
    );

    assert.deepEqual(
      persistence.loadExecution(
        plan.replayId,
      ),
      before,
    );
  },
);

test(
  "status inspection has no persistence write capability",
  () => {
    const persistence =
      store();

    persistence.saveManifestBuild =
      () => {
        throw new Error(
          "status service attempted manifest write",
        );
      };

    persistence.saveExecution =
      () => {
        throw new Error(
          "status service attempted execution write",
        );
      };

    persistence.saveRunnerResult =
      () => {
        throw new Error(
          "status service attempted runner-result write",
        );
      };

    assert.doesNotThrow(
      () =>
        inspectGenesisReplayStatus({
          replayId:
            "genesis-replay:read-only" as const,

          persistence,
        }),
    );
  },
);

test(
  "multiple Knowledge Manufacturing Runs for one admitted Evidence identity are reported as ambiguous",
  async () => {
    const persistence =
      store();

    const manifestBuild =
      build([
        entry(
          "ambiguous",
        ),
      ]);

    const plan =
      createGenesisReplayPlan(
        manifestBuild,
      );

    const started =
      startGenesisReplayExecution({
        plan,

        manifest:
          manifestBuild.manifest,

        startedAt:
          1000,
      });

    const completed =
      await executeGenesisReplayNext({
        execution:
          started,

        admissionAdapter:
          new GenesisSyntheticReplayAdmissionAdapter(),

        occurredAt:
          1100,
      });

    persistence.saveManifestBuild(
      manifestBuild,
    );

    persistence.saveExecution(
      completed.execution,
    );

    const evidenceId =
      completed.execution
        .checkpoint
        ?.admittedEvidenceIds[0];

    assert.ok(
      evidenceId,
    );

    const result =
      inspectGenesisReplayStatus({
        replayId:
          plan.replayId,

        persistence,

        manufacturingRuns: {
          list() {
            return [
              {
                id:
                  "knowledge-run:ambiguous-a",

                evidenceId,

                currentStage:
                  "Canonical Review",

                status:
                  "active",

                packageId:
                  "knowledge-package:a",

                canonicalKnowledgeIds:
                  [],

                stageHistory:
                  [],

                createdAt:
                  1000,

                updatedAt:
                  1100,
              },

              {
                id:
                  "knowledge-run:ambiguous-b",

                evidenceId,

                currentStage:
                  "Validation",

                status:
                  "failed",

                canonicalKnowledgeIds:
                  [],

                stageHistory:
                  [],

                createdAt:
                  1001,

                updatedAt:
                  1200,
              },
            ];
          },
        },
      });

    assert.equal(
      result.admissionLinks
        .length,
      1,
    );

    const link =
      result.admissionLinks[0];

    assert.equal(
      link.linked,
      true,
    );

    assert.equal(
      link.ambiguous,
      true,
    );

    assert.deepEqual(
      link.matchingManufacturingRunIds,
      [
        "knowledge-run:ambiguous-a",
        "knowledge-run:ambiguous-b",
      ],
    );

    /*
     * Inspection must not arbitrarily promote either duplicate
     * run as authoritative.
     */
    assert.equal(
      link.manufacturingRunId,
      null,
    );

    assert.equal(
      link.status,
      null,
    );

    assert.equal(
      link.currentStage,
      null,
    );

    assert.equal(
      link.packageId,
      null,
    );

    assert.deepEqual(
      link.canonicalKnowledgeIds,
      [],
    );

    assert.equal(
      result.allAdmittedEvidenceLinked,
      false,
    );
  },
);
