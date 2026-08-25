import {
  buildGenesisConversationExpectedHistoryCandidatePendingReview,
  reviewGenesisConversationExpectedHistoryCandidate,
} from "./GenesisConversationExpectedHistoryCandidateReview.js";

import type {
  GenesisConversationExpectedHistoryCandidateKnownOmission,
  GenesisConversationExpectedHistoryCandidateReview,
} from "./GenesisConversationExpectedHistoryCandidateReview.js";

import type {
  GenesisConversationExpectedHistoryCandidateService,
} from "./GenesisConversationExpectedHistoryCandidateService.js";

import type {
  FileGenesisConversationExpectedHistoryCandidateReviewPersistenceStore,
} from "./GenesisConversationExpectedHistoryCandidateReviewPersistence.js";


export class GenesisConversationExpectedHistoryCandidateReviewService {
  constructor(
    private readonly candidateService:
      GenesisConversationExpectedHistoryCandidateService,

    private readonly persistence:
      FileGenesisConversationExpectedHistoryCandidateReviewPersistenceStore,

    private readonly now:
      () => number =
        () =>
          Date.now(),
  ) {}


  read():
    GenesisConversationExpectedHistoryCandidateReview |
    null {
    const candidate =
      this.candidateService
        .read();

    if (
      !candidate
    ) {
      return null;
    }

    const existing =
      this.persistence
        .load();

    if (
      existing &&
      existing.candidateId ===
        candidate.candidateId
    ) {
      return existing;
    }

    const pending =
      buildGenesisConversationExpectedHistoryCandidatePendingReview(
        candidate,
      );

    this.persistence
      .save(
        pending,
      );

    return pending;
  }


  decide(
    input: {
      decision:
        "ATTEST_SCOPE"
        | "DECLARE_GAPS"
        | "REJECT";

      reviewedBy:
        string;

      knownOmissions?:
        readonly GenesisConversationExpectedHistoryCandidateKnownOmission[];

      notes?:
        string;
    },
  ):
    GenesisConversationExpectedHistoryCandidateReview {
    const current =
      this.read();

    if (
      !current
    ) {
      throw new Error(
        "genesis_conversation_expected_history_candidate_review_candidate_unavailable",
      );
    }

    const reviewed =
      reviewGenesisConversationExpectedHistoryCandidate(
        current,
        {
          ...input,

          reviewedAt:
            this.now(),
        },
      );

    this.persistence
      .save(
        reviewed,
      );

    return reviewed;
  }
}
