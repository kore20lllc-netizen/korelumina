import {
  copyFileSync,
  mkdirSync,
  statSync,
} from "node:fs";

import path from "node:path";

import type {
  GenesisHistoricalCorrelationState,
} from "./GenesisHistoricalCorrelation.js";

import {
  materializeGenesisHistoricalCorrelation,
} from "./GenesisHistoricalCorrelationMaterializer.js";

import type {
  FileGenesisHistoricalCorrelationPersistenceStore,
} from "./GenesisHistoricalCorrelationPersistence.js";

import {
  integrateGenesisHistoricalCorrelationRevision,
} from "./GenesisHistoricalCorrelationRevisionIntegrator.js";

import type {
  GenesisReplayExecution,
} from "./GenesisReplayExecution.js";

import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

/*
 * MS-2026-0010 (F-38): convert full correlation copies already on disk
 * into revision records. A copy is converted only when some earlier
 * replay's correlation, integrated with what this replay materialized,
 * reproduces it exactly; the store checks that again before keeping the
 * record. Protected replays (the designated replay) are never rewritten.
 * Originals are copied to the backup directory before anything changes.
 */

export type GenesisCorrelationCompactionAction =
  | "convert"
  | "already-revision"
  | "protected"
  | "no-execution"
  | "no-base";

export interface GenesisCorrelationCompactionEntry {
  replayId:
    GenesisReplayId;

  action:
    GenesisCorrelationCompactionAction;

  baseReplayId:
    GenesisReplayId |
    null;

  bytesBefore:
    number;

  bytesAfter:
    number;
}

export interface GenesisCorrelationCompactionInput {
  correlations:
    FileGenesisHistoricalCorrelationPersistenceStore;

  /* Every replay that has a stored correlation. */
  replayIds:
    readonly GenesisReplayId[];

  loadExecution(
    replayId:
      GenesisReplayId,
  ):
    GenesisReplayExecution |
    null;

  /* Defaults to the governed materializer; tests supply their own. */
  materialize?(
    execution:
      GenesisReplayExecution,
  ): GenesisHistoricalCorrelationState;

  /* Tried first as a base, and never rewritten. */
  protectedReplayIds:
    readonly GenesisReplayId[];

  /* Required to write; without it nothing is changed. */
  write?: {
    backupDirectory:
      string;
  };
}

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

function fileSize(
  file:
    string,
): number {
  try {
    return statSync(
      file,
    ).size;
  } catch {
    return 0;
  }
}

/* A base can only be one whose sources and events all survive into the copy. */
function couldBeBase(
  base:
    GenesisHistoricalCorrelationState,

  stored:
    GenesisHistoricalCorrelationState,
): boolean {
  if (
    base.sourceReferences.length >
      stored.sourceReferences.length ||
    base.events.length >
      stored.events.length
  ) {
    return false;
  }

  const revisions =
    new Set(
      stored.sourceReferences.map(
        reference =>
          reference.sourceRevisionId,
      ),
    );

  const events =
    new Set(
      stored.events.map(
        event =>
          event.eventId,
      ),
    );

  return (
    base.sourceReferences.every(
      reference =>
        revisions.has(
          reference.sourceRevisionId,
        ),
    ) &&
    base.events.every(
      event =>
        events.has(
          event.eventId,
        ),
    )
  );
}

export function compactGenesisHistoricalCorrelations(
  input:
    GenesisCorrelationCompactionInput,
): GenesisCorrelationCompactionEntry[] {
  const correlations =
    input.correlations;

  const fileOf =
    (
      replayId:
        GenesisReplayId,
    ) =>
      correlations.pathsFor(
        replayId,
      ).correlationFile;

  /* Order by when each copy was written, before anything is rewritten. */
  const writtenAt =
    new Map(
      input.replayIds.map(
        replayId => [
          replayId,
          statSync(
            fileOf(
              replayId,
            ),
          ).mtimeMs,
        ],
      ),
    );

  const protectedIds =
    new Set(
      input.protectedReplayIds,
    );

  const ordered =
    [...input.replayIds].sort(
      (
        left,
        right,
      ) =>
        writtenAt.get(left)! -
        writtenAt.get(right)!,
    );

  const entries:
    GenesisCorrelationCompactionEntry[] =
      [];

  const entry =
    (
      replayId:
        GenesisReplayId,
      action:
        GenesisCorrelationCompactionAction,
      baseReplayId:
        GenesisReplayId |
        null = null,
    ) => {
      const size =
        fileSize(
          fileOf(
            replayId,
          ),
        );

      entries.push({
        replayId,
        action,
        baseReplayId,
        bytesBefore:
          size,
        bytesAfter:
          size,
      });

      return entries[entries.length - 1];
    };

  for (
    const replayId
    of ordered
  ) {
    if (
      protectedIds.has(
        replayId,
      )
    ) {
      entry(
        replayId,
        "protected",
      );

      continue;
    }

    if (
      correlations.isRevision(
        replayId,
      )
    ) {
      entry(
        replayId,
        "already-revision",
      );

      continue;
    }

    const execution =
      input.loadExecution(
        replayId,
      );

    if (
      !execution
    ) {
      entry(
        replayId,
        "no-execution",
      );

      continue;
    }

    const stored =
      correlations.load(
        replayId,
      )!;

    const additions =
      (
        input.materialize ??
        materializeGenesisHistoricalCorrelation
      )(
        execution,
      );

    const target =
      canonicalJson(
        stored,
      );

    /* Protected replays first, then earlier copies, newest first. */
    const candidates =
      [
        ...input.protectedReplayIds.filter(
          candidate =>
            writtenAt.has(
              candidate,
            ),
        ),
        ...ordered
          .filter(
            candidate =>
              !protectedIds.has(
                candidate,
              ) &&
              writtenAt.get(candidate)! <
                writtenAt.get(replayId)!,
          )
          .reverse(),
      ].filter(
        candidate =>
          candidate !==
          replayId,
      );

    let baseReplayId:
      GenesisReplayId |
      null =
        null;

    for (
      const candidate
      of candidates
    ) {
      const base =
        correlations.load(
          candidate,
        );

      if (
        !base ||
        !couldBeBase(
          base,
          stored,
        )
      ) {
        continue;
      }

      if (
        canonicalJson(
          integrateGenesisHistoricalCorrelationRevision(
            base,
            additions,
          ),
        ) ===
        target
      ) {
        baseReplayId =
          candidate;

        break;
      }
    }

    if (
      !baseReplayId
    ) {
      entry(
        replayId,
        "no-base",
      );

      continue;
    }

    const converted =
      entry(
        replayId,
        "convert",
        baseReplayId,
      );

    if (
      !input.write
    ) {
      continue;
    }

    const backup =
      path.join(
        input.write.backupDirectory,
        path.basename(
          path.dirname(
            fileOf(
              replayId,
            ),
          ),
        ),
      );

    mkdirSync(
      backup,
      {
        recursive:
          true,
      },
    );

    copyFileSync(
      fileOf(
        replayId,
      ),
      path.join(
        backup,
        "correlation.json",
      ),
    );

    correlations.save(
      replayId,
      stored,
      {
        revisionOf: {
          baseReplayId,
          additions,
        },
      },
    );

    if (
      !correlations.isRevision(
        replayId,
      ) ||
      canonicalJson(
        correlations.load(
          replayId,
        ),
      ) !==
        target
    ) {
      throw new Error(
        `genesis_correlation_compaction_not_reproduced:${replayId}`,
      );
    }

    converted.bytesAfter =
      fileSize(
        fileOf(
          replayId,
        ),
      );
  }

  return entries;
}
