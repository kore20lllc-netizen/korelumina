import type {
  GenesisReplayAdmissionAdapter,
  GenesisReplayExecution,
} from "./GenesisReplayExecution.js";

import {
  executeGenesisReplayNext,
  startGenesisReplayExecution,
} from "./GenesisReplayExecution.js";

import {
  createGenesisReplayPlan,
} from "./GenesisReplayPlan.js";

import type {
  GenesisSourceManifestBuildResult,
} from "./GenesisSourceManifestBuilder.js";

export type GenesisReplayRunnerOutcome =
  | "COMPLETED"
  | "FAILED";

export interface GenesisReplayRunnerFailure {
  manifestIndex:
    number;

  historicalSourceId:
    string | null;

  message:
    string;
}

export interface GenesisReplayRunnerResult {
  outcome:
    GenesisReplayRunnerOutcome;

  execution:
    GenesisReplayExecution;

  stepsCompleted:
    number;

  failure:
    GenesisReplayRunnerFailure |
    null;
}

export interface RunGenesisReplayInput {
  manifestBuild:
    GenesisSourceManifestBuildResult;

  admissionAdapter:
    GenesisReplayAdmissionAdapter;

  startedAt:
    number;

  executionTimestampForManifestIndex:
    (
      manifestIndex:
        number,
    ) => number;
}

function requireTimestamp(
  value:
    number,

  error:
    string,
): number {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new Error(
      error,
    );
  }

  return value;
}

function failureMessage(
  error:
    unknown,
): string {
  return error instanceof Error
    ? error.message
    : String(
        error,
      );
}

export async function runGenesisReplay(
  input:
    RunGenesisReplayInput,
): Promise<
  GenesisReplayRunnerResult
> {
  const startedAt =
    requireTimestamp(
      input.startedAt,
      "genesis_replay_runner_started_at_invalid",
    );

  const plan =
    createGenesisReplayPlan(
      input.manifestBuild,
    );

  let execution =
    startGenesisReplayExecution({
      plan,

      manifest:
        input.manifestBuild
          .manifest,

      startedAt,
    });

  let stepsCompleted =
    0;

  while (
    execution.state.status !==
    "completed"
  ) {
    if (
      execution.state.status !==
      "running"
    ) {
      throw new Error(
        "genesis_replay_runner_unexpected_execution_state",
      );
    }

    const manifestIndex =
      execution.state
        .currentManifestIndex;

    if (
      manifestIndex ===
      null
    ) {
      throw new Error(
        "genesis_replay_runner_current_manifest_index_missing",
      );
    }

    const manifestEntry =
      execution.manifest
        .entries[
          manifestIndex
        ];

    try {
      const occurredAt =
        requireTimestamp(
          input
            .executionTimestampForManifestIndex(
              manifestIndex,
            ),
          "genesis_replay_runner_execution_timestamp_invalid",
        );

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
          "genesis_replay_runner_running_step_without_disposition",
        );
      }

      execution =
        step.execution;

      stepsCompleted +=
        1;
    } catch (
      error
    ) {
      return {
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
            failureMessage(
              error,
            ),
        },
      };
    }
  }

  return {
    outcome:
      "COMPLETED",

    execution,

    stepsCompleted,

    failure:
      null,
  };
}
