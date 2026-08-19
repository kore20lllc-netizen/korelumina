import type {
  GenesisReplayAdmissionLink,
  GenesisReplayId,
  GenesisReplayStatusSnapshot,
} from "./genesisReplayReadClient.js";

import type {
  GenesisReplayReadState,
  GenesisReplayReadStateError,
} from "./genesisReplayReadState.js";

export type GenesisReplayViewTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export type GenesisReplayLifecycleLabel =
  | "Manifest only"
  | "Running"
  | "Completed"
  | "Failed"
  | "Unavailable";

export type GenesisReplayLinkageHealth =
  | "none"
  | "healthy"
  | "partial"
  | "ambiguous";

export interface GenesisReplayProgressViewModel {
  available:
    boolean;

  total:
    number;

  completed:
    number;

  remaining:
    number;

  percent:
    number;

  admitted:
    number;

  skipped:
    number;

  rejected:
    number;
}

export interface GenesisReplayRecoveryViewModel {
  eligible:
    boolean;

  reason:
    string;

  label:
    string;

  tone:
    GenesisReplayViewTone;
}

export interface GenesisReplayLinkageViewModel {
  health:
    GenesisReplayLinkageHealth;

  admittedEvidence:
    number;

  linkedEvidence:
    number;

  ambiguousEvidence:
    number;

  unlinkedEvidence:
    number;

  allLinked:
    boolean;

  label:
    string;

  tone:
    GenesisReplayViewTone;
}

export interface GenesisReplayInventoryRowViewModel {
  replayId:
    GenesisReplayId;

  shortReplayId:
    string;

  lifecycle:
    GenesisReplayLifecycleLabel;

  lifecycleTone:
    GenesisReplayViewTone;

  manifestReadiness:
    string;

  manifestSources:
    number;

  executionPresent:
    boolean;

  progress:
    GenesisReplayProgressViewModel;

  recovery:
    GenesisReplayRecoveryViewModel;

  linkage:
    GenesisReplayLinkageViewModel;

  selected:
    boolean;
}

export interface GenesisReplaySelectedViewModel {
  replayId:
    GenesisReplayId;

  shortReplayId:
    string;

  lifecycle:
    GenesisReplayLifecycleLabel;

  lifecycleTone:
    GenesisReplayViewTone;

  manifestId:
    string | null;

  manifestReadiness:
    string;

  manifestErrors:
    number;

  totalManifestSources:
    number;

  currentManifestIndex:
    number | null;

  currentHistoricalSourceId:
    string | null;

  runnerOutcome:
    string | null;

  runnerFailure:
    string | null;

  progress:
    GenesisReplayProgressViewModel;

  recovery:
    GenesisReplayRecoveryViewModel;

  linkage:
    GenesisReplayLinkageViewModel;
}

export interface GenesisReplayErrorViewModel {
  scope:
    "inventory" |
    "selection";

  message:
    string;

  code:
    string | null;

  status:
    number | null;

  label:
    string;

  tone:
    "danger";
}

export interface GenesisReplayReadViewModel {
  inventoryLoading:
    boolean;

  inventoryLoaded:
    boolean;

  inventoryEmpty:
    boolean;

  inventoryCount:
    number;

  rows:
    readonly GenesisReplayInventoryRowViewModel[];

  selectionLoading:
    boolean;

  selectedReplayId:
    GenesisReplayId | null;

  selected:
    GenesisReplaySelectedViewModel | null;

  error:
    GenesisReplayErrorViewModel | null;
}

function shortReplayId(
  replayId:
    GenesisReplayId,
): string {
  const digest =
    replayId.slice(
      "genesis-replay:".length,
    );

  return `${digest.slice(
    0,
    8,
  )}…${digest.slice(
    -8,
  )}`;
}

function lifecycle(
  replay:
    GenesisReplayStatusSnapshot,
): {
  label:
    GenesisReplayLifecycleLabel;

  tone:
    GenesisReplayViewTone;
} {
  if (
    !replay.manifestPresent &&
    !replay.executionPresent
  ) {
    return {
      label:
        "Unavailable",

      tone:
        "neutral",
    };
  }

  if (
    replay.manifestPresent &&
    !replay.executionPresent
  ) {
    return {
      label:
        "Manifest only",

      tone:
        "info",
    };
  }

  switch (
    replay.executionStatus
  ) {
    case "running":
      return {
        label:
          "Running",

        tone:
          "info",
      };

    case "completed":
      return {
        label:
          "Completed",

        tone:
          "success",
      };

    case "failed":
      return {
        label:
          "Failed",

        tone:
          "danger",
      };

    default:
      return {
        label:
          "Unavailable",

        tone:
          "neutral",
      };
  }
}

function progressView(
  replay:
    GenesisReplayStatusSnapshot,
): GenesisReplayProgressViewModel {
  const progress =
    replay.progress;

  if (
    progress ===
      null
  ) {
    return {
      available:
        false,

      total:
        replay.totalManifestSources,

      completed:
        0,

      remaining:
        replay.totalManifestSources,

      percent:
        0,

      admitted:
        0,

      skipped:
        0,

      rejected:
        0,
    };
  }

  const total =
    Math.max(
      0,
      progress.totalSources,
    );

  const completed =
    Math.max(
      0,
      Math.min(
        progress.completedSources,
        total,
      ),
    );

  const remaining =
    Math.max(
      0,
      total -
      completed,
    );

  const percent =
    total ===
      0
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (
                completed /
                total
              ) *
              100,
            ),
          ),
        );

  return {
    available:
      true,

    total,

    completed,

    remaining,

    percent,

    admitted:
      progress.admittedSources,

    skipped:
      progress.skippedSources,

    rejected:
      progress.rejectedSources,
  };
}

function recoveryView(
  replay:
    GenesisReplayStatusSnapshot,
): GenesisReplayRecoveryViewModel {
  const reason =
    replay.recovery.reason;

  if (
    replay.recovery.eligible
  ) {
    return {
      eligible:
        true,

      reason,

      label:
        "Recovery eligible",

      tone:
        "warning",
    };
  }

  switch (
    reason
  ) {
    case "ALREADY_COMPLETED":
      return {
        eligible:
          false,

        reason,

        label:
          "Recovery not required",

        tone:
          "success",
      };

    case "EXECUTION_NOT_FOUND":
      return {
        eligible:
          false,

        reason,

        label:
          "No execution to recover",

        tone:
          "neutral",
      };

    case "REPLAY_NOT_FOUND":
      return {
        eligible:
          false,

        reason,

        label:
          "Replay unavailable",

        tone:
          "danger",
      };

    default:
      return {
        eligible:
          false,

        reason,

        label:
          "Recovery unavailable",

        tone:
          "neutral",
      };
  }
}

function linkageCounts(
  links:
    readonly GenesisReplayAdmissionLink[],
) {
  let linked =
    0;

  let ambiguous =
    0;

  let unlinked =
    0;

  for (
    const link
    of links
  ) {
    if (
      link.ambiguous
    ) {
      ambiguous +=
        1;

      continue;
    }

    if (
      link.linked
    ) {
      linked +=
        1;

      continue;
    }

    unlinked +=
      1;
  }

  return {
    linked,
    ambiguous,
    unlinked,
  };
}

function linkageView(
  replay:
    GenesisReplayStatusSnapshot,
): GenesisReplayLinkageViewModel {
  const admittedEvidence =
    replay
      .admittedEvidenceIds
      .length;

  const raw =
    linkageCounts(
      replay.admissionLinks,
    );

  const ambiguous =
    Math.min(
      raw.ambiguous,
      admittedEvidence,
    );

  const linked =
    Math.min(
      raw.linked,
      Math.max(
        0,
        admittedEvidence -
        ambiguous,
      ),
    );

  const unlinked =
    Math.min(
      raw.unlinked,
      Math.max(
        0,
        admittedEvidence -
        ambiguous -
        linked,
      ),
    );

  if (
    admittedEvidence ===
      0
  ) {
    return {
      health:
        "none",

      admittedEvidence:
        0,

      linkedEvidence:
        0,

      ambiguousEvidence:
        0,

      unlinkedEvidence:
        0,

      allLinked:
        replay
          .allAdmittedEvidenceLinked,

      label:
        "No admitted Evidence",

      tone:
        "neutral",
    };
  }

  if (
    ambiguous >
      0
  ) {
    return {
      health:
        "ambiguous",

      admittedEvidence,

      linkedEvidence:
        linked,

      ambiguousEvidence:
        ambiguous,

      unlinkedEvidence:
        unlinked,

      allLinked:
        false,

      label:
        `${ambiguous} ambiguous linkage${
          ambiguous ===
            1
            ? ""
            : "s"
        }`,

      tone:
        "danger",
    };
  }

  if (
    replay
      .allAdmittedEvidenceLinked
  ) {
    return {
      health:
        "healthy",

      admittedEvidence,

      linkedEvidence:
        linked,

      ambiguousEvidence:
        0,

      unlinkedEvidence:
        0,

      allLinked:
        true,

      label:
        "All admitted Evidence linked",

      tone:
        "success",
    };
  }

  return {
    health:
      "partial",

    admittedEvidence,

    linkedEvidence:
      linked,

    ambiguousEvidence:
      0,

    unlinkedEvidence:
      unlinked,

    allLinked:
      false,

    label:
      `${unlinked} Evidence linkage${
        unlinked ===
          1
          ? ""
          : "s"
      } unresolved`,

    tone:
      "warning",
  };
}

function inventoryRow(
  replay:
    GenesisReplayStatusSnapshot,

  selectedReplayId:
    GenesisReplayId |
    null,
): GenesisReplayInventoryRowViewModel {
  const lifecycleView =
    lifecycle(
      replay,
    );

  return {
    replayId:
      replay.replayId,

    shortReplayId:
      shortReplayId(
        replay.replayId,
      ),

    lifecycle:
      lifecycleView.label,

    lifecycleTone:
      lifecycleView.tone,

    manifestReadiness:
      replay.manifestReadiness ??
      "Unavailable",

    manifestSources:
      replay.totalManifestSources,

    executionPresent:
      replay.executionPresent,

    progress:
      progressView(
        replay,
      ),

    recovery:
      recoveryView(
        replay,
      ),

    linkage:
      linkageView(
        replay,
      ),

    selected:
      selectedReplayId ===
      replay.replayId,
  };
}

function selectedView(
  replay:
    GenesisReplayStatusSnapshot,
): GenesisReplaySelectedViewModel {
  const lifecycleView =
    lifecycle(
      replay,
    );

  return {
    replayId:
      replay.replayId,

    shortReplayId:
      shortReplayId(
        replay.replayId,
      ),

    lifecycle:
      lifecycleView.label,

    lifecycleTone:
      lifecycleView.tone,

    manifestId:
      replay.manifestId,

    manifestReadiness:
      replay.manifestReadiness ??
      "Unavailable",

    manifestErrors:
      replay.manifestErrors,

    totalManifestSources:
      replay.totalManifestSources,

    currentManifestIndex:
      replay.currentManifestIndex,

    currentHistoricalSourceId:
      replay.currentHistoricalSourceId,

    runnerOutcome:
      replay.runnerOutcome,

    runnerFailure:
      replay.runnerFailure
        ?.message ??
      null,

    progress:
      progressView(
        replay,
      ),

    recovery:
      recoveryView(
        replay,
      ),

    linkage:
      linkageView(
        replay,
      ),
  };
}

function errorView(
  error:
    GenesisReplayReadStateError |
    null,
): GenesisReplayErrorViewModel |
  null {
  if (
    error ===
      null
  ) {
    return null;
  }

  return {
    scope:
      error.scope,

    message:
      error.message,

    code:
      error.code,

    status:
      error.status,

    label:
      error.scope ===
        "inventory"
        ? "Replay inventory unavailable"
        : "Replay inspection unavailable",

    tone:
      "danger",
  };
}

export function createGenesisReplayReadViewModel(
  state:
    GenesisReplayReadState,
): GenesisReplayReadViewModel {
  const inventory =
    state.inventory;

  const rows =
    inventory?.replays
      .map(
        (
          replay,
        ) =>
          inventoryRow(
            replay,
            state.selectedReplayId,
          ),
      ) ??
    [];

  return {
    inventoryLoading:
      state.inventoryLoading,

    inventoryLoaded:
      state.inventoryLoaded,

    inventoryEmpty:
      state.inventoryLoaded &&
      !state.inventoryLoading &&
      (
        inventory ===
          null ||
        inventory.total ===
          0
      ),

    inventoryCount:
      inventory?.total ??
      0,

    rows,

    selectionLoading:
      state.selectionLoading,

    selectedReplayId:
      state.selectedReplayId,

    selected:
      state.selectedReplay ===
        null
        ? null
        : selectedView(
            state.selectedReplay,
          ),

    error:
      errorView(
        state.error,
      ),
  };
}
