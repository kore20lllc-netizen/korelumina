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

import {
  isNodeTestProcess,
  isolatedTestStorageRoot,
} from "../storage/resolveKnowledgeStorageRoot.js";

import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisHistoricalCorrelationState,
} from "./GenesisHistoricalCorrelation.js";

import {
  integrateGenesisHistoricalCorrelationRevision,
} from "./GenesisHistoricalCorrelationRevisionIntegrator.js";

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

/*
 * MS-2026-0010 (F-38): a learning replay starts from its base replay's
 * correlation and adds its own commits. Saving the whole result again
 * stored about 11 MB per Learn now. A revision record stores only the
 * base replay and what this replay materialized; loading integrates them
 * again, which reproduces the saved correlation exactly.
 */
export const GENESIS_HISTORICAL_CORRELATION_REVISION_FORMAT =
  "genesis-historical-correlation-revision:v1";

export interface GenesisHistoricalCorrelationRevisionRecord {
  format:
    typeof GENESIS_HISTORICAL_CORRELATION_REVISION_FORMAT;

  baseReplayId:
    GenesisReplayId;

  additions:
    GenesisHistoricalCorrelationState;
}

export interface GenesisHistoricalCorrelationSaveOptions {
  /*
   * The state is integrateGenesisHistoricalCorrelationRevision(base,
   * additions). The store keeps a revision record only when loading it
   * reproduces the state exactly; otherwise it keeps the full state.
   */
  revisionOf?: {
    baseReplayId:
      GenesisReplayId;

    additions:
      GenesisHistoricalCorrelationState;
  };
}

export interface GenesisHistoricalCorrelationPersistenceStore {
  save(
    replayId:
      GenesisReplayId,

    state:
      GenesisHistoricalCorrelationState,

    options?:
      GenesisHistoricalCorrelationSaveOptions,
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

function readRecord(
  file:
    string,
):
  object |
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

  return value;
}

function validState(
  value:
    unknown,
): GenesisHistoricalCorrelationState {
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

function isRevisionRecord(
  value:
    object,
): value is GenesisHistoricalCorrelationRevisionRecord {
  return (
    (value as { format?: unknown }).format ===
    GENESIS_HISTORICAL_CORRELATION_REVISION_FORMAT
  );
}

/* Key-order independent JSON, for the exact-reproduction check. */
function canonicalJson(
  value:
    unknown,
): string {
  return JSON.stringify(
    value,
    (
      _key,
      item,
    ) =>
      item &&
      typeof item ===
        "object" &&
      !Array.isArray(
        item,
      )
        ? Object.fromEntries(
            Object.entries(
              item as Record<string, unknown>,
            ).sort(
              (
                [left],
                [right],
              ) =>
                left.localeCompare(
                  right,
                ),
            ),
          )
        : item,
  );
}

const MAX_REVISION_DEPTH =
  64;

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
    /*
     * MS-2026-0008: a test that configures no root gets the F-25
     * isolated temporary root. Before this, the replay orchestrator's
     * correlation save rewrote fixture correlations in the real
     * runtime-data on every test run.
     */
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        (isNodeTestProcess()
          ? isolatedTestStorageRoot(
              path.join(
                "genesis",
                "historical-correlation",
              ),
            )
          : path.join(
              getRuntimeDataRoot(),
              "genesis",
              "historical-correlation",
            )),
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

    options:
      GenesisHistoricalCorrelationSaveOptions = {},
  ): void {
    const file =
      this.pathsFor(
        replayId,
      ).correlationFile;

    const revision =
      options.revisionOf;

    if (
      revision &&
      revision.baseReplayId !==
        replayId
    ) {
      const record:
        GenesisHistoricalCorrelationRevisionRecord = {
          format:
            GENESIS_HISTORICAL_CORRELATION_REVISION_FORMAT,

          baseReplayId:
            revision.baseReplayId,

          additions:
            revision.additions,
        };

      atomicWriteJson(
        file,
        record,
      );

      let reproduced:
        GenesisHistoricalCorrelationState |
        null =
          null;

      try {
        reproduced =
          this.load(
            replayId,
          );
      } catch {
        reproduced =
          null;
      }

      if (
        reproduced &&
        canonicalJson(
          reproduced,
        ) ===
          canonicalJson(
            state,
          )
      ) {
        return;
      }
    }

    atomicWriteJson(
      file,
      state,
    );
  }

  load(
    replayId:
      GenesisReplayId,
  ):
    GenesisHistoricalCorrelationState |
    null {
    return this.loadChain(
      replayId,
      [],
    );
  }

  /* True when the replay's correlation is stored as a revision record. */
  isRevision(
    replayId:
      GenesisReplayId,
  ): boolean {
    const record =
      readRecord(
        this.pathsFor(
          replayId,
        ).correlationFile,
      );

    return Boolean(
      record &&
      isRevisionRecord(
        record,
      ),
    );
  }

  private loadChain(
    replayId:
      GenesisReplayId,

    visited:
      readonly GenesisReplayId[],
  ):
    GenesisHistoricalCorrelationState |
    null {
    const record =
      readRecord(
        this.pathsFor(
          replayId,
        ).correlationFile,
      );

    if (
      !record
    ) {
      return null;
    }

    if (
      !isRevisionRecord(
        record,
      )
    ) {
      return validState(
        record,
      );
    }

    if (
      visited.includes(
        replayId,
      ) ||
      visited.length >=
        MAX_REVISION_DEPTH
    ) {
      throw new Error(
        "genesis_historical_correlation_revision_chain_invalid",
      );
    }

    const base =
      this.loadChain(
        record.baseReplayId,
        [
          ...visited,
          replayId,
        ],
      );

    if (
      !base
    ) {
      /* Never a partial correlation: the base is required. */
      throw new Error(
        "genesis_historical_correlation_revision_base_not_found",
      );
    }

    return integrateGenesisHistoricalCorrelationRevision(
      base,
      validState(
        record.additions,
      ),
    );
  }
}
