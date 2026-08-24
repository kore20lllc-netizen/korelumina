import assert from "node:assert/strict";
import test from "node:test";

import {
  acquireGenesisHistoricalConversation,
} from "../GenesisConversationAcquisition.js";

import {
  materializeGenesisHistoricalCorrelation,
} from "../GenesisHistoricalCorrelationMaterializer.js";

import type {
  GenesisHistoricalConversationInput,
} from "../GenesisConversationAcquisition.js";

import type {
  GenesisReplayExecution,
} from "../GenesisReplayExecution.js";

import type {
  HistoricalSource,
  HistoricalSourceId,
} from "../HistoricalSource.js";


function conversation(
  target:
    HistoricalSourceId,
): GenesisHistoricalConversationInput {
  return {
    conversationId:
      "conversation-001",

    projectId:
      "korelumina",

    title:
      "Architecture discussion",

    acquisition: {
      provider:
        "chatgpt-data-export",

      acquisitionMethod:
        "chatgpt-export-json-v1",

      acquiredAt:
        1000,

      sourceLocator:
        "chatgpt-export://conversations.json",
    },

    privacy: {
      sensitivity:
        "standard",

      containsPersonalData:
        false,
    },

    messages: [
      {
        messageId:
          "message-001",

        role:
          "user",

        order:
          0,

        timestamp:
          200,

        availability:
          "available",

        content:
          "Replace the previous architecture.",

        explicitHistoricalRelationships: [
          {
            type:
              "supersedes",

            historicalSourceId:
              target,

            basis:
              "Human-governed explicit historical relationship.",
          },
        ],
      },
    ],
  };
}


test(
  "explicit supersession is preserved on conversation HistoricalSource",
  () => {
    const target =
      "genesis-source:commit:target" as
        HistoricalSourceId;

    const result =
      acquireGenesisHistoricalConversation(
        conversation(
          target,
        ),
      );

    assert.deepEqual(
      result.messages[0]
        .historicalSource
        .supersedes,
      [
        target,
      ],
    );

    assert.deepEqual(
      result.messages[0]
        .historicalSource
        .conflictsWith,
      [],
    );
  },
);


test(
  "explicit relationships affect deterministic source checksum",
  () => {
    const firstTarget =
      "genesis-source:commit:first" as
        HistoricalSourceId;

    const secondTarget =
      "genesis-source:commit:second" as
        HistoricalSourceId;

    const first =
      acquireGenesisHistoricalConversation(
        conversation(
          firstTarget,
        ),
      );

    const second =
      acquireGenesisHistoricalConversation(
        conversation(
          secondTarget,
        ),
      );

    assert.notEqual(
      first.messages[0]
        .historicalSource
        .sourceChecksum,
      second.messages[0]
        .historicalSource
        .sourceChecksum,
    );
  },
);


test(
  "duplicate explicit relationships are rejected",
  () => {
    const target =
      "genesis-source:commit:target" as
        HistoricalSourceId;

    const input =
      conversation(
        target,
      );

    const modifiedInput:
      GenesisHistoricalConversationInput = {
      ...input,

      messages: [
        {
          ...input.messages[0],

          explicitHistoricalRelationships: [
            {
              type:
                "supersedes",

              historicalSourceId:
                target,

              basis:
                "first",
            },

            {
              type:
                "supersedes",

              historicalSourceId:
                target,

              basis:
                "duplicate",
            },
          ],
        },

        ...input.messages.slice(
          1,
        ),
      ],
    };

    assert.throws(
      () =>
        acquireGenesisHistoricalConversation(
          modifiedInput,
        ),
      /duplicate_historical_relationship/,
    );
  },
);


function executionWithExplicitSupersession():
  GenesisReplayExecution {
  const targetId =
    "genesis-source:commit:target" as
      HistoricalSourceId;

  const acquired =
    acquireGenesisHistoricalConversation(
      conversation(
        targetId,
      ),
    );

  const conversationSource =
    acquired.messages[0]
      .historicalSource;

  const targetSource:
    HistoricalSource = {
      historicalSourceId:
        targetId,

      sourceClass:
        "commit",

      evidenceType:
        "commit",

      stableSourceKey:
        "commit:target",

      sourceChecksum:
        "target-checksum",

      provenance: {
        locator:
          "git://target",
      },

      historicalTimestamp: {
        value:
          100,

        source:
          "git-commit-time",
      },

      discoveredAt:
        1000,

      discoveryMethod:
        "git-history",

      authority: {
        authorityClass:
          "repository-history",
      },

      replayEligibility:
        "eligible",

      supersedes:
        [],

      conflictsWith:
        [],

      metadata: {
        subject:
          "Previous architecture",
      },
    };

  const entries =
    [
      targetSource,
      conversationSource,
    ].map(
      source => ({
        historicalSourceId:
          source.historicalSourceId,

        sourceType:
          source.sourceClass,

        evidenceType:
          source.evidenceType,

        authorityClass:
          source.authority.authorityClass,

        authorityOwner:
          source.authority.owner,

        authorityScope:
          source.authority.scope,

        authorityVersion:
          source.authority.version,

        provenanceLocator:
          source.provenance.locator,

        sourceChecksum:
          source.sourceChecksum,

        historicalTimestamp:
          source.historicalTimestamp.value,

        historicalTimestampSource:
          source.historicalTimestamp.source,

        discoveredAt:
          source.discoveredAt,

        discoveryMethod:
          source.discoveryMethod,

        replayEligibility:
          source.replayEligibility,

        supersedes:
          source.supersedes,

        conflictsWith:
          source.conflictsWith,

        metadata:
          source.metadata,
      }),
    );

  return {
    plan: {
      replayId:
        "genesis-replay:explicit-link" as
          GenesisReplayExecution["plan"]["replayId"],

      manifestId:
        "genesis-source-manifest:explicit-link",

      replayContractVersion:
        "1.0",

      readiness:
        "READY",

      entries:
        entries.map(
          (
            entry,
            manifestIndex,
          ) => ({
            manifestIndex,

            historicalSourceId:
              entry.historicalSourceId,

            sourceChecksum:
              entry.sourceChecksum,

            action:
              "ADMIT" as const,
          }),
        ),

      summary: {
        totalSources:
          2,

        admit:
          2,

        skipScope:
          0,

        block:
          0,
      },
    },

    manifest: {
      manifestId:
        "genesis-source-manifest:explicit-link",

      replayContractVersion:
        "1.0",

      scope: {
        mode:
          "partial",

        repository:
          "korelumina",

        includedEvidenceTypes: [
          "commit",
          "conversation",
        ],

        excludedEvidenceTypes:
          [],

        explicitlyExcludedSourceIds:
          [],

        governancePolicyVersion:
          "test-v1",

        replayContractVersion:
          "1.0",
      },

      entries,

      discoveredAt:
        1000,
    },

    state: {
      replayId:
        "genesis-replay:explicit-link" as
          GenesisReplayExecution["state"]["replayId"],

      manifestId:
        "genesis-source-manifest:explicit-link",

      replayContractVersion:
        "1.0",

      status:
        "completed",

      corpusStatus:
        "COMPLETE",

      currentManifestIndex:
        null,

      currentHistoricalSourceId:
        null,

      lastCompletedManifestIndex:
        1,

      dispositions:
        entries.map(
          entry => ({
            historicalSourceId:
              entry.historicalSourceId,

            disposition:
              "ADMITTED" as const,

            evidenceId:
              `evidence:${entry.historicalSourceId}`,
          }),
        ),

      progress: {
        totalSources:
          2,

        completedSources:
          2,

        admittedSources:
          2,

        skippedSources:
          0,

        blockedSources:
          0,
      },

      startedAt:
        1000,

      completedAt:
        1100,

      blockedAt:
        null,

      failedAt:
        null,

      failureReason:
        null,
    },

    checkpoint:
      null,
  };
}


test(
  "explicit conversation supersession creates a semantic relationship and Evolution Episode",
  () => {
    const correlation =
      materializeGenesisHistoricalCorrelation(
        executionWithExplicitSupersession(),
      );

    const semantic =
      correlation.relationships.filter(
        relationship =>
          relationship.type ===
          "superseded_by",
      );

    assert.equal(
      semantic.length,
      1,
    );

    assert.equal(
      semantic[0].causal,
      false,
    );

    assert.equal(
      semantic[0].confidence,
      "explicit",
    );

    assert.equal(
      correlation.episodes.length,
      1,
    );

    assert.equal(
      correlation.episodes[0]
        .metadata
        .materializationMode,
      "explicit-semantic-component",
    );

    assert.equal(
      correlation.episodes[0]
        .externalContext,
      "complete",
    );
  },
);


test(
  "conversation content alone still cannot create a semantic relationship",
  () => {
    const target =
      "genesis-source:commit:target" as
        HistoricalSourceId;

    const input =
      conversation(
        target,
      );

    const modifiedInput:
      GenesisHistoricalConversationInput = {
      ...input,

      messages: [
        {
          ...input.messages[0],

          explicitHistoricalRelationships:
            [],
        },

        ...input.messages.slice(
          1,
        ),
      ],
    };

    const acquired =
      acquireGenesisHistoricalConversation(
        modifiedInput,
      );

    assert.deepEqual(
      acquired.messages[0]
        .historicalSource
        .supersedes,
      [],
    );

    assert.deepEqual(
      acquired.messages[0]
        .historicalSource
        .conflictsWith,
      [],
    );
  },
);
