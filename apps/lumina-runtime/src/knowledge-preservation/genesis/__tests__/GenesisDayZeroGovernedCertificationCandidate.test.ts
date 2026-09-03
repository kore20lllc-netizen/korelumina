import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisDayZeroGovernedCertificationCandidate,
} from "../GenesisDayZeroGovernedCertificationCandidate.js";

import type {
  GenesisDayZeroCertificationCandidate,
} from "../GenesisDayZeroCertificationCandidate.js";


function rawCandidate(
  state:
    GenesisDayZeroCertificationCandidate["state"] =
      "READY",
): GenesisDayZeroCertificationCandidate {
  return {
    candidateId:
      "genesis-day-zero-certification-candidate:raw",

    state,

    repositoryNative: {
      certificationId:
        "genesis-repository-seed-certification:test",

      state:
        "CERTIFIED",

      replayExact:
        true,

      totalSources:
        1,

      completedSources:
        1,

      blockedSources:
        0,
    },

    conversationHistory: {
      expectedHistoryPresent:
        true,

      expectedInventoryId:
        "genesis-conversation-expected-history:test",

      acquisitionInventoryId:
        "genesis-conversation-acquisition-inventory:test",

      reconciliationState:
        "COMPLETE",

      authorityId:
        "authority:test",

      authorityVersion:
        "v1",

      expectedRecoverableConversationIds:
        [],

      acquiredExpectedConversationIds:
        [],

      notYetAcquiredConversationIds:
        [],

      historicallyUnavailableConversationIds:
        [],

      unexpectedAcquiredConversationIds:
        [],
    },

    correlation: {
      projectionId:
        "genesis-conversation-correlation-completeness:test",

      state:
        "COMPLETE",

      conversationManifestSources:
        1,

      admittedConversationSources:
        1,

      correlatedConversationSources:
        1,

      correlatedConversationEvents:
        1,

      unresolvedExplicitLinks:
        0,

      episodeLineageGaps:
        0,
    },

    corpus: {
      projectionId:
        "genesis-corpus-projection:test",

      sourceRevisions:
        1,

      historicalEvents:
        1,

      relationships:
        0,

      evolutionEpisodes:
        1,

      pendingExternalEpisodes:
        0,
    },

    provenance: {
      repositorySeedCertificationId:
        "genesis-repository-seed-certification:test",

      corpusProjectionId:
        "genesis-corpus-projection:test",

      conversationExpectedInventoryId:
        "genesis-conversation-expected-history:test",

      conversationAcquisitionInventoryId:
        "genesis-conversation-acquisition-inventory:test",

      conversationCorrelationProjectionId:
        "genesis-conversation-correlation-completeness:test",
    },

    visibleHistoricalGaps: {
      historicallyUnavailableConversationIds:
        [],

      notYetAcquiredConversationIds:
        [],

      unexpectedAcquiredConversationIds:
        [],

      unresolvedExplicitHistoricalLinks:
        [],

      episodeLineageGaps:
        [],
    },

    blockers:
      [],

    dayZeroGenesisCertified:
      false,
  };
}


test(
  "raw READY candidate remains incomplete until governed conversation coverage is VALID",
  () => {
    const candidate =
      buildGenesisDayZeroGovernedCertificationCandidate({
        candidate:
          rawCandidate(),

        conversationCoverageCertification: {
          state:
            "UNSET",

          certificationId:
            null,
        },
      });

    assert.equal(
      candidate.state,
      "INCOMPLETE",
    );

    assert.deepEqual(
      candidate.blockers,
      [
        "day-zero-conversation-coverage-not-certified",
      ],
    );

    assert.equal(
      candidate
        .conversationCoverageCertification
        .valid,
      false,
    );
  },
);


test(
  "VALID governed conversation coverage releases an otherwise READY candidate",
  () => {
    const candidate =
      buildGenesisDayZeroGovernedCertificationCandidate({
        candidate:
          rawCandidate(),

        conversationCoverageCertification: {
          state:
            "VALID",

          certificationId:
            "genesis-day-zero-conversation-coverage-certification:test",
        },
      });

    assert.equal(
      candidate.state,
      "READY",
    );

    assert.deepEqual(
      candidate.blockers,
      [],
    );

    assert.equal(
      candidate
        .conversationCoverageCertification
        .valid,
      true,
    );
  },
);


test(
  "VALID state without certification identity does not satisfy governance gate",
  () => {
    const candidate =
      buildGenesisDayZeroGovernedCertificationCandidate({
        candidate:
          rawCandidate(),

        conversationCoverageCertification: {
          state:
            "VALID",

          certificationId:
            null,
        },
      });

    assert.equal(
      candidate.state,
      "INCOMPLETE",
    );

    assert.ok(
      candidate.blockers.includes(
        "day-zero-conversation-coverage-not-certified",
      ),
    );
  },
);


test(
  "coverage certification cannot override an existing raw candidate blocker",
  () => {
    const raw = {
      ...rawCandidate(
        "INCOMPLETE",
      ),

      blockers: [
        "repository-replay-integrity-not-exact",
      ],
    } satisfies GenesisDayZeroCertificationCandidate;

    const candidate =
      buildGenesisDayZeroGovernedCertificationCandidate({
        candidate:
          raw,

        conversationCoverageCertification: {
          state:
            "VALID",

          certificationId:
            "genesis-day-zero-conversation-coverage-certification:test",
        },
      });

    assert.equal(
      candidate.state,
      "INCOMPLETE",
    );

    assert.deepEqual(
      candidate.blockers,
      [
        "repository-replay-integrity-not-exact",
      ],
    );
  },
);


test(
  "coverage certification identity participates in governed candidate identity",
  () => {
    const first =
      buildGenesisDayZeroGovernedCertificationCandidate({
        candidate:
          rawCandidate(),

        conversationCoverageCertification: {
          state:
            "VALID",

          certificationId:
            "genesis-day-zero-conversation-coverage-certification:first",
        },
      });

    const second =
      buildGenesisDayZeroGovernedCertificationCandidate({
        candidate:
          rawCandidate(),

        conversationCoverageCertification: {
          state:
            "VALID",

          certificationId:
            "genesis-day-zero-conversation-coverage-certification:second",
        },
      });

    assert.notEqual(
      first.candidateId,
      second.candidateId,
    );
  },
);
