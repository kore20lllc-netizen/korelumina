import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/index.js";

import {
  FileEvidencePersistenceStore,
} from "../../evidence/index.js";

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
  recoverPersistedGenesisReplay,
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
          "korelumina-genesis-recovery-",
        ),
      ),
  });
}

async function persistedRunningReplay(
  input: {
    completedPrefix?:
      number;
  } = {},
) {
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
      entry(
        "c",
      ),
    ]);

  const plan =
    createGenesisReplayPlan(
      manifestBuild,
    );

  let execution =
    startGenesisReplayExecution({
      plan,

      manifest:
        manifestBuild.manifest,

      startedAt:
        1000,
    });

  const synthetic =
    new GenesisSyntheticReplayAdmissionAdapter();

  const prefix =
    input.completedPrefix ??
    0;

  for (
    let index = 0;
    index <
      prefix;
    index +=
      1
  ) {
    const step =
      await executeGenesisReplayNext({
        execution,

        admissionAdapter:
          synthetic,

        occurredAt:
          1100 +
          index,
      });

    execution =
      step.execution;
  }

  persistence.saveManifestBuild(
    manifestBuild,
  );

  persistence.saveExecution(
    execution,
  );

  return {
    persistence,
    manifestBuild,
    plan,
    execution,
  };
}

test(
  "INSPECT reopens persisted replay without executing or mutating it",
  async () => {
    const fixture =
      await persistedRunningReplay({
        completedPrefix:
          1,
      });

    const before =
      fixture.persistence
        .loadExecution(
          fixture.plan.replayId,
        );

    const result =
      await recoverPersistedGenesisReplay({
        mode:
          "INSPECT",

        replayId:
          fixture.plan.replayId,

        persistenceStore:
          fixture.persistence,

        executionTimestampForManifestIndex:
          () =>
            9999,
      });

    assert.equal(
      result.mode,
      "INSPECT",
    );

    assert.equal(
      result.runnerResult,
      null,
    );

    assert.equal(
      result.execution
        .state
        .currentManifestIndex,
      1,
    );

    assert.equal(
      result.preflight
        .resumable,
      true,
    );

    assert.equal(
      result.preflight
        .productionRecoveryAuthorized,
      false,
    );

    assert.deepEqual(
      fixture.persistence
        .loadExecution(
          fixture.plan.replayId,
        ),
      before,
    );
  },
);

test(
  "recovery requires an existing persisted manifest",
  async () => {
    const persistence =
      store();

    await assert.rejects(
      () =>
        recoverPersistedGenesisReplay({
          mode:
            "INSPECT",

          replayId:
            "genesis-replay:missing" as const,

          persistenceStore:
            persistence,

          executionTimestampForManifestIndex:
            () =>
              1000,
        }),
      /genesis_replay_recovery_manifest_not_found/,
    );
  },
);

test(
  "recovery requires an existing persisted execution",
  async () => {
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

    await assert.rejects(
      () =>
        recoverPersistedGenesisReplay({
          mode:
            "INSPECT",

          replayId:
            plan.replayId,

          persistenceStore:
            persistence,

          executionTimestampForManifestIndex:
            () =>
              1000,
        }),
      /genesis_replay_recovery_execution_not_found/,
    );
  },
);

test(
  "PRODUCTION_RECOVERY requires explicit authorization",
  async () => {
    const fixture =
      await persistedRunningReplay();

    await assert.rejects(
      () =>
        recoverPersistedGenesisReplay({
          mode:
            "PRODUCTION_RECOVERY",

          replayId:
            fixture.plan.replayId,

          persistenceStore:
            fixture.persistence,

          executionTimestampForManifestIndex:
            () =>
              1200,

          platform:
            createKnowledgePreservationPlatform(),
        }),
      /genesis_replay_recovery_not_authorized/,
    );
  },
);

test(
  "PRODUCTION_RECOVERY requires certified Knowledge Preservation Platform",
  async () => {
    const fixture =
      await persistedRunningReplay();

    await assert.rejects(
      () =>
        recoverPersistedGenesisReplay({
          mode:
            "PRODUCTION_RECOVERY",

          replayId:
            fixture.plan.replayId,

          persistenceStore:
            fixture.persistence,

          executionTimestampForManifestIndex:
            () =>
              1200,

          authorizeProductionRecovery:
            true,
        }),
      /genesis_replay_recovery_platform_required/,
    );
  },
);

test(
  "production recovery continues strictly from persisted manifest position",
  async () => {
    const fixture =
      await persistedRunningReplay({
        completedPrefix:
          1,
      });

    /*
     * Position a is already terminal before production recovery begins.
     * Recovery must therefore continue from manifest index 1.
     */
    assert.equal(
      fixture.execution
        .state
        .currentManifestIndex,
      1,
    );

    assert.equal(
      fixture.execution
        .state
        .lastCompletedManifestIndex,
      0,
    );

    assert.equal(
      fixture.execution
        .state
        .dispositions
        .length,
      1,
    );

    const platform =
      createKnowledgePreservationPlatform();

    const result =
      await recoverPersistedGenesisReplay({
        mode:
          "PRODUCTION_RECOVERY",

        replayId:
          fixture.plan.replayId,

        persistenceStore:
          fixture.persistence,

        executionTimestampForManifestIndex:
          (
            manifestIndex,
          ) =>
            2000 +
            manifestIndex,

        platform,

        authorizeProductionRecovery:
          true,
      });

    assert.equal(
      result.mode,
      "PRODUCTION_RECOVERY",
    );

    if (
      result.mode !==
      "PRODUCTION_RECOVERY"
    ) {
      throw new Error(
        "expected production recovery result",
      );
    }

    assert.equal(
      result.runnerResult
        .outcome,
      "COMPLETED",
    );

    assert.equal(
      result.runnerResult
        .execution
        .state.status,
      "completed",
    );

    assert.equal(
      result.runnerResult
        .stepsCompleted,
      3,
    );

    /*
     * Recovery must persist the advanced execution, not merely
     * return an in-memory completed state.
     */
    const persistedExecution =
      fixture.persistence
        .loadExecution(
          fixture.plan.replayId,
        );

    assert.ok(
      persistedExecution,
    );

    assert.deepEqual(
      persistedExecution,
      result.runnerResult
        .execution,
    );

    assert.equal(
      persistedExecution
        .state
        .currentManifestIndex,
      null,
    );

    assert.equal(
      persistedExecution
        .state
        .lastCompletedManifestIndex,
      2,
    );

    assert.equal(
      persistedExecution
        .state
        .progress
        .completedSources,
      3,
    );

    assert.equal(
      persistedExecution
        .state
        .progress
        .admittedSources,
      3,
    );

    const [
      positionA,
      positionB,
      positionC,
    ] =
      persistedExecution
        .state
        .dispositions;

    if (
      !positionA ||
      positionA.disposition !==
        "ADMITTED" ||
      !positionB ||
      positionB.disposition !==
        "ADMITTED" ||
      !positionC ||
      positionC.disposition !==
        "ADMITTED"
    ) {
      throw new Error(
        "expected three admitted replay dispositions",
      );
    }

    assert.equal(
      positionA
        .historicalSourceId,
      fixture.manifestBuild
        .manifest
        .entries[0]
        ?.historicalSourceId,
    );

    assert.equal(
      positionB
        .historicalSourceId,
      fixture.manifestBuild
        .manifest
        .entries[1]
        ?.historicalSourceId,
    );

    assert.equal(
      positionC
        .historicalSourceId,
      fixture.manifestBuild
        .manifest
        .entries[2]
        ?.historicalSourceId,
    );

    /*
     * GenesisProductionReplayAdmissionAdapter uses the standard
     * Evidence persistence store for correlation-only Evidence.
     *
     * Test processes resolve the default store into the isolated
     * test-knowledge root, so this observes the same persistence
     * surface used by the production adapter without touching
     * production knowledge.
     */
    const evidenceStore =
      new FileEvidencePersistenceStore();

    assert.ok(
      positionA.evidenceId,
    );

    assert.ok(
      positionB.evidenceId,
    );

    assert.ok(
      positionC.evidenceId,
    );

    const positionAEvidence =
      evidenceStore.load(
        positionA.evidenceId,
      );

    const positionBEvidence =
      evidenceStore.load(
        positionB.evidenceId,
      );

    const positionCEvidence =
      evidenceStore.load(
        positionC.evidenceId,
      );

    /*
     * a was completed by the synthetic prefix before recovery.
     * If production recovery restarted from zero, production
     * admission would have persisted this Evidence.
     */
    assert.equal(
      positionAEvidence,
      null,
    );

    if (
      !positionBEvidence ||
      !positionCEvidence
    ) {
      throw new Error(
        "expected recovered commit Evidence for b and c",
      );
    }

    assert.equal(
      positionBEvidence.id,
      positionB.evidenceId,
    );

    assert.equal(
      positionBEvidence.type,
      "commit",
    );

    assert.equal(
      positionBEvidence
        .contentRef,
      "git:commit:b",
    );

    assert.equal(
      positionBEvidence
        .checksum,
      "sha256:b",
    );

    assert.equal(
      positionBEvidence
        .metadata
        .historicalSourceId,
      "genesis-source:commit:b",
    );

    assert.equal(
      positionBEvidence
        .metadata
        .genesisManifestIndex,
      1,
    );

    assert.equal(
      positionCEvidence.id,
      positionC.evidenceId,
    );

    assert.equal(
      positionCEvidence.type,
      "commit",
    );

    assert.equal(
      positionCEvidence
        .contentRef,
      "git:commit:c",
    );

    assert.equal(
      positionCEvidence
        .checksum,
      "sha256:c",
    );

    assert.equal(
      positionCEvidence
        .metadata
        .historicalSourceId,
      "genesis-source:commit:c",
    );

    assert.equal(
      positionCEvidence
        .metadata
        .genesisManifestIndex,
      2,
    );

    /*
     * Raw repository commits are correlation-only Evidence.
     * Successful production recovery therefore creates no direct
     * Knowledge Manufacturing runs.
     */
    assert.equal(
      platform
        .manufacturingRunService
        .list()
        .length,
      0,
    );
  },
);

test(
  "completed replay cannot be restarted through recovery",
  async () => {
    const fixture =
      await persistedRunningReplay({
        completedPrefix:
          3,
      });

    assert.equal(
      fixture.execution
        .state.status,
      "completed",
    );

    await assert.rejects(
      () =>
        recoverPersistedGenesisReplay({
          mode:
            "PRODUCTION_RECOVERY",

          replayId:
            fixture.plan.replayId,

          persistenceStore:
            fixture.persistence,

          executionTimestampForManifestIndex:
            () =>
              3000,

          platform:
            createKnowledgePreservationPlatform(),

          authorizeProductionRecovery:
            true,
        }),
      /genesis_replay_recovery_already_completed/,
    );
  },
);

test(
  "recovery rejects persistence rooted under production runtime knowledge",
  async () => {
    const unsafe =
      new FileGenesisReplayPersistenceStore({
        storageRoot:
          path.join(
            "/fixture",
            "runtime",
            "knowledge",
            "genesis",
          ),
      });

    await assert.rejects(
      () =>
        recoverPersistedGenesisReplay({
          mode:
            "INSPECT",

          replayId:
            "genesis-replay:fixture" as const,

          persistenceStore:
            unsafe,

          executionTimestampForManifestIndex:
            () =>
              1000,
        }),
      /genesis_replay_recovery_persistence_not_isolated/,
    );
  },
);
