import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyGenesisDayZero,
  validateGenesisDayZeroCertification,
} from "../GenesisDayZeroCertification.js";

import type {
  GenesisDayZeroCertificationCandidate,
} from "../GenesisDayZeroCertificationCandidate.js";


function candidate():
  GenesisDayZeroCertificationCandidate {
  return {
    candidateId:
      "genesis-day-zero-certification-candidate:test",

    state:
      "READY",

    repositoryNative: {
      certificationId:
        "genesis-repository-seed-certification:test",

      state:
        "CERTIFIED",

      replayExact:
        true,

      totalSources:
        10,

      completedSources:
        10,

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
        "day-zero-history-authority",

      authorityVersion:
        "1",

      expectedRecoverableConversationIds: [
        "conversation-001",
      ],

      acquiredExpectedConversationIds: [
        "conversation-001",
      ],

      notYetAcquiredConversationIds:
        [],

      historicallyUnavailableConversationIds: [
        "conversation-lost",
      ],

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
        10,

      historicalEvents:
        10,

      relationships:
        5,

      evolutionEpisodes:
        2,

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
      historicallyUnavailableConversationIds: [
        "conversation-lost",
      ],

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


function decision() {
  return {
    certifiedBy:
      "korelumina-human-governance",

    certifiedAt:
      1000,

    reason:
      "Day-0 institutional history prerequisites reviewed and accepted.",

    acknowledgedHistoricallyUnavailableConversationIds: [
      "conversation-lost",
    ],
  };
}


test(
  "READY candidate can be explicitly certified by human governance",
  () => {
    const certification =
      certifyGenesisDayZero({
        candidate:
          candidate(),

        decision:
          decision(),
      });

    assert.equal(
      certification.state,
      "CERTIFIED",
    );

    assert.equal(
      certification.certifiedBy,
      "korelumina-human-governance",
    );

    assert.deepEqual(
      certification
        .certifiedHistoricalGaps
        .historicallyUnavailableConversationIds,
      [
        "conversation-lost",
      ],
    );

    assert.equal(
      certification
        .downstream
        .educationalCorpusCertified,
      false,
    );

    assert.equal(
      certification
        .downstream
        .initialCompetencyCertified,
      false,
    );

    assert.equal(
      certification
        .downstream
        .chiefAgentActivationAuthorized,
      false,
    );
  },
);


test(
  "certification identity is deterministic for identical decision and candidate",
  () => {
    const first =
      certifyGenesisDayZero({
        candidate:
          candidate(),

        decision:
          decision(),
      });

    const second =
      certifyGenesisDayZero({
        candidate:
          candidate(),

        decision:
          decision(),
      });

    assert.equal(
      first.certificationId,
      second.certificationId,
    );
  },
);


test(
  "non-READY candidate cannot be certified",
  () => {
    const input =
      candidate();

    const incomplete:
      GenesisDayZeroCertificationCandidate = {
      ...input,

      state:
        "INCOMPLETE",

      blockers: [
        "conversation-history-coverage-incomplete",
      ],
    };

    assert.throws(
      () =>
        certifyGenesisDayZero({
          candidate:
            incomplete,

          decision:
            decision(),
        }),
      /candidate_not_ready/,
    );
  },
);


test(
  "historically unavailable gaps must be acknowledged exactly",
  () => {
    assert.throws(
      () =>
        certifyGenesisDayZero({
          candidate:
            candidate(),

          decision: {
            ...decision(),

            acknowledgedHistoricallyUnavailableConversationIds:
              [],
          },
        }),
      /historical_gap_acknowledgement_mismatch/,
    );
  },
);


test(
  "historically unavailable gaps are certifiable while unresolved gaps are not",
  () => {
    const input =
      candidate();

    const unresolved:
      GenesisDayZeroCertificationCandidate = {
      ...input,

      visibleHistoricalGaps: {
        ...input.visibleHistoricalGaps,

        notYetAcquiredConversationIds: [
          "conversation-002",
        ],
      },
    };

    assert.throws(
      () =>
        certifyGenesisDayZero({
          candidate:
            unresolved,

          decision:
            decision(),
        }),
      /unresolved_historical_gaps/,
    );
  },
);


test(
  "certification validates against unchanged authoritative candidate",
  () => {
    const current =
      candidate();

    const certification =
      certifyGenesisDayZero({
        candidate:
          current,

        decision:
          decision(),
      });

    const validation =
      validateGenesisDayZeroCertification({
        certification,

        currentCandidate:
          current,
      });

    assert.equal(
      validation.state,
      "VALID",
    );

    assert.deepEqual(
      validation.blockers,
      [],
    );
  },
);


test(
  "authoritative prerequisite change makes certification stale",
  () => {
    const original =
      candidate();

    const certification =
      certifyGenesisDayZero({
        candidate:
          original,

        decision:
          decision(),
      });

    const changed:
      GenesisDayZeroCertificationCandidate = {
      ...original,

      candidateId:
        "genesis-day-zero-certification-candidate:changed",

      provenance: {
        ...original.provenance,

        conversationCorrelationProjectionId:
          "genesis-conversation-correlation-completeness:changed",
      },
    };

    const validation =
      validateGenesisDayZeroCertification({
        certification,

        currentCandidate:
          changed,
      });

    assert.equal(
      validation.state,
      "STALE",
    );

    assert.ok(
      validation.blockers.includes(
        "day-zero-certification-candidate-changed",
      ),
    );

    assert.ok(
      validation.blockers.includes(
        "conversation-correlation-projection-changed",
      ),
    );
  },
);


test(
  "candidate becoming non-ready blocks existing certification",
  () => {
    const original =
      candidate();

    const certification =
      certifyGenesisDayZero({
        candidate:
          original,

        decision:
          decision(),
      });

    const blocked:
      GenesisDayZeroCertificationCandidate = {
      ...original,

      candidateId:
        "genesis-day-zero-certification-candidate:blocked",

      state:
        "BLOCKED",

      blockers: [
        "conversation-history-coverage-incomplete",
      ],
    };

    const validation =
      validateGenesisDayZeroCertification({
        certification,

        currentCandidate:
          blocked,
      });

    assert.equal(
      validation.state,
      "BLOCKED",
    );
  },
);
