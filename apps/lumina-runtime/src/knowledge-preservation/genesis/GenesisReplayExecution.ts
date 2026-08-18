import type {
  GenesisReplayCheckpoint,
  GenesisReplayCheckpointDisposition,
} from "./GenesisReplayCheckpoint.js";

import {
  createGenesisReplayCheckpoint,
} from "./GenesisReplayCheckpoint.js";

import {
  createGenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisReplayPlan,
  GenesisReplayPlanEntry,
} from "./GenesisReplayPlan.js";

import {
  assertGenesisReplayPlanReady,
} from "./GenesisReplayPlan.js";

import type {
  GenesisReplayState,
} from "./GenesisReplayState.js";

import {
  advanceGenesisReplayState,
  createGenesisReplayState,
  startGenesisReplay,
} from "./GenesisReplayState.js";

import type {
  GenesisSourceManifest,
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

export interface GenesisReplayAdmissionRequest {
  replayId:
    GenesisReplayPlan[
      "replayId"
    ];

  manifestId:
    string;

  manifestIndex:
    number;

  planEntry:
    GenesisReplayPlanEntry;

  manifestEntry:
    GenesisSourceManifestEntry;
}

export interface GenesisReplayAdmissionResult {
  evidenceId:
    string;
}

export interface GenesisReplayAdmissionAdapter {
  admit(
    request:
      GenesisReplayAdmissionRequest,
  ):
    Promise<
      GenesisReplayAdmissionResult
    >;
}

export interface GenesisReplayExecution {
  plan:
    GenesisReplayPlan;

  manifest:
    GenesisSourceManifest;

  state:
    GenesisReplayState;

  checkpoint:
    GenesisReplayCheckpoint |
    null;
}

export interface StartGenesisReplayExecutionInput {
  plan:
    GenesisReplayPlan;

  manifest:
    GenesisSourceManifest;

  startedAt:
    number;
}

export interface ExecuteGenesisReplayNextInput {
  execution:
    GenesisReplayExecution;

  admissionAdapter:
    GenesisReplayAdmissionAdapter;

  occurredAt:
    number;
}

export interface GenesisReplayExecutionStepResult {
  execution:
    GenesisReplayExecution;

  disposition:
    GenesisReplayCheckpointDisposition |
    null;
}

function requireNonEmpty(
  value:
    string,

  error:
    string,
): string {
  const normalized =
    value.trim();

  if (
    !normalized
  ) {
    throw new Error(
      error,
    );
  }

  return normalized;
}

function assertPlanMatchesManifest(
  plan:
    GenesisReplayPlan,

  manifest:
    GenesisSourceManifest,
): void {
  if (
    plan.manifestId !==
    manifest.manifestId
  ) {
    throw new Error(
      "genesis_replay_execution_manifest_id_mismatch",
    );
  }

  if (
    plan.replayContractVersion !==
    manifest.replayContractVersion
  ) {
    throw new Error(
      "genesis_replay_execution_contract_version_mismatch",
    );
  }

  const expectedReplayId =
    createGenesisReplayId({
      manifestId:
        manifest.manifestId,

      replayContractVersion:
        manifest.replayContractVersion,

      scope:
        manifest.scope,
    });

  if (
    plan.replayId !==
    expectedReplayId
  ) {
    throw new Error(
      "genesis_replay_execution_replay_id_mismatch",
    );
  }

  if (
    plan.entries.length !==
    manifest.entries.length
  ) {
    throw new Error(
      "genesis_replay_execution_plan_length_mismatch",
    );
  }

  for (
    let index = 0;
    index <
      manifest.entries.length;
    index +=
      1
  ) {
    assertPlanEntryMatchesManifestEntry(
      plan.entries[
        index
      ],
      manifest.entries[
        index
      ],
      index,
    );
  }
}

function assertPlanEntryMatchesManifestEntry(
  planEntry:
    GenesisReplayPlanEntry,

  manifestEntry:
    GenesisSourceManifestEntry,

  expectedIndex:
    number,
): void {
  if (
    planEntry.manifestIndex !==
    expectedIndex
  ) {
    throw new Error(
      "genesis_replay_execution_manifest_index_mismatch",
    );
  }

  if (
    planEntry.historicalSourceId !==
    manifestEntry.historicalSourceId
  ) {
    throw new Error(
      "genesis_replay_execution_source_identity_mismatch",
    );
  }

  if (
    planEntry.sourceChecksum !==
    manifestEntry.sourceChecksum
  ) {
    throw new Error(
      "genesis_replay_execution_source_checksum_mismatch",
    );
  }

  if (
    planEntry.action ===
      "ADMIT" &&
    manifestEntry.replayEligibility !==
      "eligible"
  ) {
    throw new Error(
      "genesis_replay_execution_plan_action_mismatch",
    );
  }

  if (
    planEntry.action ===
      "SKIP_SCOPE" &&
    manifestEntry.replayEligibility !==
      "excluded"
  ) {
    throw new Error(
      "genesis_replay_execution_plan_action_mismatch",
    );
  }

  if (
    planEntry.action ===
      "BLOCK" &&
    manifestEntry.replayEligibility !==
      "blocked"
  ) {
    throw new Error(
      "genesis_replay_execution_plan_action_mismatch",
    );
  }
}

function currentManifestIndex(
  state:
    GenesisReplayState,
): number {
  if (
    state.status !==
    "running"
  ) {
    throw new Error(
      "genesis_replay_execution_requires_running_state",
    );
  }

  if (
    state.currentManifestIndex ===
    null
  ) {
    throw new Error(
      "genesis_replay_execution_current_position_missing",
    );
  }

  return state.currentManifestIndex;
}

function checkpointForState(
  input: {
    replayId:
      GenesisReplayPlan[
        "replayId"
      ];

    manifest:
      GenesisSourceManifest;

    state:
      GenesisReplayState;

    checkpointCreatedAt:
      number;
  },
): GenesisReplayCheckpoint |
  null {
  if (
    input.state
      .lastCompletedManifestIndex ===
    null
  ) {
    return null;
  }

  return createGenesisReplayCheckpoint({
    replayId:
      input.replayId,

    manifest:
      input.manifest,

    replayContractVersion:
      input.manifest
        .replayContractVersion,

    lastCompletedManifestIndex:
      input.state
        .lastCompletedManifestIndex,

    dispositions:
      input.state.dispositions,

    checkpointCreatedAt:
      input.checkpointCreatedAt,
  });
}

export function startGenesisReplayExecution(
  input:
    StartGenesisReplayExecutionInput,
): GenesisReplayExecution {
  assertGenesisReplayPlanReady(
    input.plan,
  );

  assertPlanMatchesManifest(
    input.plan,
    input.manifest,
  );

  const initialState =
    createGenesisReplayState({
      replayId:
        input.plan.replayId,

      manifest:
        input.manifest,
    });

  const state =
    startGenesisReplay(
      initialState,
      input.manifest,
      input.startedAt,
    );

  return {
    plan:
      input.plan,

    manifest:
      input.manifest,

    state,

    checkpoint:
      null,
  };
}

async function dispositionForPlanEntry(
  input: {
    plan:
      GenesisReplayPlan;

    manifest:
      GenesisSourceManifest;

    planEntry:
      GenesisReplayPlanEntry;

    manifestEntry:
      GenesisSourceManifestEntry;

    admissionAdapter:
      GenesisReplayAdmissionAdapter;
  },
): Promise<
  GenesisReplayCheckpointDisposition
> {
  switch (
    input.planEntry.action
  ) {
    case "ADMIT": {
      const admission =
        await input
          .admissionAdapter
          .admit({
            replayId:
              input.plan.replayId,

            manifestId:
              input.manifest
                .manifestId,

            manifestIndex:
              input.planEntry
                .manifestIndex,

            planEntry:
              input.planEntry,

            manifestEntry:
              input.manifestEntry,
          });

      const evidenceId =
        requireNonEmpty(
          admission.evidenceId,
          "genesis_replay_execution_admission_evidence_id_required",
        );

      return {
        historicalSourceId:
          input.planEntry
            .historicalSourceId,

        disposition:
          "ADMITTED",

        evidenceId,
      };
    }

    case "SKIP_SCOPE": {
      const reason =
        requireNonEmpty(
          input.planEntry.reason ??
            "",
          "genesis_replay_execution_scope_skip_reason_required",
        );

      return {
        historicalSourceId:
          input.planEntry
            .historicalSourceId,

        disposition:
          "SKIPPED",

        reason,
      };
    }

    case "BLOCK":
      throw new Error(
        "genesis_replay_execution_blocked_plan_entry",
      );
  }
}

export async function executeGenesisReplayNext(
  input:
    ExecuteGenesisReplayNextInput,
): Promise<
  GenesisReplayExecutionStepResult
> {
  const {
    execution,
    admissionAdapter,
    occurredAt,
  } = input;

  assertGenesisReplayPlanReady(
    execution.plan,
  );

  assertPlanMatchesManifest(
    execution.plan,
    execution.manifest,
  );

  if (
    execution.state.status ===
      "completed"
  ) {
    return {
      execution,

      disposition:
        null,
    };
  }

  const index =
    currentManifestIndex(
      execution.state,
    );

  const planEntry =
    execution.plan.entries[
      index
    ];

  const manifestEntry =
    execution.manifest.entries[
      index
    ];

  if (
    !planEntry ||
    !manifestEntry
  ) {
    throw new Error(
      "genesis_replay_execution_current_entry_missing",
    );
  }

  assertPlanEntryMatchesManifestEntry(
    planEntry,
    manifestEntry,
    index,
  );

  const disposition =
    await dispositionForPlanEntry({
      plan:
        execution.plan,

      manifest:
        execution.manifest,

      planEntry,

      manifestEntry,

      admissionAdapter,
    });

  const state =
    advanceGenesisReplayState({
      state:
        execution.state,

      manifest:
        execution.manifest,

      disposition,

      occurredAt,
    });

  const checkpoint =
    checkpointForState({
      replayId:
        execution.plan.replayId,

      manifest:
        execution.manifest,

      state,

      checkpointCreatedAt:
        occurredAt,
    });

  return {
    execution: {
      ...execution,

      state,

      checkpoint,
    },

    disposition,
  };
}
