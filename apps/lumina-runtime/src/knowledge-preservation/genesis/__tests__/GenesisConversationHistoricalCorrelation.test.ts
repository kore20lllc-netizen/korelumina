import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyGenesisHistoricalAdmission,
} from "../GenesisHistoricalAdmissionGovernancePolicy.js";

import {
  materializeGenesisHistoricalCorrelation,
} from "../GenesisHistoricalCorrelationMaterializer.js";

import type {
  GenesisReplayExecution,
} from "../GenesisReplayExecution.js";


function execution():
  GenesisReplayExecution {
  const conversationSourceId =
    "genesis-historical-source:conversation:test" as
      GenesisReplayExecution[
        "manifest"
      ]["entries"][number]["historicalSourceId"];

  const commitSourceId =
    "genesis-historical-source:commit:test" as
      GenesisReplayExecution[
        "manifest"
      ]["entries"][number]["historicalSourceId"];

  return {
    plan: {
      replayId:
        "genesis-replay:test" as
          GenesisReplayExecution[
            "plan"
          ]["replayId"],

      manifestId:
        "genesis-source-manifest:test",

      replayContractVersion:
        "1.0",

      entries: [
        {
          manifestIndex:
            0,

          historicalSourceId:
            conversationSourceId,

          sourceChecksum:
            "conversation-checksum",

          action:
            "ADMIT",
        },

        {
          manifestIndex:
            1,

          historicalSourceId:
            commitSourceId,

          sourceChecksum:
            "commit-checksum",

          action:
            "ADMIT",
        },
      ],

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

      readiness:
        "READY",
    },

    manifest: {
      manifestId:
        "genesis-source-manifest:test",

      replayContractVersion:
        "1.0",

      scope: {
        mode:
          "partial",

        repository:
          "korelumina",

        includedEvidenceTypes: [
          "conversation",
          "commit",
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

      discoveredAt:
        1000,

      entries: [
        {
          historicalSourceId:
            conversationSourceId,

          sourceType:
            "conversation",

          evidenceType:
            "conversation",

          authorityClass:
            "external-conversation-evidence",

          authorityOwner:
            "chatgpt-data-export",

          authorityScope:
            "korelumina",

          authorityVersion:
            "revision-1",

          provenanceLocator:
            "chatgpt-export://conversations.json#conversation=conversation-001&message=message-001",

          sourceChecksum:
            "conversation-checksum",

          historicalTimestamp:
            100,

          historicalTimestampSource:
            "authoritative-conversation-message-timestamp",

          discoveredAt:
            900,

          discoveryMethod:
            "chatgpt-export-json-v1",

          replayEligibility:
            "eligible",

          supersedes:
            [],

          conflictsWith:
            [],

          metadata: {
            conversationId:
              "conversation-001",

            messageId:
              "message-001",

            speakerRole:
              "user",

            messageOrder:
              0,
          },
        },

        {
          historicalSourceId:
            commitSourceId,

          sourceType:
            "commit",

          evidenceType:
            "commit",

          authorityClass:
            "repository-history",

          provenanceLocator:
            "git://commit-001",

          sourceChecksum:
            "commit-checksum",

          historicalTimestamp:
            200,

          historicalTimestampSource:
            "git-commit-time",

          discoveredAt:
            900,

          discoveryMethod:
            "git-history",

          replayEligibility:
            "eligible",

          supersedes:
            [],

          conflictsWith:
            [],

          metadata: {
            subject:
              "Implement historical requirement",
          },
        },
      ],
    },

    state: {
      replayId:
        "genesis-replay:test" as
          GenesisReplayExecution[
            "state"
          ]["replayId"],

      manifestId:
        "genesis-source-manifest:test",

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

      dispositions: [
        {
          historicalSourceId:
            conversationSourceId,

          disposition:
            "ADMITTED",

          evidenceId:
            "conversation-evidence-001",
        },

        {
          historicalSourceId:
            commitSourceId,

          disposition:
            "ADMITTED",

          evidenceId:
            "commit-evidence-001",
        },
      ],

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
  "conversation Evidence is correlation eligible but never auto-manufacturing eligible",
  () => {
    const input =
      execution()
        .manifest
        .entries[0];

    const decision =
      classifyGenesisHistoricalAdmission(
        input,
      );

    assert.equal(
      decision.classification,
      "historical-correlation-eligible",
    );

    assert.equal(
      decision.correlationEligible,
      true,
    );

    assert.equal(
      decision.invokeKnowledgeManufacturing,
      false,
    );
  },
);


test(
  "admitted conversation source projects as acquired external context",
  () => {
    const correlation =
      materializeGenesisHistoricalCorrelation(
        execution(),
      );

    const conversation =
      correlation
        .sourceReferences
        .find(
          source =>
            source.evidenceType ===
            "conversation",
        );

    assert.ok(
      conversation,
    );

    assert.equal(
      conversation.provenance.externalSource,
      true,
    );

    assert.equal(
      conversation.integrity.acquisitionState,
      "acquired",
    );
  },
);


test(
  "conversation and repository evidence become independent Historical Events",
  () => {
    const correlation =
      materializeGenesisHistoricalCorrelation(
        execution(),
      );

    assert.equal(
      correlation.events.length,
      2,
    );

    assert.equal(
      correlation.sourceReferences.length,
      2,
    );
  },
);


test(
  "chronology may connect conversation and commit but does not establish causality",
  () => {
    const correlation =
      materializeGenesisHistoricalCorrelation(
        execution(),
      );

    const chronological =
      correlation.relationships.filter(
        relationship =>
          relationship.type ===
          "occurred_before",
      );

    assert.equal(
      chronological.length,
      1,
    );

    assert.equal(
      chronological[0].causal,
      false,
    );

    assert.equal(
      chronological[0].evidence.mode,
      "temporal-order",
    );

    assert.equal(
      correlation.relationships.some(
        relationship =>
          relationship.type ===
          "caused",
      ),
      false,
    );
  },
);


test(
  "chronological adjacency alone does not create an Evolution Episode",
  () => {
    const correlation =
      materializeGenesisHistoricalCorrelation(
        execution(),
      );

    assert.equal(
      correlation.episodes.length,
      0,
    );
  },
);
