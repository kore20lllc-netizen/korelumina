import path from "node:path";

import type {
  KnowledgePreservationPlatform,
} from "../bootstrap/index.js";

import type {
  GenesisReplayExecution,
} from "./GenesisReplayExecution.js";

import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisReplayRunnerResult,
} from "./GenesisReplayRunner.js";

import type {
  GenesisSourceManifestBuildResult,
} from "./GenesisSourceManifestBuilder.js";

import {
  FileGenesisReplayPersistenceStore,
  resumePersistedGenesisReplay,
} from "./GenesisReplayPersistence.js";

import {
  GenesisProductionReplayAdmissionAdapter,
} from "./GenesisProductionReplayAdmissionAdapter.js";

export type GenesisReplayRecoveryMode =
  | "INSPECT"
  | "PRODUCTION_RECOVERY";

export interface GenesisReplayRecoveryPreflight {
  persistenceIsolated:
    boolean;

  manifestPresent:
    boolean;

  executionPresent:
    boolean;

  identityAligned:
    boolean;

  resumable:
    boolean;

  productionRecoveryAuthorized:
    boolean;

  readyToResume:
    boolean;
}

export interface GenesisReplayRecoveryInspectionResult {
  mode:
    "INSPECT";

  replayId:
    GenesisReplayId;

  manifestBuild:
    GenesisSourceManifestBuildResult;

  execution:
    GenesisReplayExecution;

  preflight:
    GenesisReplayRecoveryPreflight;

  runnerResult:
    null;
}

export interface GenesisReplayProductionRecoveryResult {
  mode:
    "PRODUCTION_RECOVERY";

  replayId:
    GenesisReplayId;

  manifestBuild:
    GenesisSourceManifestBuildResult;

  execution:
    GenesisReplayExecution;

  preflight:
    GenesisReplayRecoveryPreflight;

  runnerResult:
    GenesisReplayRunnerResult;
}

export type GenesisReplayRecoveryResult =
  | GenesisReplayRecoveryInspectionResult
  | GenesisReplayProductionRecoveryResult;

export interface RecoverPersistedGenesisReplayInput {
  mode:
    GenesisReplayRecoveryMode;

  replayId:
    GenesisReplayId;

  persistenceStore:
    FileGenesisReplayPersistenceStore;

  executionTimestampForManifestIndex:
    (
      manifestIndex:
        number,
    ) => number;

  platform?:
    KnowledgePreservationPlatform;

  authorizeProductionRecovery?:
    boolean;
}

function assertPersistenceIsolation(
  store:
    FileGenesisReplayPersistenceStore,
): void {
  const normalized =
    path.resolve(
      store.storageRoot,
    );

  const parts =
    normalized
      .split(
        path.sep,
      )
      .filter(
        Boolean,
      );

  for (
    let index = 0;
    index <
      parts.length - 1;
    index +=
      1
  ) {
    if (
      parts[index] ===
        "runtime" &&
      parts[index + 1] ===
        "knowledge"
    ) {
      throw new Error(
        "genesis_replay_recovery_persistence_not_isolated",
      );
    }
  }
}

function requirePersistedReplay(
  input: {
    replayId:
      GenesisReplayId;

    persistenceStore:
      FileGenesisReplayPersistenceStore;
  },
): {
  manifestBuild:
    GenesisSourceManifestBuildResult;

  execution:
    GenesisReplayExecution;
} {
  /*
   * These loads are also integrity gates.
   *
   * FileGenesisReplayPersistenceStore revalidates replay,
   * manifest, state and checkpoint integrity while loading.
   */
  const manifestBuild =
    input.persistenceStore
      .loadManifestBuild(
        input.replayId,
      );

  if (
    !manifestBuild
  ) {
    throw new Error(
      "genesis_replay_recovery_manifest_not_found",
    );
  }

  const execution =
    input.persistenceStore
      .loadExecution(
        input.replayId,
      );

  if (
    !execution
  ) {
    throw new Error(
      "genesis_replay_recovery_execution_not_found",
    );
  }

  if (
    execution.plan.replayId !==
    input.replayId
  ) {
    throw new Error(
      "genesis_replay_recovery_replay_identity_mismatch",
    );
  }

  if (
    execution.manifest
      .manifestId !==
    manifestBuild.manifest
      .manifestId
  ) {
    throw new Error(
      "genesis_replay_recovery_manifest_identity_mismatch",
    );
  }

  if (
    execution.plan
      .manifestId !==
    manifestBuild.manifest
      .manifestId
  ) {
    throw new Error(
      "genesis_replay_recovery_plan_manifest_identity_mismatch",
    );
  }

  if (
    execution.manifest
      .replayContractVersion !==
    manifestBuild.manifest
      .replayContractVersion
  ) {
    throw new Error(
      "genesis_replay_recovery_contract_version_mismatch",
    );
  }

  return {
    manifestBuild,
    execution,
  };
}

function preflightFor(
  input: {
    replayId:
      GenesisReplayId;

    persistenceStore:
      FileGenesisReplayPersistenceStore;

    manifestBuild:
      GenesisSourceManifestBuildResult;

    execution:
      GenesisReplayExecution;

    productionRecoveryAuthorized:
      boolean;
  },
): GenesisReplayRecoveryPreflight {
  assertPersistenceIsolation(
    input.persistenceStore,
  );

  const identityAligned =
    input.execution
      .plan.replayId ===
      input.replayId &&
    input.execution
      .manifest.manifestId ===
      input.manifestBuild
        .manifest.manifestId &&
    input.execution
      .plan.manifestId ===
      input.manifestBuild
        .manifest.manifestId;

  const resumable =
    input.execution
      .state.status ===
      "running" &&
    input.execution
      .state.currentManifestIndex !==
      null;

  return {
    persistenceIsolated:
      true,

    manifestPresent:
      true,

    executionPresent:
      true,

    identityAligned,

    resumable,

    productionRecoveryAuthorized:
      input.productionRecoveryAuthorized,

    readyToResume:
      identityAligned &&
      resumable &&
      input.productionRecoveryAuthorized,
  };
}

export async function recoverPersistedGenesisReplay(
  input:
    RecoverPersistedGenesisReplayInput,
): Promise<
  GenesisReplayRecoveryResult
> {
  assertPersistenceIsolation(
    input.persistenceStore,
  );

  const {
    manifestBuild,
    execution,
  } =
    requirePersistedReplay({
      replayId:
        input.replayId,

      persistenceStore:
        input.persistenceStore,
    });

  const productionRecoveryAuthorized =
    input.mode ===
      "PRODUCTION_RECOVERY" &&
    input.authorizeProductionRecovery ===
      true;

  const preflight =
    preflightFor({
      replayId:
        input.replayId,

      persistenceStore:
        input.persistenceStore,

      manifestBuild,

      execution,

      productionRecoveryAuthorized,
    });

  if (
    input.mode ===
      "INSPECT"
  ) {
    return {
      mode:
        "INSPECT",

      replayId:
        input.replayId,

      manifestBuild,

      execution,

      preflight,

      runnerResult:
        null,
    };
  }

  if (
    execution.state.status ===
      "completed"
  ) {
    throw new Error(
      "genesis_replay_recovery_already_completed",
    );
  }

  if (
    !preflight
      .readyToResume
  ) {
    throw new Error(
      "genesis_replay_recovery_not_authorized",
    );
  }

  if (
    !input.platform
  ) {
    throw new Error(
      "genesis_replay_recovery_platform_required",
    );
  }

  /*
   * Recovery begins only from the already-persisted execution.
   *
   * No discovery.
   * No manifest rebuild.
   * No plan rebuild.
   * No initial execution replacement.
   */
  const admissionAdapter =
    new GenesisProductionReplayAdmissionAdapter({
      platform:
        input.platform,
    });

  const runnerResult =
    await resumePersistedGenesisReplay(
      {
        replayId:
          input.replayId,

        admissionAdapter,

        executionTimestampForManifestIndex:
          input
            .executionTimestampForManifestIndex,
      },
      input.persistenceStore,
    );

  return {
    mode:
      "PRODUCTION_RECOVERY",

    replayId:
      input.replayId,

    manifestBuild,

    execution,

    preflight,

    runnerResult,
  };
}
