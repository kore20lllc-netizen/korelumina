import assert from "node:assert/strict";
import test from "node:test";

import {
  enrichedCorrelation,
  priorCorrelation,
} from "./fixtures/genesisCorrelationRevisionFixtures.js";

import {
  integrateGenesisHistoricalCorrelationRevision,
} from "../GenesisHistoricalCorrelationRevisionIntegrator.js";

import type {
  GenesisHistoricalCorrelationState,
} from "../GenesisHistoricalCorrelation.js";


test(
  "conversation semantic enrichment revises existing episode identity instead of creating a parallel episode",
  () => {
    const prior =
      priorCorrelation();

    const incoming =
      enrichedCorrelation(
        prior,
      );

    const result =
      integrateGenesisHistoricalCorrelationRevision(
        prior,
        incoming,
      );

    assert.equal(
      result.episodes.length,
      1,
    );

    assert.equal(
      result.episodes[0]
        .episodeId,
      prior.episodes[0]
        .episodeId,
    );

    assert.notEqual(
      result.episodes[0]
        .revisionId,
      prior.episodes[0]
        .revisionId,
    );

    assert.equal(
      result.episodes[0]
        .lineage
        .previousRevisionId,
      prior.episodes[0]
        .revisionId,
    );
  },
);


test(
  "revised episode deterministically includes conversation source event and relationship",
  () => {
    const prior =
      priorCorrelation();

    const incoming =
      enrichedCorrelation(
        prior,
      );

    const result =
      integrateGenesisHistoricalCorrelationRevision(
        prior,
        incoming,
      );

    const episode =
      result.episodes[0];

    /*
     * architecture v1 and v2 are revisions of one logical
     * HistoricalSourceReference, so together with the conversation
     * there are two source references, not three.
     */
    assert.equal(
      episode.sourceReferenceIds.length,
      2,
    );

    assert.equal(
      episode.eventIds.length,
      3,
    );

    assert.equal(
      episode.relationshipIds.length,
      2,
    );

    assert.equal(
      episode.externalContext,
      "complete",
    );
  },
);


test(
  "incoming correlation without a semantic episode cannot revise an existing episode",
  () => {
    const prior =
      priorCorrelation();

    const incoming:
      GenesisHistoricalCorrelationState = {
      sourceReferences:
        [],

      events:
        [],

      relationships:
        [],

      episodes:
        [],
    };

    const result =
      integrateGenesisHistoricalCorrelationRevision(
        prior,
        incoming,
      );

    assert.equal(
      result.episodes.length,
      1,
    );

    assert.equal(
      result.episodes[0]
        .revisionId,
      prior.episodes[0]
        .revisionId,
    );

    assert.equal(
      result.episodes[0]
        .lineage
        .previousRevisionId,
      undefined,
    );
  },
);


test(
  "revision integration is deterministic for identical prior and incoming correlation",
  () => {
    const prior =
      priorCorrelation();

    const incoming =
      enrichedCorrelation(
        prior,
      );

    const first =
      integrateGenesisHistoricalCorrelationRevision(
        prior,
        incoming,
      );

    const second =
      integrateGenesisHistoricalCorrelationRevision(
        prior,
        incoming,
      );

    assert.deepEqual(
      first,
      second,
    );
  },
);
