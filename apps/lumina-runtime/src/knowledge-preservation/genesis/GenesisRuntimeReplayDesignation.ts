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
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisReplayInventory,
} from "./GenesisReplayInventoryService.js";

import type {
  GenesisReplayStatusSnapshot,
} from "./GenesisReplayStatusService.js";


export const GENESIS_RUNTIME_REPLAY_DESIGNATION_VERSION =
  "genesis-runtime-replay-designation:v1" as const;


export interface GenesisRuntimeReplayDesignation {
  designationVersion:
    typeof GENESIS_RUNTIME_REPLAY_DESIGNATION_VERSION;

  replayId:
    GenesisReplayId;

  designatedBy:
    string;

  designatedAt:
    number;

  reason:
    string;
}


export type GenesisRuntimeReplaySelectionState =
  | "UNSET"
  | "SELECTED"
  | "INVALID";


export type GenesisRuntimeReplaySelectionReason =
  | "NO_DESIGNATION"
  | "DESIGNATED_REPLAY_SELECTED"
  | "DESIGNATED_REPLAY_NOT_FOUND"
  | "DESIGNATED_REPLAY_NOT_ELIGIBLE";


export interface GenesisRuntimeReplaySelection {
  state:
    GenesisRuntimeReplaySelectionState;

  replayId:
    GenesisReplayId | null;

  designation:
    GenesisRuntimeReplayDesignation | null;

  reason:
    GenesisRuntimeReplaySelectionReason;
}


export interface GenesisRuntimeReplayDesignationStore {
  load():
    GenesisRuntimeReplayDesignation | null;

  save(
    designation:
      GenesisRuntimeReplayDesignation,
  ): void;
}


export interface FileGenesisRuntimeReplayDesignationStoreOptions {
  storageRoot?:
    string;
}


const REPLAY_ID_PATTERN =
  /^genesis-replay:[a-f0-9]{64}$/;


function required(
  value:
    string,

  field:
    string,
): string {
  const normalized =
    value.trim();

  if (
    !normalized
  ) {
    throw new Error(
      `genesis_runtime_replay_designation_${field}_required`,
    );
  }

  return normalized;
}


function validateDesignation(
  value:
    unknown,
): GenesisRuntimeReplayDesignation {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "genesis_runtime_replay_designation_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.designationVersion !==
      GENESIS_RUNTIME_REPLAY_DESIGNATION_VERSION
  ) {
    throw new Error(
      "genesis_runtime_replay_designation_version_invalid",
    );
  }

  if (
    typeof record.replayId !==
      "string" ||
    !REPLAY_ID_PATTERN.test(
      record.replayId,
    )
  ) {
    throw new Error(
      "genesis_runtime_replay_designation_replay_id_invalid",
    );
  }

  if (
    typeof record.designatedBy !==
      "string"
  ) {
    throw new Error(
      "genesis_runtime_replay_designation_designated_by_required",
    );
  }

  const designatedBy =
    required(
      record.designatedBy,
      "designated_by",
    );

  if (
    typeof record.designatedAt !==
      "number" ||
    !Number.isFinite(
      record.designatedAt,
    ) ||
    record.designatedAt <=
      0
  ) {
    throw new Error(
      "genesis_runtime_replay_designation_designated_at_invalid",
    );
  }

  if (
    typeof record.reason !==
      "string"
  ) {
    throw new Error(
      "genesis_runtime_replay_designation_reason_required",
    );
  }

  const reason =
    required(
      record.reason,
      "reason",
    );

  return {
    designationVersion:
      GENESIS_RUNTIME_REPLAY_DESIGNATION_VERSION,

    replayId:
      record.replayId as
        GenesisReplayId,

    designatedBy,

    designatedAt:
      record.designatedAt,

    reason,
  };
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


export class FileGenesisRuntimeReplayDesignationStore
implements GenesisRuntimeReplayDesignationStore {
  readonly storageRoot:
    string;

  readonly designationFile:
    string;


  constructor(
    options:
      FileGenesisRuntimeReplayDesignationStoreOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "genesis",
        ),
      );

    this.designationFile =
      path.join(
        this.storageRoot,
        "runtime-replay-designation.json",
      );
  }


  load():
    GenesisRuntimeReplayDesignation | null {
    let raw:
      string;

    try {
      raw =
        readFileSync(
          this.designationFile,
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

    let parsed:
      unknown;

    try {
      parsed =
        JSON.parse(
          raw,
        );
    } catch (
      error
    ) {
      if (
        error instanceof
        SyntaxError
      ) {
        throw new Error(
          "genesis_runtime_replay_designation_corrupt_json",
          {
            cause:
              error,
          },
        );
      }

      throw error;
    }

    return validateDesignation(
      parsed,
    );
  }


  save(
    designation:
      GenesisRuntimeReplayDesignation,
  ): void {
    const validated =
      validateDesignation(
        designation,
      );

    atomicWriteJson(
      this.designationFile,
      validated,
    );
  }
}


export function isGenesisRuntimeReplayEligible(
  replay:
    GenesisReplayStatusSnapshot,
): boolean {
  const progress =
    replay.progress;

  if (
    !progress
  ) {
    return false;
  }

  const countsReconcile =
    progress.completedSources ===
    (
      progress.admittedSources +
      progress.skippedSources +
      progress.blockedSources
    );

  const exactComplete =
    countsReconcile &&
    progress.completedSources ===
      progress.totalSources &&
    progress.blockedSources ===
      0;

  return (
    replay.found ===
      true &&
    replay.manifestPresent ===
      true &&
    replay.manifestReadiness ===
      "READY" &&
    replay.manifestErrors ===
      0 &&
    replay.executionPresent ===
      true &&
    replay.executionStatus ===
      "completed" &&
    replay.corpusStatus ===
      "COMPLETE" &&
    replay.runnerOutcome ===
      "COMPLETED" &&
    exactComplete
  );
}


export function resolveGenesisRuntimeReplaySelection(
  input: {
    designationStore:
      Pick<
        GenesisRuntimeReplayDesignationStore,
        "load"
      >;

    inventory:
      GenesisReplayInventory;
  },
): GenesisRuntimeReplaySelection {
  const designation =
    input.designationStore
      .load();

  if (
    !designation
  ) {
    return {
      state:
        "UNSET",

      replayId:
        null,

      designation:
        null,

      reason:
        "NO_DESIGNATION",
    };
  }

  const replay =
    input.inventory
      .replays
      .find(
        candidate =>
          candidate.replayId ===
          designation.replayId,
      );

  if (
    !replay
  ) {
    return {
      state:
        "INVALID",

      replayId:
        null,

      designation,

      reason:
        "DESIGNATED_REPLAY_NOT_FOUND",
    };
  }

  if (
    !isGenesisRuntimeReplayEligible(
      replay,
    )
  ) {
    return {
      state:
        "INVALID",

      replayId:
        null,

      designation,

      reason:
        "DESIGNATED_REPLAY_NOT_ELIGIBLE",
    };
  }

  return {
    state:
      "SELECTED",

    replayId:
      designation.replayId,

    designation,

    reason:
      "DESIGNATED_REPLAY_SELECTED",
  };
}
