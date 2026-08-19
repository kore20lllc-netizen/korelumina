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
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisHistoricalCorrelationState,
} from "./GenesisHistoricalCorrelation.js";

export interface GenesisHistoricalCorrelationPersistenceOptions {
  storageRoot?:
    string;
}

export interface GenesisHistoricalCorrelationPersistencePaths {
  replayDirectory:
    string;

  correlationFile:
    string;
}

export interface GenesisHistoricalCorrelationPersistenceStore {
  save(
    replayId:
      GenesisReplayId,

    state:
      GenesisHistoricalCorrelationState,
  ): void;

  load(
    replayId:
      GenesisReplayId,
  ):
    GenesisHistoricalCorrelationState |
    null;
}

function storageKey(
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
      "genesis_historical_correlation_path_escape",
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

function readJson(
  file:
    string,
):
  GenesisHistoricalCorrelationState |
  null {
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

  let value:
    unknown;

  try {
    value =
      JSON.parse(
        content,
      );
  } catch (
    error
  ) {
    throw new Error(
      "genesis_historical_correlation_corrupt_json",
      {
        cause:
          error,
      },
    );
  }

  if (
    !value ||
    typeof value !==
      "object"
  ) {
    throw new Error(
      "genesis_historical_correlation_invalid_state",
    );
  }

  const record =
    value as Partial<
      GenesisHistoricalCorrelationState
    >;

  if (
    !Array.isArray(
      record.sourceReferences,
    ) ||
    !Array.isArray(
      record.events,
    ) ||
    !Array.isArray(
      record.relationships,
    ) ||
    !Array.isArray(
      record.episodes,
    )
  ) {
    throw new Error(
      "genesis_historical_correlation_invalid_state",
    );
  }

  return record as
    GenesisHistoricalCorrelationState;
}

export class FileGenesisHistoricalCorrelationPersistenceStore
  implements
    GenesisHistoricalCorrelationPersistenceStore
{
  readonly storageRoot:
    string;

  constructor(
    options:
      GenesisHistoricalCorrelationPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "genesis",
          "historical-correlation",
        ),
      );
  }

  pathsFor(
    replayId:
      GenesisReplayId,
  ): GenesisHistoricalCorrelationPersistencePaths {
    const replayDirectory =
      path.join(
        this.storageRoot,
        storageKey(
          replayId,
        ),
      );

    assertInsideRoot(
      this.storageRoot,
      replayDirectory,
    );

    return {
      replayDirectory,

      correlationFile:
        path.join(
          replayDirectory,
          "correlation.json",
        ),
    };
  }

  save(
    replayId:
      GenesisReplayId,

    state:
      GenesisHistoricalCorrelationState,
  ): void {
    atomicWriteJson(
      this.pathsFor(
        replayId,
      ).correlationFile,
      state,
    );
  }

  load(
    replayId:
      GenesisReplayId,
  ):
    GenesisHistoricalCorrelationState |
    null {
    return readJson(
      this.pathsFor(
        replayId,
      ).correlationFile,
    );
  }
}
