import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisConversationAuthoritativeExpectedHistory,
  GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_CLASS,
  GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_SCOPE,
  GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_VERSION,
} from "../GenesisConversationAuthoritativeExpectedHistory.js";

import type {
  GenesisConversationExpectedHistoryCandidate,
} from "../GenesisConversationExpectedHistoryCandidate.js";

import type {
  GenesisConversationAuthoritativeCompletenessCertification,
} from "../GenesisConversationAuthoritativeCompletenessCertification.js";


function candidate():
  GenesisConversationExpectedHistoryCandidate {
  return {
    candidateId:
      "genesis-conversation-expected-history-candidate:test",

    authorityState:
      "CANDIDATE",

    dayZeroConversationCoverageCertified:
      false,

    generatedAt:
      100,

    sourceAcquisitionId:
      "acquisition-1",

    sourceId:
      "browser",

    conversationCount:
      2,

    conversations: [
      {
        conversationId:
          "conversation-a",

        projectId:
          "project-a",

        sourceLocator:
          "https://chatgpt.com/a",

        firstKnownAt:
          10,

        lastKnownAt:
          20,

        basis:
          "acquired",
      },
      {
        conversationId:
          "conversation-b",

        projectId:
          "project-b",

        sourceLocator:
          "https://chatgpt.com/b",

        firstKnownAt:
          30,

        lastKnownAt:
          40,

        basis:
          "acquired",
      },
    ],

    blockers: [
      "authoritative-conversation-history-inventory-not-certified",
    ],
  };
}


function certification():
  GenesisConversationAuthoritativeCompletenessCertification {
  return {
    certificationId:
      "genesis-conversation-authoritative-completeness-certification:test",

    certificationVersion:
      "genesis-conversation-authoritative-completeness-certification:v1",

    state:
      "CERTIFIED",

    candidateId:
      candidate().candidateId,

    reviewId:
      "review-1",

    acquisitionId:
      "acquisition-1",

    acquisitionInventoryId:
      "inventory-1",

    candidateConversationCount:
      2,

    acquiredConversationCount:
      2,

    projectCount:
      2,

    historicalSourceCount:
      8,

    evidenceCount:
      8,

    knownOmissionCount:
      0,

    certifiedBy:
      "operator-1",

    certifiedAt:
      500,

    reason:
      "Governed completeness evidence certified.",

    authoritativeExpectedHistoryCreated:
      false,

    dayZeroConversationCoverageCertified:
      false,

    promotionAvailable:
      false,
  };
}


test(
  "builds authoritative expected history only from certified matching candidate",
  () => {
    const inventory =
      buildGenesisConversationAuthoritativeExpectedHistory({
        candidate:
          candidate(),

        certification:
          certification(),
      });

    assert.equal(
      inventory.conversations.length,
      2,
    );

    assert.equal(
      inventory.authority.authorityId,
      certification().certificationId,
    );

    assert.equal(
      inventory.authority.authorityClass,
      GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_CLASS,
    );

    assert.equal(
      inventory.authority.scope,
      GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_SCOPE,
    );

    assert.equal(
      inventory.authority.version,
      GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_VERSION,
    );

    assert.equal(
      inventory.authority.certifiedBy,
      "operator-1",
    );

    assert.equal(
      inventory.historicalStart,
      10,
    );

    assert.equal(
      inventory.historicalEnd,
      40,
    );

    assert.ok(
      inventory.conversations.every(
        conversation =>
          conversation.disposition ===
          "EXPECTED_RECOVERABLE",
      ),
    );
  },
);


test(
  "rejects certification for another candidate",
  () => {
    const mismatched = {
      ...certification(),

      candidateId:
        "genesis-conversation-expected-history-candidate:other",
    };

    assert.throws(
      () =>
        buildGenesisConversationAuthoritativeExpectedHistory({
          candidate:
            candidate(),

          certification:
            mismatched,
        }),
      /candidate_mismatch/,
    );
  },
);


test(
  "rejects certified corpus with known omissions",
  () => {
    const invalid = {
      ...certification(),

      knownOmissionCount:
        1,
    };

    assert.throws(
      () =>
        buildGenesisConversationAuthoritativeExpectedHistory({
          candidate:
            candidate(),

          certification:
            invalid,
        }),
      /known_omissions_present/,
    );
  },
);
