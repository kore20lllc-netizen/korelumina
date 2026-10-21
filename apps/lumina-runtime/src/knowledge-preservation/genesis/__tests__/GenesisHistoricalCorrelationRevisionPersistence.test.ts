import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import {
  EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
} from "../GenesisHistoricalCorrelation.js";

import {
  FileGenesisHistoricalCorrelationPersistenceStore,
  GENESIS_HISTORICAL_CORRELATION_REVISION_FORMAT,
} from "../GenesisHistoricalCorrelationPersistence.js";

import {
  integrateGenesisHistoricalCorrelationRevision,
} from "../GenesisHistoricalCorrelationRevisionIntegrator.js";

import type {
  GenesisReplayId,
} from "../GenesisReplayIdentity.js";

import {
  enrichedCorrelation,
  priorCorrelation,
} from "./fixtures/genesisCorrelationRevisionFixtures.js";

/*
 * MS-2026-0010 (F-38): a learning replay's correlation is stored as its
 * base replay plus what it added, never as a partial correlation.
 */

function store() {
  return new FileGenesisHistoricalCorrelationPersistenceStore({
    storageRoot:
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-correlation-revision-",
        ),
      ),
  });
}

function replay(
  name:
    string,
): GenesisReplayId {
  return `genesis-replay:${Buffer.from(name).toString("hex").padEnd(64, "0").slice(0, 64)}` as GenesisReplayId;
}

const BASE =
  replay("base");

const LEARNING =
  replay("learning");

function fileOf(
  correlations:
    FileGenesisHistoricalCorrelationPersistenceStore,
  replayId:
    GenesisReplayId,
) {
  return JSON.parse(
    readFileSync(
      correlations.pathsFor(
        replayId,
      ).correlationFile,
      "utf8",
    ),
  );
}

test(
  "a learning replay is stored as a revision and loads exactly as integrated",
  () => {
    const correlations =
      store();

    const base =
      priorCorrelation();

    const additions =
      enrichedCorrelation(
        base,
      );

    const integrated =
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
      integrated,
      {
        revisionOf: {
          baseReplayId:
            BASE,

          additions,
        },
      },
    );

    assert.equal(
      correlations.isRevision(
        LEARNING,
      ),
      true,
    );

    assert.equal(
      fileOf(
        correlations,
        LEARNING,
      ).format,
      GENESIS_HISTORICAL_CORRELATION_REVISION_FORMAT,
    );

    assert.equal(
      fileOf(
        correlations,
        LEARNING,
      ).baseReplayId,
      BASE,
    );

    /* The enrichment revised the base episode: one episode, new revision. */
    assert.deepEqual(
      correlations.load(
        LEARNING,
      ),
      integrated,
    );

    assert.equal(
      correlations.isRevision(
        BASE,
      ),
      false,
    );
  },
);

test(
  "a state the revision does not reproduce is stored in full",
  () => {
    const correlations =
      store();

    const base =
      priorCorrelation();

    correlations.save(
      BASE,
      base,
    );

    const notIntegrated = {
      ...base,

      episodes:
        [],
    };

    correlations.save(
      LEARNING,
      notIntegrated,
      {
        revisionOf: {
          baseReplayId:
            BASE,

          additions:
            EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
        },
      },
    );

    assert.equal(
      correlations.isRevision(
        LEARNING,
      ),
      false,
    );

    assert.deepEqual(
      correlations.load(
        LEARNING,
      ),
      notIntegrated,
    );
  },
);

test(
  "a revision with no stored base is stored in full",
  () => {
    const correlations =
      store();

    const base =
      priorCorrelation();

    const additions =
      enrichedCorrelation(
        base,
      );

    const integrated =
      integrateGenesisHistoricalCorrelationRevision(
        base,
        additions,
      );

    correlations.save(
      LEARNING,
      integrated,
      {
        revisionOf: {
          baseReplayId:
            BASE,

          additions,
        },
      },
    );

    assert.equal(
      correlations.isRevision(
        LEARNING,
      ),
      false,
    );

    /* Stored in full, so it reads back as JSON. */
    assert.deepEqual(
      correlations.load(
        LEARNING,
      ),
      JSON.parse(
        JSON.stringify(
          integrated,
        ),
      ),
    );
  },
);

test(
  "revisions chain through their bases",
  () => {
    const correlations =
      store();

    const base =
      priorCorrelation();

    const additions =
      enrichedCorrelation(
        base,
      );

    const first =
      integrateGenesisHistoricalCorrelationRevision(
        base,
        additions,
      );

    const second =
      integrateGenesisHistoricalCorrelationRevision(
        first,
        EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
      );

    const NEXT =
      replay("next");

    correlations.save(
      BASE,
      base,
    );

    correlations.save(
      LEARNING,
      first,
      {
        revisionOf: {
          baseReplayId:
            BASE,

          additions,
        },
      },
    );

    correlations.save(
      NEXT,
      second,
      {
        revisionOf: {
          baseReplayId:
            LEARNING,

          additions:
            EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
        },
      },
    );

    assert.equal(
      correlations.isRevision(
        NEXT,
      ),
      true,
    );

    assert.deepEqual(
      correlations.load(
        NEXT,
      ),
      second,
    );
  },
);

test(
  "a revision whose base disappears fails instead of loading partially",
  () => {
    const correlations =
      store();

    const base =
      priorCorrelation();

    const additions =
      enrichedCorrelation(
        base,
      );

    correlations.save(
      BASE,
      base,
    );

    correlations.save(
      LEARNING,
      integrateGenesisHistoricalCorrelationRevision(
        base,
        additions,
      ),
      {
        revisionOf: {
          baseReplayId:
            BASE,

          additions,
        },
      },
    );

    writeFileSync(
      correlations.pathsFor(
        LEARNING,
      ).correlationFile,
      JSON.stringify({
        format:
          GENESIS_HISTORICAL_CORRELATION_REVISION_FORMAT,

        baseReplayId:
          replay("missing"),

        additions,
      }),
    );

    assert.throws(
      () =>
        correlations.load(
          LEARNING,
        ),
      /genesis_historical_correlation_revision_base_not_found/,
    );
  },
);

test(
  "a revision cycle fails instead of looping",
  () => {
    const correlations =
      store();

    for (
      const [
        replayId,
        baseReplayId,
      ] of [
        [
          BASE,
          LEARNING,
        ],
        [
          LEARNING,
          BASE,
        ],
      ] as const
    ) {
      correlations.save(
        replayId,
        EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
      );

      writeFileSync(
        correlations.pathsFor(
          replayId,
        ).correlationFile,
        JSON.stringify({
          format:
            GENESIS_HISTORICAL_CORRELATION_REVISION_FORMAT,

          baseReplayId,

          additions:
            EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
        }),
      );
    }

    assert.throws(
      () =>
        correlations.load(
          LEARNING,
        ),
      /genesis_historical_correlation_revision_chain_invalid/,
    );
  },
);
