import assert from "node:assert/strict";
import test from "node:test";

import {
  existsSync,
  mkdtempSync,
  readFileSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import {
  compactGenesisHistoricalCorrelations,
} from "../GenesisHistoricalCorrelationCompaction.js";

import {
  FileGenesisHistoricalCorrelationPersistenceStore,
} from "../GenesisHistoricalCorrelationPersistence.js";

import {
  integrateGenesisHistoricalCorrelationRevision,
} from "../GenesisHistoricalCorrelationRevisionIntegrator.js";

import type {
  GenesisHistoricalCorrelationState,
} from "../GenesisHistoricalCorrelation.js";

import type {
  GenesisReplayExecution,
} from "../GenesisReplayExecution.js";

import type {
  GenesisReplayId,
} from "../GenesisReplayIdentity.js";

import {
  enrichedCorrelation,
  priorCorrelation,
} from "./fixtures/genesisCorrelationRevisionFixtures.js";

/*
 * MS-2026-0010 (F-38): existing full copies convert to revisions only
 * when they reproduce exactly, with the original backed up first.
 */

function replay(
  name:
    string,
): GenesisReplayId {
  return `genesis-replay:${Buffer.from(name).toString("hex").padEnd(64, "0").slice(0, 64)}` as GenesisReplayId;
}

const BASE =
  replay("designated");

const LEARNING =
  replay("learning");

const ORIGINAL =
  replay("original");

function fixture() {
  const root =
    mkdtempSync(
      path.join(
        tmpdir(),
        "korelumina-correlation-compaction-",
      ),
    );

  const correlations =
    new FileGenesisHistoricalCorrelationPersistenceStore({
      storageRoot:
        path.join(
          root,
          "historical-correlation",
        ),
    });

  const base =
    priorCorrelation();

  /* What the learning replay's execution materializes. */
  const additions =
    enrichedCorrelation(
      base,
    );

  const learning =
    integrateGenesisHistoricalCorrelationRevision(
      base,
      additions,
    );

  correlations.save(
    BASE,
    base,
  );

  correlations.save(
    LEARNING,
    learning,
  );

  /* An original replay: no earlier copy reproduces it. */
  correlations.save(
    ORIGINAL,
    {
      ...additions,

      episodes:
        [],
    },
  );

  const executions =
    new Map<GenesisReplayId, GenesisReplayExecution>([
      [
        LEARNING,
        {
          materialized:
            additions,
        } as unknown as GenesisReplayExecution,
      ],
      [
        ORIGINAL,
        {
          materialized:
            {
              ...additions,

              sourceReferences:
                [],
            },
        } as unknown as GenesisReplayExecution,
      ],
    ]);

  return {
    root,
    correlations,
    learning,
    executions,
  };
}

test(
  "compaction previews without writing, then converts only exact reproductions",
  () => {
    const {
      root,
      correlations,
      learning,
      executions,
    } =
      fixture();

    const input = {
      correlations,

      replayIds: [
        BASE,
        LEARNING,
        ORIGINAL,
      ],

      loadExecution:
        (
          replayId:
            GenesisReplayId,
        ) =>
          executions.get(
            replayId,
          ) ?? null,

      protectedReplayIds: [
        BASE,
      ],

      /* The fixture executions carry their materialized correlation. */
      materialize:
        (
          execution:
            GenesisReplayExecution,
        ) =>
          (
            execution as unknown as {
              materialized:
                GenesisHistoricalCorrelationState;
            }
          ).materialized,
    };

    const preview =
      compactGenesisHistoricalCorrelations(
        input,
      );

    assert.deepEqual(
      Object.fromEntries(
        preview.map(
          item => [
            item.replayId,
            item.action,
          ],
        ),
      ),
      {
        [BASE]:
          "protected",
        [LEARNING]:
          "convert",
        [ORIGINAL]:
          "no-base",
      },
    );

    assert.equal(
      correlations.isRevision(
        LEARNING,
      ),
      false,
    );

    const backupDirectory =
      path.join(
        root,
        "backup",
      );

    const written =
      compactGenesisHistoricalCorrelations({
        ...input,

        write: {
          backupDirectory,
        },
      });

    const converted =
      written.find(
        item =>
          item.replayId ===
          LEARNING,
      )!;

    assert.equal(
      converted.baseReplayId,
      BASE,
    );

    assert.equal(
      correlations.isRevision(
        LEARNING,
      ),
      true,
    );

    assert.deepEqual(
      correlations.load(
        LEARNING,
      ),
      learning,
    );

    const backupFile =
      path.join(
        backupDirectory,
        path.basename(
          path.dirname(
            correlations.pathsFor(
              LEARNING,
            ).correlationFile,
          ),
        ),
        "correlation.json",
      );

    assert.ok(
      existsSync(
        backupFile,
      ),
    );

    assert.deepEqual(
      JSON.parse(
        readFileSync(
          backupFile,
          "utf8",
        ),
      ),
      JSON.parse(
        JSON.stringify(
          learning,
        ),
      ),
    );

    assert.equal(
      correlations.isRevision(
        BASE,
      ),
      false,
    );

    assert.equal(
      correlations.isRevision(
        ORIGINAL,
      ),
      false,
    );
  },
);
