import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisConversationExpectedHistoryCandidate,
} from "../GenesisConversationExpectedHistoryCandidate.js";

import type {
  GenesisConversationAcquisitionRecord,
} from "../GenesisConversationAcquisitionExecution.js";


function acquisition():
  GenesisConversationAcquisitionRecord {
  return {
    acquisitionId:
      "acquisition-browser",

    state:
      "ACQUIRED",

    sourceId:
      "runtime-chatgpt-browser-conversation-history-v1",

    firstAcquiredAt:
      1000,

    lastAcquiredAt:
      1000,

    completedAt:
      1100,

    occurrenceCount:
      1,

    occurrences: [
      {
        acquiredAt:
          1000,

        completedAt:
          1100,
      },
    ],

    conversationIds: [
      "conversation-a",
      "conversation-b",
    ],

    gaps:
      [],

    conversationCount:
      2,

    historicalSourceCount:
      3,

    evidenceCount:
      3,

    errors:
      [],

    historicalSources: [
      {
        historicalSourceId:
          "genesis-source:conversation:a1",

        sourceClass:
          "conversation",

        evidenceType:
          "conversation",

        stableSourceKey:
          "conversation:a:1",

        sourceChecksum:
          "a1",

        provenance: {
          locator:
            "https://chatgpt.com/g/g-p-project-a/c/conversation-a#browser-turn=0",
        },

        historicalTimestamp: {
          value:
            100,

          source:
            "authoritative-conversation-message-timestamp",
        },

        discoveredAt:
          1000,

        discoveryMethod:
          "authenticated-browser-recovery",

        authority: {
          authorityClass:
            "external-conversation-evidence",

          owner:
            "openai-chatgpt",

          scope:
            "g-p-project-a",
        },

        replayEligibility:
          "eligible",

        supersedes:
          [],

        conflictsWith:
          [],

        metadata: {
          conversationId:
            "conversation-a",

          projectId:
            "g-p-project-a",
        },
      },

      {
        historicalSourceId:
          "genesis-source:conversation:a2",

        sourceClass:
          "conversation",

        evidenceType:
          "conversation",

        stableSourceKey:
          "conversation:a:2",

        sourceChecksum:
          "a2",

        provenance: {
          locator:
            "https://chatgpt.com/g/g-p-project-a/c/conversation-a#browser-turn=1",
        },

        historicalTimestamp: {
          value:
            200,

          source:
            "authoritative-conversation-message-timestamp",
        },

        discoveredAt:
          1000,

        discoveryMethod:
          "authenticated-browser-recovery",

        authority: {
          authorityClass:
            "external-conversation-evidence",

          owner:
            "openai-chatgpt",

          scope:
            "g-p-project-a",
        },

        replayEligibility:
          "eligible",

        supersedes:
          [],

        conflictsWith:
          [],

        metadata: {
          conversationId:
            "conversation-a",

          projectId:
            "g-p-project-a",
        },
      },

      {
        historicalSourceId:
          "genesis-source:conversation:b1",

        sourceClass:
          "conversation",

        evidenceType:
          "conversation",

        stableSourceKey:
          "conversation:b:1",

        sourceChecksum:
          "b1",

        provenance: {
          locator:
            "https://chatgpt.com/g/g-p-project-b/c/conversation-b#browser-turn=0",
        },

        historicalTimestamp: {
          value:
            300,

          source:
            "authoritative-conversation-message-timestamp",
        },

        discoveredAt:
          1000,

        discoveryMethod:
          "authenticated-browser-recovery",

        authority: {
          authorityClass:
            "external-conversation-evidence",

          owner:
            "openai-chatgpt",

          scope:
            "g-p-project-b",
        },

        replayEligibility:
          "eligible",

        supersedes:
          [],

        conflictsWith:
          [],

        metadata: {
          conversationId:
            "conversation-b",

          projectId:
            "g-p-project-b",
        },
      },
    ],

    evidence:
      [],
  };
}


test(
  "candidate remains explicitly non-authoritative",
  () => {
    const candidate =
      buildGenesisConversationExpectedHistoryCandidate(
        acquisition(),
        2000,
      );

    assert.equal(
      candidate.authorityState,
      "CANDIDATE",
    );

    assert.equal(
      candidate.dayZeroConversationCoverageCertified,
      false,
    );

    assert.deepEqual(
      candidate.blockers,
      [
        "authoritative-conversation-history-inventory-not-certified",
      ],
    );
  },
);


test(
  "candidate collapses message evidence into conversation history",
  () => {
    const candidate =
      buildGenesisConversationExpectedHistoryCandidate(
        acquisition(),
        2000,
      );

    assert.equal(
      candidate.conversationCount,
      2,
    );

    assert.deepEqual(
      candidate.conversations,
      [
        {
          conversationId:
            "conversation-a",

          projectId:
            "g-p-project-a",

          sourceLocator:
            "https://chatgpt.com/g/g-p-project-a/c/conversation-a",

          firstKnownAt:
            100,

          lastKnownAt:
            200,

          basis:
            "derived-from-governed-acquisition:acquisition-browser",
        },

        {
          conversationId:
            "conversation-b",

          projectId:
            "g-p-project-b",

          sourceLocator:
            "https://chatgpt.com/g/g-p-project-b/c/conversation-b",

          firstKnownAt:
            300,

          lastKnownAt:
            300,

          basis:
            "derived-from-governed-acquisition:acquisition-browser",
        },
      ],
    );
  },
);


test(
  "candidate identity is stable across regeneration",
  () => {
    const first =
      buildGenesisConversationExpectedHistoryCandidate(
        acquisition(),
        2000,
      );

    const second =
      buildGenesisConversationExpectedHistoryCandidate(
        acquisition(),
        3000,
      );

    assert.equal(
      first.candidateId,
      second.candidateId,
    );

    assert.notEqual(
      first.generatedAt,
      second.generatedAt,
    );
  },
);
