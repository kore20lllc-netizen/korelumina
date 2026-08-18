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

import type {
  GenesisReplayManifestBuilder,
  GenesisReplayScope,
  GenesisSourceManifestBuildResult,
  GenesisSourceManifestEntry,
} from "../index.js";

import {
  FileGenesisReplayPersistenceStore,
  createGenesisReplayId,
  createGenesisSourceManifestId,
  runGovernedGenesisReplay,
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
    readonly GenesisSourceManifestEntry[] = [
      entry(
        "orchestrator",
      ),
    ],
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

function blockedBuild():
  GenesisSourceManifestBuildResult {
  const result =
    build();

  return {
    ...result,

    readiness:
      "BLOCKED",

    errors: [
      {
        code:
          "DISCOVERY_FAILED",

        discovererId:
          "fixture",

        message:
          "fixture discovery failure",
      },
    ],
  };
}

function fixtureBuilder(
  result:
    GenesisSourceManifestBuildResult,
): GenesisReplayManifestBuilder {
  return async () =>
    result;
}

function store() {
  return new FileGenesisReplayPersistenceStore({
    storageRoot:
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-genesis-orchestrator-",
        ),
      ),
  });
}

test(
  "DRY_RUN performs discovery planning and preflight without starting execution",
  async () => {
    const persistence =
      store();

    const manifestBuild =
      build();

    const result =
      await runGovernedGenesisReplay({
        mode:
          "DRY_RUN",

        repositoryRoot:
          "/fixture",

        scope:
          scope(),

        persistenceStore:
          persistence,

        startedAt:
          1000,

        executionTimestampForManifestIndex:
          () =>
            1100,

        manifestBuilder:
          fixtureBuilder(
            manifestBuild,
          ),
      });

    assert.equal(
      result.mode,
      "DRY_RUN",
    );

    assert.equal(
      result.runnerResult,
      null,
    );

    assert.equal(
      result.preflight
        .manifestReady,
      true,
    );

    assert.equal(
      result.preflight
        .planReady,
      true,
    );

    assert.equal(
      result.preflight
        .productionAuthorized,
      false,
    );

    assert.equal(
      result.preflight
        .readyToExecute,
      false,
    );

    assert.equal(
      persistence.loadExecution(
        result.plan.replayId,
      ),
      null,
    );

    assert.equal(
      persistence.loadManifestBuild(
        result.plan.replayId,
      ),
      null,
    );
  },
);

test(
  "BLOCKED discovery cannot become even a dry-run replay plan",
  async () => {
    await assert.rejects(
      () =>
        runGovernedGenesisReplay({
          mode:
            "DRY_RUN",

          repositoryRoot:
            "/fixture",

          scope:
            scope(),

          persistenceStore:
            store(),

          startedAt:
            1000,

          executionTimestampForManifestIndex:
            () =>
              1100,

          manifestBuilder:
            fixtureBuilder(
              blockedBuild(),
            ),
        }),
      /genesis_source_manifest_discovery_incomplete/,
    );
  },
);

test(
  "PRODUCTION_ADMISSION requires explicit authorization",
  async () => {
    await assert.rejects(
      () =>
        runGovernedGenesisReplay({
          mode:
            "PRODUCTION_ADMISSION",

          repositoryRoot:
            "/fixture",

          scope:
            scope(),

          persistenceStore:
            store(),

          startedAt:
            1000,

          executionTimestampForManifestIndex:
            () =>
              1100,

          platform:
            createKnowledgePreservationPlatform(),

          manifestBuilder:
            fixtureBuilder(
              build(),
            ),
        }),
      /genesis_replay_orchestrator_production_not_authorized/,
    );
  },
);

test(
  "PRODUCTION_ADMISSION requires certified Knowledge Preservation Platform",
  async () => {
    await assert.rejects(
      () =>
        runGovernedGenesisReplay({
          mode:
            "PRODUCTION_ADMISSION",

          repositoryRoot:
            "/fixture",

          scope:
            scope(),

          persistenceStore:
            store(),

          startedAt:
            1000,

          executionTimestampForManifestIndex:
            () =>
              1100,

          authorizeProductionAdmission:
            true,

          manifestBuilder:
            fixtureBuilder(
              build(),
            ),
        }),
      /genesis_replay_orchestrator_production_platform_required/,
    );
  },
);

test(
  "production orchestration persists initial replay before governed Evidence admission",
  async () => {
    const persistence =
      store();

    const manifestBuild =
      build([
        entry(
          "production-orchestrator",
        ),
      ]);

    const result =
      await runGovernedGenesisReplay({
        mode:
          "PRODUCTION_ADMISSION",

        repositoryRoot:
          "/fixture",

        scope:
          scope(),

        persistenceStore:
          persistence,

        startedAt:
          1000,

        executionTimestampForManifestIndex:
          () =>
            1200,

        platform:
          createKnowledgePreservationPlatform(),

        authorizeProductionAdmission:
          true,

        manifestBuilder:
          fixtureBuilder(
            manifestBuild,
          ),
      });

    assert.equal(
      result.mode,
      "PRODUCTION_ADMISSION",
    );

    assert.equal(
      result.preflight
        .readyToExecute,
      true,
    );

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

    assert.ok(
      persistence.loadManifestBuild(
        result.plan.replayId,
      ),
    );

    assert.equal(
      persistence.loadExecution(
        result.plan.replayId,
      )?.state.status,
      "completed",
    );
  },
);

test(
  "orchestrator refuses persistence rooted under production runtime knowledge",
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
        runGovernedGenesisReplay({
          mode:
            "DRY_RUN",

          repositoryRoot:
            "/fixture",

          scope:
            scope(),

          persistenceStore:
            unsafe,

          startedAt:
            1000,

          executionTimestampForManifestIndex:
            () =>
              1100,

          manifestBuilder:
            fixtureBuilder(
              build(),
            ),
        }),
      /genesis_replay_orchestrator_persistence_not_isolated/,
    );
  },
);

test(
  "orchestrator will not silently overwrite or restart an existing persisted execution",
  async () => {
    const persistence =
      store();

    const manifestBuild =
      build([
        entry(
          "existing-execution",
        ),
      ]);

    const first =
      await runGovernedGenesisReplay({
        mode:
          "PRODUCTION_ADMISSION",

        repositoryRoot:
          "/fixture",

        scope:
          scope(),

        persistenceStore:
          persistence,

        startedAt:
          1000,

        executionTimestampForManifestIndex:
          () =>
            1200,

        platform:
          createKnowledgePreservationPlatform(),

        authorizeProductionAdmission:
          true,

        manifestBuilder:
          fixtureBuilder(
            manifestBuild,
          ),
      });

    assert.equal(
      first.mode,
      "PRODUCTION_ADMISSION",
    );

    if (
      first.mode !==
      "PRODUCTION_ADMISSION"
    ) {
      throw new Error(
        "expected production admission result",
      );
    }

    assert.equal(
      first.runnerResult
        .outcome,
      "COMPLETED",
    );

    await assert.rejects(
      () =>
        runGovernedGenesisReplay({
          mode:
            "PRODUCTION_ADMISSION",

          repositoryRoot:
            "/fixture",

          scope:
            scope(),

          persistenceStore:
            persistence,

          startedAt:
            2000,

          executionTimestampForManifestIndex:
            () =>
              2200,

          platform:
            createKnowledgePreservationPlatform(),

          authorizeProductionAdmission:
            true,

          manifestBuilder:
            fixtureBuilder(
              manifestBuild,
            ),
        }),
      /genesis_replay_orchestrator_existing_execution_requires_explicit_resume/,
    );
  },
);

test(
  "orchestrator derives the persisted replay identity from the existing manifest identity contract",
  async () => {
    const persistence =
      store();

    const manifestBuild =
      build([]);

    const result =
      await runGovernedGenesisReplay({
        mode:
          "DRY_RUN",

        repositoryRoot:
          "/fixture",

        scope:
          scope(),

        persistenceStore:
          persistence,

        startedAt:
          1000,

        executionTimestampForManifestIndex:
          () =>
            1100,

        manifestBuilder:
          fixtureBuilder(
            manifestBuild,
          ),
      });

    assert.equal(
      result.plan.replayId,
      createGenesisReplayId({
        manifestId:
          manifestBuild.manifest
            .manifestId,

        replayContractVersion:
          manifestBuild.manifest
            .replayContractVersion,

        scope:
          manifestBuild.manifest
            .scope,
      }),
    );
  },
);

test(
  "failure to persist initial execution prevents any production Knowledge admission",
  async () => {
    const persistence =
      store();

    const originalSaveExecution =
      persistence
        .saveExecution
        .bind(
          persistence,
        );

    let saveExecutionAttempts =
      0;

    persistence.saveExecution =
      () => {
        saveExecutionAttempts +=
          1;

        throw new Error(
          "fixture initial execution persistence failure",
        );
      };

    const platform =
      createKnowledgePreservationPlatform();

    const runsBefore =
      platform
        .manufacturingRunService
        .list()
        .length;

    await assert.rejects(
      () =>
        runGovernedGenesisReplay({
          mode:
            "PRODUCTION_ADMISSION",

          repositoryRoot:
            "/fixture",

          scope:
            scope(),

          persistenceStore:
            persistence,

          startedAt:
            1000,

          executionTimestampForManifestIndex:
            () =>
              1200,

          platform,

          authorizeProductionAdmission:
            true,

          manifestBuilder:
            fixtureBuilder(
              build([
                entry(
                  "persistence-failure-before-admission",
                ),
              ]),
            ),
        }),
      /fixture initial execution persistence failure/,
    );

    assert.equal(
      saveExecutionAttempts,
      1,
    );

    assert.equal(
      platform
        .manufacturingRunService
        .list()
        .length,
      runsBefore,
    );

    persistence.saveExecution =
      originalSaveExecution;
  },
);

test(
  "failure to persist manifest prevents execution persistence and production admission",
  async () => {
    const persistence =
      store();

    let saveExecutionCalled =
      false;

    persistence.saveManifestBuild =
      () => {
        throw new Error(
          "fixture manifest persistence failure",
        );
      };

    persistence.saveExecution =
      () => {
        saveExecutionCalled =
          true;

        throw new Error(
          "saveExecution should not be reached",
        );
      };

    const platform =
      createKnowledgePreservationPlatform();

    const runsBefore =
      platform
        .manufacturingRunService
        .list()
        .length;

    await assert.rejects(
      () =>
        runGovernedGenesisReplay({
          mode:
            "PRODUCTION_ADMISSION",

          repositoryRoot:
            "/fixture",

          scope:
            scope(),

          persistenceStore:
            persistence,

          startedAt:
            1000,

          executionTimestampForManifestIndex:
            () =>
              1200,

          platform,

          authorizeProductionAdmission:
            true,

          manifestBuilder:
            fixtureBuilder(
              build([
                entry(
                  "manifest-persistence-failure",
                ),
              ]),
            ),
        }),
      /fixture manifest persistence failure/,
    );

    assert.equal(
      saveExecutionCalled,
      false,
    );

    assert.equal(
      platform
        .manufacturingRunService
        .list()
        .length,
      runsBefore,
    );
  },
);
