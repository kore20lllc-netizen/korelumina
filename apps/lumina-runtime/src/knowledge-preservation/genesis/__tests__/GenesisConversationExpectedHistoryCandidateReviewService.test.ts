import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import {
  FileGenesisConversationExpectedHistoryCandidatePersistenceStore,
} from "../GenesisConversationExpectedHistoryCandidatePersistence.js";

import {
  GenesisConversationExpectedHistoryCandidateService,
} from "../GenesisConversationExpectedHistoryCandidateService.js";

import {
  FileGenesisConversationExpectedHistoryCandidateReviewPersistenceStore,
} from "../GenesisConversationExpectedHistoryCandidateReviewPersistence.js";

import {
  GenesisConversationExpectedHistoryCandidateReviewService,
} from "../GenesisConversationExpectedHistoryCandidateReviewService.js";


function createHarness() {
  const root =
    mkdtempSync(
      path.join(
        tmpdir(),
        "korelumina-genesis-candidate-review-",
      ),
    );

  const candidatePersistence =
    new FileGenesisConversationExpectedHistoryCandidatePersistenceStore({
      storageRoot:
        path.join(
          root,
          "candidate",
        ),
    });

  candidatePersistence.save({
    candidateId:
      "genesis-conversation-expected-history-candidate:test",

    authorityState:
      "CANDIDATE",

    dayZeroConversationCoverageCertified:
      false,

    generatedAt:
      100,

    sourceAcquisitionId:
      "acquisition-test",

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
          "derived-from-governed-acquisition",
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
          "derived-from-governed-acquisition",
      },
    ],

    blockers: [
      "authoritative-conversation-history-inventory-not-certified",
    ],
  });

  const candidateService =
    {
      read: () =>
        candidatePersistence.load(),
    } as GenesisConversationExpectedHistoryCandidateService;

  const reviewPersistence =
    new FileGenesisConversationExpectedHistoryCandidateReviewPersistenceStore({
      storageRoot:
        path.join(
          root,
          "review",
        ),
    });

  const service =
    new GenesisConversationExpectedHistoryCandidateReviewService(
      candidateService,
      reviewPersistence,
      () =>
        500,
    );

  return {
    root,
    service,
  };
}


test(
  "service exposes one pending corpus-level review",
  () => {
    const {
      root,
      service,
    } =
      createHarness();

    try {
      const review =
        service.read();

      assert.ok(
        review,
      );

      assert.equal(
        review.state,
        "PENDING_REVIEW",
      );

      assert.equal(
        review.candidateConversationCount,
        2,
      );

      assert.equal(
        review.promotionAvailable,
        false,
      );
    } finally {
      rmSync(
        root,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);


test(
  "ATTEST_SCOPE remains non-authoritative",
  () => {
    const {
      root,
      service,
    } =
      createHarness();

    try {
      const review =
        service.decide({
          decision:
            "ATTEST_SCOPE",

          reviewedBy:
            "operator",

          notes:
            "Candidate scope reviewed.",
        });

      assert.equal(
        review.state,
        "SCOPE_ATTESTED",
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
    } finally {
      rmSync(
        root,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);


test(
  "DECLARE_GAPS persists explicit omissions without authority",
  () => {
    const {
      root,
      service,
    } =
      createHarness();

    try {
      const review =
        service.decide({
          decision:
            "DECLARE_GAPS",

          reviewedBy:
            "operator",

          knownOmissions: [
            {
              description:
                "Additional historical project may exist.",

              projectId:
                "project-c",

              basis:
                "operator-observed-history",
            },
          ],
        });

      assert.equal(
        review.state,
        "GAPS_DECLARED",
      );

      assert.equal(
        review.knownOmissions.length,
        1,
      );

      assert.equal(
        review.authoritativeExpectedHistoryCreated,
        false,
      );

      assert.equal(
        review.promotionAvailable,
        false,
      );
    } finally {
      rmSync(
        root,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);


test(
  "REJECT persists rejection without authority",
  () => {
    const {
      root,
      service,
    } =
      createHarness();

    try {
      const review =
        service.decide({
          decision:
            "REJECT",

          reviewedBy:
            "operator",

          notes:
            "Candidate scope is not trustworthy enough.",
        });

      assert.equal(
        review.state,
        "REJECTED",
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
    } finally {
      rmSync(
        root,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);
