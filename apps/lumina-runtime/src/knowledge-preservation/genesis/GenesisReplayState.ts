import type {
  GenesisReplayCheckpointDisposition,
  GenesisReplayDisposition,
} from "./GenesisReplayCheckpoint.js";

import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisSourceManifest,
} from "./GenesisSourceManifest.js";

import type {
  HistoricalSourceId,
} from "./HistoricalSource.js";

export type GenesisReplayExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "blocked"
  | "failed";

export type GenesisCorpusCompletionStatus =
  | "PARTIAL"
  | "COMPLETE"
  | "BLOCKED";

export interface GenesisReplayProgress {
  totalSources:
    number;

  completedSources:
    number;

  admittedSources:
    number;

  skippedSources:
    number;

  blockedSources:
    number;
}

export interface GenesisReplayState {
  replayId:
    GenesisReplayId;

  manifestId:
    string;

  replayContractVersion:
    string;

  status:
    GenesisReplayExecutionStatus;

  corpusStatus:
    GenesisCorpusCompletionStatus;

  currentManifestIndex:
    number | null;

  currentHistoricalSourceId:
    HistoricalSourceId | null;

  lastCompletedManifestIndex:
    number | null;

  dispositions:
    readonly GenesisReplayCheckpointDisposition[];

  progress:
    GenesisReplayProgress;

  startedAt:
    number | null;

  completedAt:
    number | null;

  blockedAt:
    number | null;

  failedAt:
    number | null;

  failureReason:
    string | null;
}

export interface AdvanceGenesisReplayStateInput {
  state:
    GenesisReplayState;

  manifest:
    GenesisSourceManifest;

  disposition:
    GenesisReplayCheckpointDisposition;

  occurredAt:
    number;
}

function countDisposition(
  dispositions:
    readonly GenesisReplayCheckpointDisposition[],

  disposition:
    GenesisReplayDisposition,
): number {
  return dispositions.filter(
    (
      item,
    ) =>
      item.disposition ===
      disposition,
  ).length;
}

function progressFor(
  manifest:
    GenesisSourceManifest,

  dispositions:
    readonly GenesisReplayCheckpointDisposition[],
): GenesisReplayProgress {
  return {
    totalSources:
      manifest.entries.length,

    completedSources:
      dispositions.length,

    admittedSources:
      countDisposition(
        dispositions,
        "ADMITTED",
      ),

    skippedSources:
      countDisposition(
        dispositions,
        "SKIPPED",
      ),

    blockedSources:
      countDisposition(
        dispositions,
        "BLOCKED",
      ),
  };
}

function assertStateMatchesManifest(
  state:
    GenesisReplayState,

  manifest:
    GenesisSourceManifest,
): void {
  if (
    state.manifestId !==
    manifest.manifestId
  ) {
    throw new Error(
      "genesis_replay_state_manifest_id_mismatch",
    );
  }

  if (
    state.replayContractVersion !==
    manifest.replayContractVersion
  ) {
    throw new Error(
      "genesis_replay_state_contract_version_mismatch",
    );
  }
}

function assertDispositionIsTerminal(
  disposition:
    GenesisReplayCheckpointDisposition,
): void {
  if (
    disposition.disposition ===
      "ADMITTED" &&
    !disposition.evidenceId?.trim()
  ) {
    throw new Error(
      "genesis_replay_state_admitted_evidence_id_required",
    );
  }

  if (
    disposition.disposition ===
      "SKIPPED" &&
    !disposition.reason?.trim()
  ) {
    throw new Error(
      "genesis_replay_state_skipped_reason_required",
    );
  }

  if (
    disposition.disposition ===
      "BLOCKED" &&
    !disposition.reason?.trim()
  ) {
    throw new Error(
      "genesis_replay_state_blocked_reason_required",
    );
  }
}

function nextManifestIndex(
  state:
    GenesisReplayState,
): number {
  return (
    state.lastCompletedManifestIndex ===
      null
      ? 0
      : state.lastCompletedManifestIndex +
        1
  );
}

export function createGenesisReplayState(
  input: {
    replayId:
      GenesisReplayId;

    manifest:
      GenesisSourceManifest;
  },
): GenesisReplayState {
  return {
    replayId:
      input.replayId,

    manifestId:
      input.manifest.manifestId,

    replayContractVersion:
      input.manifest.replayContractVersion,

    status:
      "pending",

    corpusStatus:
      "PARTIAL",

    currentManifestIndex:
      null,

    currentHistoricalSourceId:
      null,

    lastCompletedManifestIndex:
      null,

    dispositions:
      [],

    progress:
      progressFor(
        input.manifest,
        [],
      ),

    startedAt:
      null,

    completedAt:
      null,

    blockedAt:
      null,

    failedAt:
      null,

    failureReason:
      null,
  };
}

export function startGenesisReplay(
  state:
    GenesisReplayState,

  manifest:
    GenesisSourceManifest,

  startedAt:
    number,
): GenesisReplayState {
  assertStateMatchesManifest(
    state,
    manifest,
  );

  if (
    state.status !==
    "pending"
  ) {
    throw new Error(
      "genesis_replay_state_start_requires_pending",
    );
  }

  if (
    manifest.entries.length ===
    0
  ) {
    return {
      ...state,

      status:
        "completed",

      corpusStatus:
        "COMPLETE",

      completedAt:
        startedAt,

      progress:
        progressFor(
          manifest,
          [],
        ),
    };
  }

  return {
    ...state,

    status:
      "running",

    currentManifestIndex:
      0,

    currentHistoricalSourceId:
      manifest.entries[0]
        .historicalSourceId,

    startedAt,
  };
}

export function advanceGenesisReplayState(
  input:
    AdvanceGenesisReplayStateInput,
): GenesisReplayState {
  const {
    state,
    manifest,
    disposition,
    occurredAt,
  } = input;

  assertStateMatchesManifest(
    state,
    manifest,
  );

  if (
    state.status !==
    "running"
  ) {
    throw new Error(
      "genesis_replay_state_advance_requires_running",
    );
  }

  assertDispositionIsTerminal(
    disposition,
  );

  const expectedIndex =
    nextManifestIndex(
      state,
    );

  if (
    expectedIndex >=
    manifest.entries.length
  ) {
    throw new Error(
      "genesis_replay_state_manifest_exhausted",
    );
  }

  const expectedSource =
    manifest.entries[
      expectedIndex
    ];

  if (
    disposition.historicalSourceId !==
    expectedSource.historicalSourceId
  ) {
    throw new Error(
      "genesis_replay_state_out_of_order_disposition",
    );
  }

  if (
    state.dispositions.some(
      (
        existing,
      ) =>
        existing.historicalSourceId ===
        disposition.historicalSourceId,
    )
  ) {
    throw new Error(
      "genesis_replay_state_duplicate_disposition",
    );
  }

  const dispositions = [
    ...state.dispositions,
    disposition,
  ];

  const progress =
    progressFor(
      manifest,
      dispositions,
    );

  if (
    disposition.disposition ===
    "BLOCKED"
  ) {
    return {
      ...state,

      status:
        "blocked",

      corpusStatus:
        "BLOCKED",

      currentManifestIndex:
        expectedIndex,

      currentHistoricalSourceId:
        expectedSource
          .historicalSourceId,

      lastCompletedManifestIndex:
        expectedIndex,

      dispositions,

      progress,

      blockedAt:
        occurredAt,
    };
  }

  const nextIndex =
    expectedIndex +
    1;

  if (
    nextIndex ===
    manifest.entries.length
  ) {
    return {
      ...state,

      status:
        "completed",

      corpusStatus:
        "COMPLETE",

      currentManifestIndex:
        null,

      currentHistoricalSourceId:
        null,

      lastCompletedManifestIndex:
        expectedIndex,

      dispositions,

      progress,

      completedAt:
        occurredAt,
    };
  }

  return {
    ...state,

    currentManifestIndex:
      nextIndex,

    currentHistoricalSourceId:
      manifest.entries[
        nextIndex
      ].historicalSourceId,

    lastCompletedManifestIndex:
      expectedIndex,

    dispositions,

    progress,
  };
}

export function failGenesisReplay(
  state:
    GenesisReplayState,

  reason:
    string,

  failedAt:
    number,
): GenesisReplayState {
  if (
    state.status !==
      "running" &&
    state.status !==
      "blocked"
  ) {
    throw new Error(
      "genesis_replay_state_fail_requires_active_replay",
    );
  }

  const normalizedReason =
    reason.trim();

  if (
    !normalizedReason
  ) {
    throw new Error(
      "genesis_replay_state_failure_reason_required",
    );
  }

  return {
    ...state,

    status:
      "failed",

    corpusStatus:
      state.progress
          .blockedSources >
        0
        ? "BLOCKED"
        : "PARTIAL",

    failedAt,

    failureReason:
      normalizedReason,
  };
}

export function genesisReplayCanClaimComplete(
  state:
    GenesisReplayState,

  manifest:
    GenesisSourceManifest,
): boolean {
  assertStateMatchesManifest(
    state,
    manifest,
  );

  return (
    state.status ===
      "completed" &&
    state.corpusStatus ===
      "COMPLETE" &&
    state.progress.completedSources ===
      manifest.entries.length &&
    state.progress.blockedSources ===
      0
  );
}
