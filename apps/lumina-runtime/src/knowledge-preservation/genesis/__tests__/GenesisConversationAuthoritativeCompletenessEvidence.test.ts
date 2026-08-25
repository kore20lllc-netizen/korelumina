import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisConversationAuthoritativeCompletenessEvidence,
} from "../GenesisConversationAuthoritativeCompletenessEvidence.js";

import type {
  GenesisConversationAcquisitionInventory,
} from "../GenesisConversationAcquisitionInventory.js";

import type {
  GenesisConversationExpectedHistoryCandidate,
} from "../GenesisConversationExpectedHistoryCandidate.js";

import {
  buildGenesisConversationExpectedHistoryCandidatePendingReview,
  reviewGenesisConversationExpectedHistoryCandidate,
} from "../GenesisConversationExpectedHistoryCandidateReview.js";


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
          1,

        lastKnownAt:
          2,

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
          3,

        lastKnownAt:
          4,

        basis:
          "acquired",
      },
    ],

    blockers: [
      "authoritative-conversation-history-inventory-not-certified",
    ],
  };
}


function acquisition():
  GenesisConversationAcquisitionInventory {
  return {
    inventoryId:
      "genesis-conversation-acquisition-inventory:test",

    historyState:
      "ACQUIRED",

    completeness:
      "UNVERIFIED",

    configured:
      true,

    acquisitionAvailable:
      true,

    acquisitionId:
      "acquisition-1",

    acquiredConversationIds: [
      "conversation-a",
      "conversation-b",
    ],

    conversationCount:
      2,

    historicalSourceCount:
      8,

    evidenceCount:
      8,

    gapCounts: {
      notYetAcquired:
        0,

      historicallyUnavailable:
        0,

      permissionBlocked:
        0,

      sourceUnavailable:
        0,
    },

    blockers: [
      "authoritative-conversation-history-inventory-not-certified",
    ],

    historicalCompletenessCertified:
      false,
  };
}


test(
  "attested matching corpus becomes ready for authoritative completeness review without creating authority",
  () => {
    const currentCandidate =
      candidate();

    const pending =
      buildGenesisConversationExpectedHistoryCandidatePendingReview(
        currentCandidate,
      );

    const review =
      reviewGenesisConversationExpectedHistoryCandidate(
        pending,
        {
          decision:
            "ATTEST_SCOPE",

          reviewedBy:
            "operator",

          reviewedAt:
            500,
        },
      );

    const projection =
      buildGenesisConversationAuthoritativeCompletenessEvidence({
        candidate:
          currentCandidate,

        review,

        acquisition:
          acquisition(),

        authoritativeExpectedHistoryCreated:
          false,
      });

    assert.equal(
      projection.state,
      "READY_FOR_REVIEW",
    );

    assert.deepEqual(
      projection.blockers,
      [
        "authoritative-completeness-evidence-not-certified",
      ],
    );

    assert.equal(
      projection.authoritativeCompletenessEvidenceCertified,
      false,
    );

    assert.equal(
      projection.authoritativeExpectedHistoryCreated,
      false,
    );

    assert.equal(
      projection.authoritativeExpectedHistoryCreationAvailable,
      false,
    );

    assert.equal(
      projection.dayZeroConversationCoverageCertified,
      false,
    );

    assert.equal(
      projection.promotionAvailable,
      false,
    );
  },
);


test(
  "pending scope review blocks authoritative completeness evidence",
  () => {
    const currentCandidate =
      candidate();

    const review =
      buildGenesisConversationExpectedHistoryCandidatePendingReview(
        currentCandidate,
      );

    const projection =
      buildGenesisConversationAuthoritativeCompletenessEvidence({
        candidate:
          currentCandidate,

        review,

        acquisition:
          acquisition(),

        authoritativeExpectedHistoryCreated:
          false,
      });

    assert.equal(
      projection.state,
      "BLOCKED",
    );

    assert.ok(
      projection.blockers.includes(
        "conversation-candidate-scope-not-attested",
      ),
    );
  },
);


test(
  "candidate and acquisition mismatch blocks authoritative completeness evidence",
  () => {
    const currentCandidate =
      candidate();

    const pending =
      buildGenesisConversationExpectedHistoryCandidatePendingReview(
        currentCandidate,
      );

    const review =
      reviewGenesisConversationExpectedHistoryCandidate(
        pending,
        {
          decision:
            "ATTEST_SCOPE",

          reviewedBy:
            "operator",

          reviewedAt:
            500,
        },
      );

    const mismatched = {
      ...acquisition(),

      acquisitionId:
        "acquisition-2",
    };

    const projection =
      buildGenesisConversationAuthoritativeCompletenessEvidence({
        candidate:
          currentCandidate,

        review,

        acquisition:
          mismatched,

        authoritativeExpectedHistoryCreated:
          false,
      });

    assert.equal(
      projection.state,
      "BLOCKED",
    );

    assert.ok(
      projection.blockers.includes(
        "conversation-candidate-acquisition-mismatch",
      ),
    );
  },
);
