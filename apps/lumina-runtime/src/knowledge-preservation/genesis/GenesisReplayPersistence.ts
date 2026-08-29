import {
  createHash,
} from "node:crypto";

import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import path from "node:path";

import {
  getRuntimeDataRoot,
} from "../../projects/workspacePaths.js";

import type {
  GenesisReplayAdmissionAdapter,
  GenesisReplayExecution,
} from "./GenesisReplayExecution.js";

import {
  validateGenesisReplayResume,
} from "./GenesisReplayCheckpoint.js";

import {
  executeGenesisReplayNext,
} from "./GenesisReplayExecution.js";

import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import {
  createGenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisReplayRunnerResult,
} from "./GenesisReplayRunner.js";

import type {
  GenesisSourceManifestBuildResult,
} from "./GenesisSourceManifestBuilder.js";

import type {
  GenesisHistoricalAdmissionGovernanceProjection,
} from "./GenesisHistoricalAdmissionGovernanceProjection.js";

export interface GenesisReplayPersistencePaths {
  replayDirectory:
    string;

  manifestBuildFile:
    string;

  executionFile:
    string;

  runnerResultFile:
    string;

  admissionGovernanceFile:
    string;
}

export interface GenesisReplayPersistenceOptions {
  storageRoot?:
    string;
}

export interface ResumePersistedGenesisReplayInput {
  replayId:
    GenesisReplayId;

  admissionAdapter:
    GenesisReplayAdmissionAdapter;

  executionTimestampForManifestIndex:
    (
      manifestIndex:
        number,
    ) => number;
}

export interface GenesisReplayPersistenceStore {
  saveManifestBuild(
    result:
      GenesisSourceManifestBuildResult,
  ): void;

  loadManifestBuild(
    replayId:
      GenesisReplayId,
  ):
    GenesisSourceManifestBuildResult |
    null;

  saveExecution(
    execution:
      GenesisReplayExecution,
  ): void;

  loadExecution(
    replayId:
      GenesisReplayId,
  ):
    GenesisReplayExecution |
    null;

  saveRunnerResult(
    result:
      GenesisReplayRunnerResult,
  ): void;

  loadRunnerResult(
    replayId:
      GenesisReplayId,
  ):
    GenesisReplayRunnerResult |
    null;
}

function stableReplayStorageKey(
  replayId:
    GenesisReplayId,
): string {
  return createHash(
    "sha256",
  )
    .update(
      replayId,
      "utf8",
    )
    .digest(
      "hex",
    );
}

function assertInsideRoot(
  root:
    string,

  candidate:
    string,
): void {
  const relative =
    path.relative(
      root,
      candidate,
    );

  if (
    relative ===
      ".." ||
    relative.startsWith(
      `..${path.sep}`,
    ) ||
    path.isAbsolute(
      relative,
    )
  ) {
    throw new Error(
      "genesis_replay_persistence_path_escape",
    );
  }
}

function atomicWriteJson(
  file:
    string,

  value:
    unknown,
): void {
  const directory =
    path.dirname(
      file,
    );

  mkdirSync(
    directory,
    {
      recursive:
        true,
    },
  );

  const temporary =
    `${file}.tmp-${process.pid}`;

  try {
    writeFileSync(
      temporary,
      `${JSON.stringify(
        value,
        null,
        2,
      )}\n`,
      "utf8",
    );

    renameSync(
      temporary,
      file,
    );
  } finally {
    rmSync(
      temporary,
      {
        force:
          true,
      },
    );
  }
}

function readJson<T>(
  file:
    string,
): T | null {
  let content:
    string;

  try {
    content =
      readFileSync(
        file,
        "utf8",
      );
  } catch (
    error
  ) {
    const code =
      (
        error as {
          code?:
            string;
        }
      ).code;

    if (
      code ===
      "ENOENT"
    ) {
      return null;
    }

    throw error;
  }

  try {
    return JSON.parse(
      content,
    ) as T;
  } catch (
    error
  ) {
    if (
      error instanceof
      SyntaxError
    ) {
      throw new Error(
        "genesis_replay_persistence_corrupt_json",
        {
          cause:
            error,
        },
      );
    }

    throw error;
  }
}

function replayIdForManifestBuild(
  result:
    GenesisSourceManifestBuildResult,
): GenesisReplayId {
  return createGenesisReplayId({
    manifestId:
      result.manifest.manifestId,

    replayContractVersion:
      result.manifest
        .replayContractVersion,

    scope:
      result.manifest.scope,
  });
}

function assertExecutionIdentity(
  replayId:
    GenesisReplayId,

  execution:
    GenesisReplayExecution,
): void {
  if (
    execution.plan.replayId !==
    replayId
  ) {
    throw new Error(
      "genesis_replay_persistence_execution_identity_mismatch",
    );
  }

  const expected =
    createGenesisReplayId({
      manifestId:
        execution.manifest
          .manifestId,

      replayContractVersion:
        execution.manifest
          .replayContractVersion,

      scope:
        execution.manifest
          .scope,
    });

  if (
    expected !==
    replayId
  ) {
    throw new Error(
      "genesis_replay_persistence_manifest_identity_mismatch",
    );
  }
}

function assertPersistedExecutionIntegrity(
  replayId:
    GenesisReplayId,

  execution:
    GenesisReplayExecution,
): void {
  assertExecutionIdentity(
    replayId,
    execution,
  );

  const checkpoint =
    execution.checkpoint;

  if (
    checkpoint
  ) {
    validateGenesisReplayResume({
      checkpoint,

      replayId,

      manifest:
        execution.manifest,

      replayContractVersion:
        execution.manifest
          .replayContractVersion,
    });

    if (
      execution.state
        .lastCompletedManifestIndex !==
      checkpoint
        .lastCompletedManifestIndex
    ) {
      throw new Error(
        "genesis_replay_persistence_state_checkpoint_position_mismatch",
      );
    }

    if (
      execution.state
        .dispositions.length !==
      checkpoint
        .dispositions.length
    ) {
      throw new Error(
        "genesis_replay_persistence_state_checkpoint_disposition_mismatch",
      );
    }
  } else if (
    execution.state
      .lastCompletedManifestIndex !==
      null ||
    execution.state
      .dispositions.length !==
      0
  ) {
    throw new Error(
      "genesis_replay_persistence_checkpoint_missing_for_completed_prefix",
    );
  }
}

function assertRunnerResultIdentity(
  replayId:
    GenesisReplayId,

  result:
    GenesisReplayRunnerResult,
): void {
  assertPersistedExecutionIntegrity(
    replayId,
    result.execution,
  );
}

export class FileGenesisReplayPersistenceStore
  implements GenesisReplayPersistenceStore
{
  readonly storageRoot:
    string;

  constructor(
    options:
      GenesisReplayPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "genesis",
          "replays",
        ),
      );
  }

  pathsFor(
    replayId:
      GenesisReplayId,
  ): GenesisReplayPersistencePaths {
    const replayDirectory =
      path.join(
        this.storageRoot,
        stableReplayStorageKey(
          replayId,
        ),
      );

    assertInsideRoot(
      this.storageRoot,
      replayDirectory,
    );

    return {
      replayDirectory,

      manifestBuildFile:
        path.join(
          replayDirectory,
          "manifest-build.json",
        ),

      executionFile:
        path.join(
          replayDirectory,
          "execution.json",
        ),

      runnerResultFile:
        path.join(
          replayDirectory,
          "runner-result.json",
        ),

      admissionGovernanceFile:
        path.join(
          replayDirectory,
          "admission-governance.json",
        ),
    };
  }

  saveManifestBuild(
    result:
      GenesisSourceManifestBuildResult,
  ): void {
    const replayId =
      replayIdForManifestBuild(
        result,
      );

    atomicWriteJson(
      this.pathsFor(
        replayId,
      ).manifestBuildFile,
      result,
    );
  }

  loadManifestBuild(
    replayId:
      GenesisReplayId,
  ):
    GenesisSourceManifestBuildResult |
    null {
    const result =
      readJson<
        GenesisSourceManifestBuildResult
      >(
        this.pathsFor(
          replayId,
        ).manifestBuildFile,
      );

    if (
      !result
    ) {
      return null;
    }

    if (
      replayIdForManifestBuild(
        result,
      ) !==
      replayId
    ) {
      throw new Error(
        "genesis_replay_persistence_manifest_build_identity_mismatch",
      );
    }

    return result;
  }

  saveExecution(
    execution:
      GenesisReplayExecution,
  ): void {
    const replayId =
      execution.plan.replayId;

    assertPersistedExecutionIntegrity(
      replayId,
      execution,
    );

    atomicWriteJson(
      this.pathsFor(
        replayId,
      ).executionFile,
      execution,
    );
  }

  loadExecution(
    replayId:
      GenesisReplayId,
  ):
    GenesisReplayExecution |
    null {
    const execution =
      readJson<
        GenesisReplayExecution
      >(
        this.pathsFor(
          replayId,
        ).executionFile,
      );

    if (
      !execution
    ) {
      return null;
    }

    assertPersistedExecutionIntegrity(
      replayId,
      execution,
    );

    return execution;
  }

  saveAdmissionGovernanceProjection(
    replayId:
      GenesisReplayId,

    projection:
      GenesisHistoricalAdmissionGovernanceProjection,
  ): void {
    atomicWriteJson(
      this.pathsFor(
        replayId,
      ).admissionGovernanceFile,
      projection,
    );
  }

  loadAdmissionGovernanceProjection(
    replayId:
      GenesisReplayId,
  ):
    GenesisHistoricalAdmissionGovernanceProjection |
    null {
    return readJson<
      GenesisHistoricalAdmissionGovernanceProjection
    >(
      this.pathsFor(
        replayId,
      ).admissionGovernanceFile,
    );
  }


  saveRunnerResult(
    result:
      GenesisReplayRunnerResult,
  ): void {
    const replayId =
      result.execution
        .plan.replayId;

    assertRunnerResultIdentity(
      replayId,
      result,
    );

    atomicWriteJson(
      this.pathsFor(
        replayId,
      ).runnerResultFile,
      result,
    );
  }

  loadRunnerResult(
    replayId:
      GenesisReplayId,
  ):
    GenesisReplayRunnerResult |
    null {
    const result =
      readJson<
        GenesisReplayRunnerResult
      >(
        this.pathsFor(
          replayId,
        ).runnerResultFile,
      );

    if (
      !result
    ) {
      return null;
    }

    assertRunnerResultIdentity(
      replayId,
      result,
    );

    return result;
  }
}

export async function resumePersistedGenesisReplay(
  input:
    ResumePersistedGenesisReplayInput,

  store:
    GenesisReplayPersistenceStore,
): Promise<
  GenesisReplayRunnerResult
> {
  let execution =
    store.loadExecution(
      input.replayId,
    );

  if (
    !execution
  ) {
    throw new Error(
      "genesis_replay_persistence_execution_not_found",
    );
  }

  let stepsCompleted =
    execution.state
      .dispositions.length;

  while (
    execution.state.status !==
    "completed"
  ) {
    if (
      execution.state.status !==
      "running" ||
    execution.state
      .currentManifestIndex ===
      null
  ) {
    throw new Error(
      "genesis_replay_persistence_execution_not_resumable",
    );
  }

  const manifestIndex =
    execution.state
      .currentManifestIndex;

  const manifestEntry =
    execution.manifest
      .entries[
        manifestIndex
      ];

  try {
    const occurredAt =
      input
        .executionTimestampForManifestIndex(
          manifestIndex,
        );

    if (
      !Number.isFinite(
        occurredAt,
      ) ||
      occurredAt <
        0
    ) {
      throw new Error(
        "genesis_replay_persistence_execution_timestamp_invalid",
      );
    }

    const step =
      await executeGenesisReplayNext({
        execution,

        admissionAdapter:
          input.admissionAdapter,

        occurredAt,
      });

    if (
      !step.disposition
    ) {
      throw new Error(
        "genesis_replay_persistence_running_step_without_disposition",
      );
    }

    execution =
      step.execution;

    stepsCompleted +=
      1;

    store.saveExecution(
      execution,
    );
  } catch (
    error
  ) {
    const result:
      GenesisReplayRunnerResult =
      {
        outcome:
          "FAILED",

        execution,

        stepsCompleted,

        failure: {
          manifestIndex,

          historicalSourceId:
            manifestEntry
              ?.historicalSourceId ??
            null,

          message:
            error instanceof Error
              ? error.message
              : String(
                  error,
                ),
        },
      };

    store.saveRunnerResult(
      result,
    );

    return result;
  }
  }

  const result:
    GenesisReplayRunnerResult =
    {
      outcome:
        "COMPLETED",

      execution,

      stepsCompleted,

      failure:
        null,
    };

  store.saveRunnerResult(
    result,
  );

  return result;
}
