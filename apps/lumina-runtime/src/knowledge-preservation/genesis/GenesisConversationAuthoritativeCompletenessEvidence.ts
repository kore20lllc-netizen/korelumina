import type {
  GenesisConversationAcquisitionInventory,
} from "./GenesisConversationAcquisitionInventory.js";

import type {
  GenesisConversationExpectedHistoryCandidate,
} from "./GenesisConversationExpectedHistoryCandidate.js";

import type {
  GenesisConversationExpectedHistoryCandidateReview,
} from "./GenesisConversationExpectedHistoryCandidateReview.js";


export type GenesisConversationAuthoritativeCompletenessEvidenceState =
  | "UNAVAILABLE"
  | "BLOCKED"
  | "READY_FOR_REVIEW";


export interface GenesisConversationAuthoritativeCompletenessEvidence {
  state:
    GenesisConversationAuthoritativeCompletenessEvidenceState;

  candidateId:
    string | null;

  reviewId:
    string | null;

  acquisitionId:
    string | null;

  acquisitionInventoryId:
    string;

  candidateConversationCount:
    number;

  acquiredConversationCount:
    number;

  projectCount:
    number;

  historicalSourceCount:
    number;

  evidenceCount:
    number;

  knownOmissionCount:
    number;

  gapCounts:
    GenesisConversationAcquisitionInventory["gapCounts"];

  blockers:
    readonly string[];

  authoritativeCompletenessEvidenceCertified:
    false;

  authoritativeExpectedHistoryCreated:
    boolean;

  authoritativeExpectedHistoryCreationAvailable:
    false;

  dayZeroConversationCoverageCertified:
    false;

  promotionAvailable:
    false;
}


function sameIds(
  left:
    readonly string[],

  right:
    readonly string[],
): boolean {
  if (
    left.length !==
    right.length
  ) {
    return false;
  }

  const a =
    [...left].sort();

  const b =
    [...right].sort();

  return a.every(
    (
      value,
      index,
    ) =>
      value ===
      b[index],
  );
}


function hasAcquisitionGaps(
  inventory:
    GenesisConversationAcquisitionInventory,
): boolean {
  return (
    inventory.gapCounts.notYetAcquired >
      0 ||
    inventory.gapCounts.historicallyUnavailable >
      0 ||
    inventory.gapCounts.permissionBlocked >
      0 ||
    inventory.gapCounts.sourceUnavailable >
      0
  );
}


export function buildGenesisConversationAuthoritativeCompletenessEvidence(
  input: {
    candidate:
      GenesisConversationExpectedHistoryCandidate |
      null;

    review:
      GenesisConversationExpectedHistoryCandidateReview |
      null;

    acquisition:
      GenesisConversationAcquisitionInventory;

    authoritativeExpectedHistoryCreated:
      boolean;
  },
): GenesisConversationAuthoritativeCompletenessEvidence {
  const blockers:
    string[] =
      [];

  const {
    candidate,
    review,
    acquisition,
  } = input;

  if (
    !candidate
  ) {
    blockers.push(
      "conversation-expected-history-candidate-unavailable",
    );
  }

  if (
    !review
  ) {
    blockers.push(
      "conversation-expected-history-candidate-review-unavailable",
    );
  }

  if (
    review &&
    review.state !==
      "SCOPE_ATTESTED"
  ) {
    blockers.push(
      "conversation-candidate-scope-not-attested",
    );
  }

  if (
    review &&
    review.knownOmissions.length >
      0
  ) {
    blockers.push(
      "conversation-candidate-known-omissions-present",
    );
  }

  if (
    acquisition.historyState !==
      "ACQUIRED"
  ) {
    blockers.push(
      "conversation-history-not-acquired",
    );
  }

  if (
    hasAcquisitionGaps(
      acquisition,
    )
  ) {
    blockers.push(
      "conversation-acquisition-gaps-present",
    );
  }

  if (
    candidate &&
    candidate.sourceAcquisitionId !==
      acquisition.acquisitionId
  ) {
    blockers.push(
      "conversation-candidate-acquisition-mismatch",
    );
  }

  if (
    candidate &&
    candidate.conversationCount !==
      acquisition.conversationCount
  ) {
    blockers.push(
      "conversation-candidate-count-mismatch",
    );
  }

  if (
    candidate &&
    !sameIds(
      candidate.conversations.map(
        conversation =>
          conversation.conversationId,
      ),
      acquisition.acquiredConversationIds,
    )
  ) {
    blockers.push(
      "conversation-candidate-identity-set-mismatch",
    );
  }

  if (
    review &&
    candidate &&
    review.candidateId !==
      candidate.candidateId
  ) {
    blockers.push(
      "conversation-review-candidate-mismatch",
    );
  }

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const structurallyReady =
    normalizedBlockers.length ===
      0;

  const state:
    GenesisConversationAuthoritativeCompletenessEvidenceState =
      !candidate ||
      !review
        ? "UNAVAILABLE"
        : structurallyReady
          ? "READY_FOR_REVIEW"
          : "BLOCKED";

  return {
    state,

    candidateId:
      candidate?.candidateId ??
      null,

    reviewId:
      review?.reviewId ??
      null,

    acquisitionId:
      acquisition.acquisitionId,

    acquisitionInventoryId:
      acquisition.inventoryId,

    candidateConversationCount:
      candidate?.conversationCount ??
      0,

    acquiredConversationCount:
      acquisition.conversationCount,

    projectCount:
      review?.candidateProjectIds.length ??
      0,

    historicalSourceCount:
      acquisition.historicalSourceCount,

    evidenceCount:
      acquisition.evidenceCount,

    knownOmissionCount:
      review?.knownOmissions.length ??
      0,

    gapCounts:
      acquisition.gapCounts,

    blockers:
      structurallyReady
        ? [
            "authoritative-completeness-evidence-not-certified",
          ]
        : normalizedBlockers,

    authoritativeCompletenessEvidenceCertified:
      false,

    authoritativeExpectedHistoryCreated:
      input.authoritativeExpectedHistoryCreated,

    authoritativeExpectedHistoryCreationAvailable:
      false,

    dayZeroConversationCoverageCertified:
      false,

    promotionAvailable:
      false,
  };
}
