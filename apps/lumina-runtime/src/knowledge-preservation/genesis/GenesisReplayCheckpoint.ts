import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisSourceManifest,
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

import type {
  HistoricalSourceId,
} from "./HistoricalSource.js";

export type GenesisReplayDisposition =
  | "ADMITTED"
  | "SKIPPED"
  | "BLOCKED";

export interface GenesisReplayCheckpointDisposition {
  historicalSourceId:
    HistoricalSourceId;

  disposition:
    GenesisReplayDisposition;

  evidenceId?:
    string;

  reason?:
    string;
}

export interface GenesisReplayCheckpointSourceSnapshot {
  historicalSourceId:
    HistoricalSourceId;

  sourceChecksum:
    string;
}

export interface GenesisReplayCheckpoint {
  replayId:
    GenesisReplayId;

  manifestId:
    string;

  replayContractVersion:
    string;

  lastCompletedHistoricalSourceId:
    HistoricalSourceId;

  lastCompletedManifestIndex:
    number;

  admittedEvidenceIds:
    readonly string[];

  skippedSourceIds:
    readonly HistoricalSourceId[];

  blockedSourceIds:
    readonly HistoricalSourceId[];

  dispositions:
    readonly GenesisReplayCheckpointDisposition[];

  completedSourceSnapshots:
    readonly GenesisReplayCheckpointSourceSnapshot[];

  checkpointCreatedAt:
    number;
}

export interface CreateGenesisReplayCheckpointInput {
  replayId:
    GenesisReplayId;

  manifest:
    GenesisSourceManifest;

  replayContractVersion:
    string;

  lastCompletedManifestIndex:
    number;

  dispositions:
    readonly GenesisReplayCheckpointDisposition[];

  checkpointCreatedAt?:
    number;
}

export interface ValidateGenesisReplayResumeInput {
  checkpoint:
    GenesisReplayCheckpoint;

  replayId:
    GenesisReplayId;

  manifest:
    GenesisSourceManifest;

  replayContractVersion:
    string;
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

function entryAt(
  manifest:
    GenesisSourceManifest,

  index:
    number,
): GenesisSourceManifestEntry {
  if (
    !Number.isInteger(
      index,
    ) ||
    index <
      0 ||
    index >=
      manifest.entries.length
  ) {
    throw new Error(
      "genesis_replay_checkpoint_manifest_index_invalid",
    );
  }

  return manifest.entries[
    index
  ];
}

function dispositionBySourceId(
  dispositions:
    readonly GenesisReplayCheckpointDisposition[],
): Map<
  HistoricalSourceId,
  GenesisReplayCheckpointDisposition
> {
  const bySource =
    new Map<
      HistoricalSourceId,
      GenesisReplayCheckpointDisposition
    >();

  for (
    const disposition
    of dispositions
  ) {
    if (
      bySource.has(
        disposition.historicalSourceId,
      )
    ) {
      throw new Error(
        "genesis_replay_checkpoint_duplicate_source_disposition",
      );
    }

    bySource.set(
      disposition.historicalSourceId,
      disposition,
    );
  }

  return bySource;
}

function assertTerminalDisposition(
  disposition:
    GenesisReplayCheckpointDisposition,
): void {
  if (
    disposition.disposition ===
      "ADMITTED" &&
    !disposition.evidenceId?.trim()
  ) {
    throw new Error(
      "genesis_replay_checkpoint_admitted_evidence_id_required",
    );
  }

  if (
    disposition.disposition ===
      "SKIPPED" &&
    !disposition.reason?.trim()
  ) {
    throw new Error(
      "genesis_replay_checkpoint_skipped_reason_required",
    );
  }

  if (
    disposition.disposition ===
      "BLOCKED" &&
    !disposition.reason?.trim()
  ) {
    throw new Error(
      "genesis_replay_checkpoint_blocked_reason_required",
    );
  }
}

function assertCheckpointPrefixCoverage(
  manifest:
    GenesisSourceManifest,

  lastCompletedManifestIndex:
    number,

  dispositions:
    readonly GenesisReplayCheckpointDisposition[],
): void {
  const bySource =
    dispositionBySourceId(
      dispositions,
    );

  for (
    let index = 0;
    index <=
      lastCompletedManifestIndex;
    index +=
      1
  ) {
    const sourceId =
      manifest.entries[
        index
      ].historicalSourceId;

    const disposition =
      bySource.get(
        sourceId,
      );

    if (
      !disposition
    ) {
      throw new Error(
        "genesis_replay_checkpoint_prefix_incomplete",
      );
    }

    assertTerminalDisposition(
      disposition,
    );
  }

  for (
    const disposition
    of dispositions
  ) {
    const manifestIndex =
      manifest.entries
        .findIndex(
          (
            entry,
          ) =>
            entry.historicalSourceId ===
            disposition.historicalSourceId,
        );

    if (
      manifestIndex ===
        -1
    ) {
      throw new Error(
        "genesis_replay_checkpoint_source_not_in_manifest",
      );
    }

    if (
      manifestIndex >
      lastCompletedManifestIndex
    ) {
      throw new Error(
        "genesis_replay_checkpoint_disposition_beyond_checkpoint",
      );
    }
  }
}

function assertReplayContractMatches(
  manifest:
    GenesisSourceManifest,

  replayContractVersion:
    string,
): string {
  const normalized =
    requireNonEmpty(
      replayContractVersion,
      "genesis_replay_checkpoint_contract_version_required",
    );

  if (
    normalized !==
    manifest.replayContractVersion.trim()
  ) {
    throw new Error(
      "genesis_replay_checkpoint_contract_version_mismatch",
    );
  }

  return normalized;
}

export function createGenesisReplayCheckpoint(
  input:
    CreateGenesisReplayCheckpointInput,
): GenesisReplayCheckpoint {
  const replayContractVersion =
    assertReplayContractMatches(
      input.manifest,
      input.replayContractVersion,
    );

  const completedEntry =
    entryAt(
      input.manifest,
      input.lastCompletedManifestIndex,
    );

  assertCheckpointPrefixCoverage(
    input.manifest,
    input.lastCompletedManifestIndex,
    input.dispositions,
  );

  const admittedEvidenceIds:
    string[] =
      [];

  const skippedSourceIds:
    HistoricalSourceId[] =
      [];

  const blockedSourceIds:
    HistoricalSourceId[] =
      [];

  for (
    const disposition
    of input.dispositions
  ) {
    assertTerminalDisposition(
      disposition,
    );

    if (
      disposition.disposition ===
      "ADMITTED"
    ) {
      admittedEvidenceIds.push(
        disposition.evidenceId!.trim(),
      );
    }

    if (
      disposition.disposition ===
      "SKIPPED"
    ) {
      skippedSourceIds.push(
        disposition.historicalSourceId,
      );
    }

    if (
      disposition.disposition ===
      "BLOCKED"
    ) {
      blockedSourceIds.push(
        disposition.historicalSourceId,
      );
    }
  }

  const completedSourceSnapshots:
    GenesisReplayCheckpointSourceSnapshot[] =
      [];

  for (
    let index = 0;
    index <=
      input.lastCompletedManifestIndex;
    index +=
      1
  ) {
    const manifestEntry =
      input.manifest.entries[
        index
      ];

    completedSourceSnapshots.push({
      historicalSourceId:
        manifestEntry.historicalSourceId,

      sourceChecksum:
        manifestEntry.sourceChecksum,
    });
  }

  return {
    replayId:
      input.replayId,

    manifestId:
      input.manifest.manifestId,

    replayContractVersion,

    lastCompletedHistoricalSourceId:
      completedEntry.historicalSourceId,

    lastCompletedManifestIndex:
      input.lastCompletedManifestIndex,

    admittedEvidenceIds,

    skippedSourceIds,

    blockedSourceIds,

    dispositions: [
      ...input.dispositions,
    ],

    completedSourceSnapshots,

    checkpointCreatedAt:
      input.checkpointCreatedAt ??
      Date.now(),
  };
}

function assertManifestPrefixUnchanged(
  checkpoint:
    GenesisReplayCheckpoint,

  manifest:
    GenesisSourceManifest,
): void {
  if (
    checkpoint
      .completedSourceSnapshots
      .length !==
    checkpoint
      .lastCompletedManifestIndex +
      1
  ) {
    throw new Error(
      "genesis_replay_checkpoint_snapshot_prefix_invalid",
    );
  }
  entryAt(
    manifest,
    checkpoint.lastCompletedManifestIndex,
  );

  for (
    let index = 0;
    index <=
      checkpoint.lastCompletedManifestIndex;
    index +=
      1
  ) {
    const current =
      manifest.entries[
        index
      ];

    const priorDisposition =
      checkpoint.dispositions.find(
        (
          disposition,
        ) =>
          disposition.historicalSourceId ===
          current.historicalSourceId,
      );

    if (
      !priorDisposition
    ) {
      throw new Error(
        "genesis_replay_checkpoint_prefix_incomplete",
      );
    }

    const snapshot =
      checkpoint
        .completedSourceSnapshots[
          index
        ];

    if (
      snapshot.historicalSourceId !==
      current.historicalSourceId
    ) {
      throw new Error(
        "genesis_replay_checkpoint_source_identity_mismatch",
      );
    }

    if (
      snapshot.sourceChecksum !==
      current.sourceChecksum
    ) {
      throw new Error(
        "genesis_replay_checkpoint_source_checksum_mismatch",
      );
    }
  }

  const currentCompleted =
    manifest.entries[
      checkpoint.lastCompletedManifestIndex
    ];

  if (
    currentCompleted
      .historicalSourceId !==
    checkpoint
      .lastCompletedHistoricalSourceId
  ) {
    throw new Error(
      "genesis_replay_checkpoint_position_mismatch",
    );
  }
}

export function validateGenesisReplayResume(
  input:
    ValidateGenesisReplayResumeInput,
): void {
  const replayContractVersion =
    assertReplayContractMatches(
      input.manifest,
      input.replayContractVersion,
    );

  if (
    input.checkpoint.replayId !==
    input.replayId
  ) {
    throw new Error(
      "genesis_replay_checkpoint_replay_id_mismatch",
    );
  }

  if (
    input.checkpoint.manifestId !==
    input.manifest.manifestId
  ) {
    throw new Error(
      "genesis_replay_checkpoint_manifest_id_mismatch",
    );
  }

  if (
    input.checkpoint
      .replayContractVersion !==
    replayContractVersion
  ) {
    throw new Error(
      "genesis_replay_checkpoint_contract_version_mismatch",
    );
  }

  assertCheckpointPrefixCoverage(
    input.manifest,
    input.checkpoint
      .lastCompletedManifestIndex,
    input.checkpoint.dispositions,
  );

  assertManifestPrefixUnchanged(
    input.checkpoint,
    input.manifest,
  );
}

export function nextGenesisReplayManifestIndex(
  checkpoint:
    GenesisReplayCheckpoint,
): number {
  return (
    checkpoint.lastCompletedManifestIndex +
    1
  );
}
