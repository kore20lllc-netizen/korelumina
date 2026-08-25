import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisConversationExpectedHistoryCandidatePendingReview,
  reviewGenesisConversationExpectedHistoryCandidate,
} from "../GenesisConversationExpectedHistoryCandidateReview.js";

import type {
  GenesisConversationExpectedHistoryCandidate,
} from "../GenesisConversationExpectedHistoryCandidate.js";


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


test(
  "candidate review begins pending and cannot promote authority",
  () => {
    const review =
      buildGenesisConversationExpectedHistoryCandidatePendingReview(
        candidate(),
      );

    assert.equal(
      review.state,
      "PENDING_REVIEW",
    );

    assert.equal(
      review.authoritativeExpectedHistoryCreated,
      false,
    );

    assert.equal(
      review.dayZeroConversationCoverageCertified,
      false,
    );

    assert.equal(
      review.promotionAvailable,
      false,
    );

    assert.deepEqual(
      review.candidateProjectIds,
      [
        "project-a",
        "project-b",
      ],
    );
  },
);


test(
  "single corpus review may attest scope without certifying Day Zero",
  () => {
    const pending =
      buildGenesisConversationExpectedHistoryCandidatePendingReview(
        candidate(),
      );

    const reviewed =
      reviewGenesisConversationExpectedHistoryCandidate(
        pending,
        {
          decision:
            "ATTEST_SCOPE",

          reviewedBy:
            "operator",

          reviewedAt:
            500,

          notes:
            "Reviewed governed project inventories.",
        },
      );

    assert.equal(
      reviewed.state,
      "SCOPE_ATTESTED",
    );

    assert.equal(
      reviewed.reviewedBy,
      "operator",
    );

    assert.equal(
      reviewed.authoritativeExpectedHistoryCreated,
      false,
    );

    assert.equal(
      reviewed.dayZeroConversationCoverageCertified,
      false,
    );

    assert.equal(
      reviewed.promotionAvailable,
      false,
    );
  },
);


test(
  "known omissions produce a gaps-declared review without authority",
  () => {
    const pending =
      buildGenesisConversationExpectedHistoryCandidatePendingReview(
        candidate(),
      );

    const reviewed =
      reviewGenesisConversationExpectedHistoryCandidate(
        pending,
        {
          decision:
            "DECLARE_GAPS",

          reviewedBy:
            "operator",

          reviewedAt:
            500,

          knownOmissions: [
            {
              description:
                "Older project may contain additional conversations.",

              projectId:
                "project-a",

              basis:
                "operator-observed-history",
            },
          ],
        },
      );

    assert.equal(
      reviewed.state,
      "GAPS_DECLARED",
    );

    assert.equal(
      reviewed.knownOmissions.length,
      1,
    );

    assert.equal(
      reviewed.authoritativeExpectedHistoryCreated,
      false,
    );

    assert.equal(
      reviewed.dayZeroConversationCoverageCertified,
      false,
    );

    assert.equal(
      reviewed.promotionAvailable,
      false,
    );
  },
);
