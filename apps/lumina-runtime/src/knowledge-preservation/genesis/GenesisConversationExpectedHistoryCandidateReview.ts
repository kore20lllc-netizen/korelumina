import {
  createHash,
} from "node:crypto";

import type {
  GenesisConversationExpectedHistoryCandidate,
} from "./GenesisConversationExpectedHistoryCandidate.js";


export type GenesisConversationExpectedHistoryCandidateReviewState =
  | "PENDING_REVIEW"
  | "SCOPE_ATTESTED"
  | "GAPS_DECLARED"
  | "REJECTED";


export interface GenesisConversationExpectedHistoryCandidateKnownOmission {
  description:
    string;

  projectId?:
    string;

  conversationId?:
    string;

  basis:
    string;
}


export interface GenesisConversationExpectedHistoryCandidateReview {
  reviewId:
    `genesis-conversation-expected-history-candidate-review:${string}`;

  candidateId:
    GenesisConversationExpectedHistoryCandidate[
      "candidateId"
    ];

  state:
    GenesisConversationExpectedHistoryCandidateReviewState;

  reviewedBy:
    string | null;

  reviewedAt:
    number | null;

  candidateConversationCount:
    number;

  candidateProjectIds:
    readonly string[];

  knownOmissions:
    readonly GenesisConversationExpectedHistoryCandidateKnownOmission[];

  notes:
    string | null;

  authoritativeExpectedHistoryCreated:
    false;

  dayZeroConversationCoverageCertified:
    false;

  promotionAvailable:
    false;
}


function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          key => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}


function hash(
  value:
    unknown,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        stableNormalize(
          value,
        ),
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}


function requireNonEmpty(
  value:
    string,

  error:
    string,
): string {
  const normalized =
    value.trim();

  if (
    normalized.length ===
      0
  ) {
    throw new Error(
      error,
    );
  }

  return normalized;
}


export function buildGenesisConversationExpectedHistoryCandidatePendingReview(
  candidate:
    GenesisConversationExpectedHistoryCandidate,
): GenesisConversationExpectedHistoryCandidateReview {
  const projectIds =
    [
      ...new Set(
        candidate
          .conversations
          .map(
            conversation =>
              conversation.projectId,
          )
          .filter(
            (
              projectId,
            ): projectId is string =>
              typeof projectId ===
                "string" &&
              projectId.length >
                0,
          ),
      ),
    ]
      .sort();

  const identity = {
    candidateId:
      candidate.candidateId,

    state:
      "PENDING_REVIEW",

    candidateConversationCount:
      candidate.conversationCount,

    candidateProjectIds:
      projectIds,
  };

  return {
    reviewId:
      `genesis-conversation-expected-history-candidate-review:${hash(
        identity,
      )}`,

    candidateId:
      candidate.candidateId,

    state:
      "PENDING_REVIEW",

    reviewedBy:
      null,

    reviewedAt:
      null,

    candidateConversationCount:
      candidate.conversationCount,

    candidateProjectIds:
      projectIds,

    knownOmissions:
      [],

    notes:
      null,

    authoritativeExpectedHistoryCreated:
      false,

    dayZeroConversationCoverageCertified:
      false,

    promotionAvailable:
      false,
  };
}


export function reviewGenesisConversationExpectedHistoryCandidate(
  current:
    GenesisConversationExpectedHistoryCandidateReview,

  input: {
    decision:
      "ATTEST_SCOPE"
      | "DECLARE_GAPS"
      | "REJECT";

    reviewedBy:
      string;

    reviewedAt:
      number;

    knownOmissions?:
      readonly GenesisConversationExpectedHistoryCandidateKnownOmission[];

    notes?:
      string;
  },
): GenesisConversationExpectedHistoryCandidateReview {
  if (
    current.state !==
      "PENDING_REVIEW"
  ) {
    throw new Error(
      "genesis_conversation_expected_history_candidate_review_already_decided",
    );
  }

  const reviewedBy =
    requireNonEmpty(
      input.reviewedBy,
      "genesis_conversation_expected_history_candidate_reviewer_required",
    );

  if (
    !Number.isFinite(
      input.reviewedAt,
    ) ||
    input.reviewedAt <
      0
  ) {
    throw new Error(
      "genesis_conversation_expected_history_candidate_reviewed_at_invalid",
    );
  }

  const knownOmissions =
    [
      ...(
        input.knownOmissions ??
        []
      ),
    ]
      .map(
        omission => ({
          ...omission,

          description:
            requireNonEmpty(
              omission.description,
              "genesis_conversation_expected_history_candidate_omission_description_required",
            ),

          basis:
            requireNonEmpty(
              omission.basis,
              "genesis_conversation_expected_history_candidate_omission_basis_required",
            ),
        }),
      );

  if (
    input.decision ===
      "ATTEST_SCOPE" &&
    knownOmissions.length >
      0
  ) {
    throw new Error(
      "genesis_conversation_expected_history_candidate_attested_scope_cannot_declare_gaps",
    );
  }

  if (
    input.decision ===
      "DECLARE_GAPS" &&
    knownOmissions.length ===
      0
  ) {
    throw new Error(
      "genesis_conversation_expected_history_candidate_declared_gaps_required",
    );
  }

  const state:
    GenesisConversationExpectedHistoryCandidateReviewState =
      input.decision ===
        "ATTEST_SCOPE"
        ? "SCOPE_ATTESTED"
        : input.decision ===
            "DECLARE_GAPS"
          ? "GAPS_DECLARED"
          : "REJECTED";

  const notes =
    input.notes
      ?.trim() ||
    null;

  return {
    ...current,

    state,

    reviewedBy,

    reviewedAt:
      input.reviewedAt,

    knownOmissions,

    notes,

    authoritativeExpectedHistoryCreated:
      false,

    dayZeroConversationCoverageCertified:
      false,

    promotionAvailable:
      false,
  };
}
