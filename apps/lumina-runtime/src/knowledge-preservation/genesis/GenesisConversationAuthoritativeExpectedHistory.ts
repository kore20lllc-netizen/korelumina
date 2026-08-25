import {
  buildGenesisConversationExpectedHistoryInventory,
} from "./GenesisConversationExpectedHistoryInventory.js";

import type {
  GenesisConversationExpectedHistoryInventory,
} from "./GenesisConversationExpectedHistoryInventory.js";

import type {
  GenesisConversationExpectedHistoryCandidate,
} from "./GenesisConversationExpectedHistoryCandidate.js";

import type {
  GenesisConversationAuthoritativeCompletenessCertification,
} from "./GenesisConversationAuthoritativeCompletenessCertification.js";


export const GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_CLASS =
  "GENESIS_CONVERSATION_AUTHORITATIVE_COMPLETENESS_CERTIFICATION" as const;

export const GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_VERSION =
  "genesis-conversation-expected-history-authority:v1" as const;

export const GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_SCOPE =
  "governed-attested-conversation-history-corpus" as const;


export function buildGenesisConversationAuthoritativeExpectedHistory(
  input: {
    candidate:
      GenesisConversationExpectedHistoryCandidate;

    certification:
      GenesisConversationAuthoritativeCompletenessCertification;
  },
): GenesisConversationExpectedHistoryInventory {
  const {
    candidate,
    certification,
  } = input;

  if (
    certification.state !==
      "CERTIFIED"
  ) {
    throw new Error(
      "genesis_conversation_authoritative_expected_history_certification_required",
    );
  }

  if (
    certification.candidateId !==
      candidate.candidateId
  ) {
    throw new Error(
      "genesis_conversation_authoritative_expected_history_candidate_mismatch",
    );
  }

  if (
    certification.candidateConversationCount !==
      candidate.conversationCount
  ) {
    throw new Error(
      "genesis_conversation_authoritative_expected_history_count_mismatch",
    );
  }

  if (
    certification.knownOmissionCount !==
      0
  ) {
    throw new Error(
      "genesis_conversation_authoritative_expected_history_known_omissions_present",
    );
  }

  if (
    candidate.conversations.length !==
      candidate.conversationCount
  ) {
    throw new Error(
      "genesis_conversation_authoritative_expected_history_candidate_count_invalid",
    );
  }

  const timestamps =
    candidate.conversations
      .flatMap(
        conversation => [
          conversation.firstKnownAt,
          conversation.lastKnownAt,
        ],
      )
      .filter(
        value =>
          Number.isFinite(
            value,
          ),
      );

  const historicalStart =
    timestamps.length >
      0
      ? Math.min(
          ...timestamps,
        )
      : undefined;

  const historicalEnd =
    timestamps.length >
      0
      ? Math.max(
          ...timestamps,
        )
      : undefined;

  return buildGenesisConversationExpectedHistoryInventory({
    authority: {
      authorityId:
        certification.certificationId,

      authorityClass:
        GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_CLASS,

      certifiedBy:
        certification.certifiedBy,

      certifiedAt:
        certification.certifiedAt,

      scope:
        GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_SCOPE,

      version:
        GENESIS_CONVERSATION_EXPECTED_HISTORY_AUTHORITY_VERSION,
    },

    historicalStart,

    historicalEnd,

    conversations:
      candidate.conversations.map(
        conversation => ({
          conversationId:
            conversation.conversationId,

          disposition:
            "EXPECTED_RECOVERABLE" as const,

          ...(conversation.projectId
            ? {
                projectId:
                  conversation.projectId,
              }
            : {}),

          sourceLocator:
            conversation.sourceLocator,

          firstKnownAt:
            conversation.firstKnownAt,

          lastKnownAt:
            conversation.lastKnownAt,

          basis:
            [
              "certified-authoritative-completeness",
              certification.certificationId,
              candidate.candidateId,
            ].join(
              ":",
            ),
        }),
      ),
  });
}
