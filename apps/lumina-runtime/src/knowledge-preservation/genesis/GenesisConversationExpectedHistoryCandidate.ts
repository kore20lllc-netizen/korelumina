import {
  createHash,
} from "node:crypto";

import type {
  GenesisConversationAcquisitionRecord,
} from "./GenesisConversationAcquisitionExecution.js";


export const GENESIS_EXPECTED_HISTORY_CANDIDATE_AUTHORITY_STATE =
  "CANDIDATE" as const;


export interface GenesisConversationExpectedHistoryCandidateRecord {
  conversationId:
    string;

  projectId:
    string | null;

  sourceLocator:
    string;

  firstKnownAt:
    number;

  lastKnownAt:
    number;

  basis:
    string;
}


export interface GenesisConversationExpectedHistoryCandidate {
  candidateId:
    `genesis-conversation-expected-history-candidate:${string}`;

  authorityState:
    typeof GENESIS_EXPECTED_HISTORY_CANDIDATE_AUTHORITY_STATE;

  dayZeroConversationCoverageCertified:
    false;

  generatedAt:
    number;

  sourceAcquisitionId:
    string;

  sourceId:
    string;

  conversationCount:
    number;

  conversations:
    readonly GenesisConversationExpectedHistoryCandidateRecord[];

  blockers:
    readonly string[];
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
              record[
                key
              ],
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


function conversationLocator(
  locator:
    string,
): string {
  const hashIndex =
    locator.indexOf(
      "#",
    );

  return hashIndex >=
    0
    ? locator.slice(
        0,
        hashIndex,
      )
    : locator;
}


export function buildGenesisConversationExpectedHistoryCandidate(
  acquisition:
    GenesisConversationAcquisitionRecord,

  generatedAt:
    number = Date.now(),
): GenesisConversationExpectedHistoryCandidate {
  if (
    !Number.isFinite(
      generatedAt,
    ) ||
    generatedAt <
      0
  ) {
    throw new Error(
      "genesis_conversation_expected_history_candidate_generated_at_invalid",
    );
  }

  if (
    acquisition.state !==
      "ACQUIRED"
  ) {
    throw new Error(
      "genesis_conversation_expected_history_candidate_acquisition_required",
    );
  }

  const byConversation =
    new Map<
      string,
      GenesisConversationExpectedHistoryCandidateRecord
    >();

  for (
    const source
    of acquisition.historicalSources
  ) {
    const conversationId =
      typeof source.metadata
        ?.conversationId ===
        "string"
        ? source.metadata
            .conversationId
            .trim()
        : "";

    if (
      conversationId.length ===
        0
    ) {
      throw new Error(
        "genesis_conversation_expected_history_candidate_conversation_identity_missing",
      );
    }

    const projectId =
      typeof source.metadata
        ?.projectId ===
        "string"
        ? source.metadata
            .projectId
        : null;

    const locator =
      conversationLocator(
        source.provenance
          .locator,
      );

    const timestamp =
      source
        .historicalTimestamp
        .value;

    const existing =
      byConversation.get(
        conversationId,
      );

    if (
      !existing
    ) {
      byConversation.set(
        conversationId,
        {
          conversationId,

          projectId,

          sourceLocator:
            locator,

          firstKnownAt:
            timestamp,

          lastKnownAt:
            timestamp,

          basis:
            `derived-from-governed-acquisition:${acquisition.acquisitionId}`,
        },
      );

      continue;
    }

    if (
      existing.projectId !==
        projectId
    ) {
      throw new Error(
        "genesis_conversation_expected_history_candidate_project_identity_conflict",
      );
    }

    if (
      existing.sourceLocator !==
        locator
    ) {
      throw new Error(
        "genesis_conversation_expected_history_candidate_source_locator_conflict",
      );
    }

    existing.firstKnownAt =
      Math.min(
        existing.firstKnownAt,
        timestamp,
      );

    existing.lastKnownAt =
      Math.max(
        existing.lastKnownAt,
        timestamp,
      );
  }

  const conversations =
    [
      ...byConversation
        .values(),
    ]
      .sort(
        (
          left,
          right,
        ) =>
          left.conversationId
            .localeCompare(
              right.conversationId,
            ),
      );

  const acquiredIds =
    [
      ...acquisition
        .conversationIds,
    ]
      .sort();

  const candidateIds =
    conversations.map(
      conversation =>
        conversation.conversationId,
    );

  if (
    JSON.stringify(
      acquiredIds,
    ) !==
    JSON.stringify(
      candidateIds,
    )
  ) {
    throw new Error(
      "genesis_conversation_expected_history_candidate_acquisition_mismatch",
    );
  }

  const identity = {
    sourceAcquisitionId:
      acquisition.acquisitionId,

    sourceId:
      acquisition.sourceId,

    conversations,
  };

  return {
    candidateId:
      `genesis-conversation-expected-history-candidate:${hash(
        identity,
      )}`,

    authorityState:
      GENESIS_EXPECTED_HISTORY_CANDIDATE_AUTHORITY_STATE,

    dayZeroConversationCoverageCertified:
      false,

    generatedAt,

    sourceAcquisitionId:
      acquisition.acquisitionId,

    sourceId:
      acquisition.sourceId,

    conversationCount:
      conversations.length,

    conversations,

    blockers: [
      "authoritative-conversation-history-inventory-not-certified",
    ],
  };
}
