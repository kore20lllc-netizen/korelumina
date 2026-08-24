import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisDayZeroCertificationCandidate,
} from "../GenesisDayZeroCertificationCandidate.js";

import type {
  GenesisConversationHistoryReconciliationProjection,
} from "../GenesisConversationHistoryReconciliationService.js";


function repositorySeed(
  state:
    "CERTIFIED" |
    "INCOMPLETE" |
    "BLOCKED" =
      "CERTIFIED",
) {
  return {
    certificationId:
      "genesis-repository-seed-certification:test" as const,

    repositorySeedCorpus:
      state,

    replay: {
      exact:
        true,

      replayCount:
        1,

      totalSources:
        10,

      completedSources:
        10,

      admittedSources:
        10,

      skippedSources:
        0,

      blockedSources:
        0,
    },

    partition: {
      knowledgeSeedingEligible:
        [],

      historicalCorrelationEligible:
        [],

      historicalEvidenceOnly:
        [],

      requiresGovernanceReview:
        [],
    },

    seedEvidenceIds:
      [],

    externalConversationCoverage:
      "COMPLETE" as const,

    broaderEducationalCompleteness:
      "NOT_CERTIFIED" as const,

    blockers:
      [],
  };
}


function corpus() {
  return {
    projectionId:
      "genesis-corpus-projection:test" as const,

    sourceSummary: {
      uniqueSources:
        8,

      sourceRevisions:
        10,

      byClass:
        {},
    },

    evolutionSummary: {
      historicalEvents:
        10,

      relationships:
        5,

      evolutionEpisodes:
        2,

      conflictedEpisodes:
        0,

      incompleteEpisodes:
        0,

      validatedEpisodes:
        0,

      unresolvedRelationships:
        0,
    },

    knowledgeLifecycle: {
      admittedEvidence:
        10,

      manufacturingLinkedEvidence:
        0,

      ambiguousManufacturingLinks:
        0,

      packages:
        0,

      canonicalKnowledge:
        0,

      organizationalMemory: {
        status:
          "not-correlated" as const,

        adaptedRecords:
          null,
      },

      educationalEligibility: {
        status:
          "not-correlated" as const,

        eligibleRecords:
          null,
      },
    },

    externalContext: {
      pendingEpisodes:
        0,

      notYetIngestedConversationSources:
        0,

      externalSourceReferences:
        2,

      complete:
        true,
    },

    replays:
      [],

    sources:
      [],

    events:
      [],

    relationships:
      [],

    episodes:
      [],
  };
}


function conversationHistory():
  GenesisConversationHistoryReconciliationProjection {
  return {
    expectedHistory: {
      inventoryId:
        "genesis-conversation-expected-history:test" as const,

      authority: {
        authorityId:
          "day-zero-authority",

        authorityClass:
          "human-certified-institutional-history",

        certifiedBy:
          "human-governance",

        certifiedAt:
          100,

        scope:
          "day-zero-through-present",

        version:
          "1",
      },

      historicalStart:
        0,

      historicalEnd:
        100,

      conversations: [
        {
          conversationId:
            "conversation-001",

          disposition:
            "EXPECTED_RECOVERABLE" as const,

          basis:
            "authoritative inventory",
        },

        {
          conversationId:
            "conversation-lost",

          disposition:
            "HISTORICALLY_UNAVAILABLE" as const,

          basis:
            "human-certified historical gap",
        },
      ],
    },

    acquisitionInventory: {
      inventoryId:
        "genesis-conversation-acquisition-inventory:test" as const,

      historyState:
        "ACQUIRED" as const,

      completeness:
        "UNVERIFIED" as const,

      configured:
        true,

      acquisitionAvailable:
        true,

      acquisitionId:
        "acquisition-001",

      acquiredConversationIds: [
        "conversation-001",
      ],

      conversationCount:
        1,

      historicalSourceCount:
        1,

      evidenceCount:
        1,

      gapCounts: {
        notYetAcquired:
          0,

        historicallyUnavailable:
          0,

        permissionBlocked:
          0,

        sourceUnavailable:
          0,
      },

      blockers:
        [],

      historicalCompletenessCertified:
        false,
    },

    reconciliation: {
      expectedInventoryId:
        "genesis-conversation-expected-history:test" as const,

      acquisitionInventoryId:
        "genesis-conversation-acquisition-inventory:test" as const,

      state:
        "COMPLETE" as const,

      expectedRecoverableConversationIds: [
        "conversation-001",
      ],

      acquiredExpectedConversationIds: [
        "conversation-001",
      ],

      notYetAcquiredConversationIds:
        [],

      historicallyUnavailableConversationIds: [
        "conversation-lost",
      ],

      unexpectedAcquiredConversationIds:
        [],

      blockers:
        [],

      dayZeroConversationCoverageCertified:
        true,
    },
  };
}


function correlation(
  state:
    "COMPLETE" |
    "INCOMPLETE" =
      "COMPLETE",
) {
  return {
    projectionId:
      "genesis-conversation-correlation-completeness:test" as const,

    state,

    conversationManifestSources:
      1,

    eligibleConversationSources:
      1,

    admittedConversationSources:
      1,

    correlatedConversationSources:
      1,

    correlatedConversationEvents:
      1,

    missingAdmissionHistoricalSourceIds:
      [],

    missingCorrelationHistoricalSourceIds:
      [],

    missingEventHistoricalSourceIds:
      [],

    unresolvedExplicitLinks:
      [],

    crossReplayEnrichedEpisodes:
      1,

    episodeLineageGaps:
      [],

    blockers:
      state ===
        "COMPLETE"
        ? []
        : [
            "conversation-explicit-historical-links-unresolved",
          ],

    dayZeroGenesisCertified:
      false as const,
  };
}


test(
  "complete authoritative inputs produce READY candidate without certifying Day-0 Genesis",
  () => {
    const result =
      buildGenesisDayZeroCertificationCandidate({
        repositorySeedCertification:
          repositorySeed(),

        corpus:
          corpus(),

        conversationHistory:
          conversationHistory(),

        conversationCorrelation:
          correlation(),
      });

    assert.equal(
      result.state,
      "READY",
    );

    assert.equal(
      result.dayZeroGenesisCertified,
      false,
    );

    assert.deepEqual(
      result.visibleHistoricalGaps
        .historicallyUnavailableConversationIds,
      [
        "conversation-lost",
      ],
    );

    assert.deepEqual(
      result.blockers,
      [],
    );
  },
);


test(
  "historically unavailable conversation remains visible but does not block candidate readiness",
  () => {
    const result =
      buildGenesisDayZeroCertificationCandidate({
        repositorySeedCertification:
          repositorySeed(),

        corpus:
          corpus(),

        conversationHistory:
          conversationHistory(),

        conversationCorrelation:
          correlation(),
      });

    assert.equal(
      result.state,
      "READY",
    );

    assert.equal(
      result.conversationHistory
        .historicallyUnavailableConversationIds
        .length,
      1,
    );
  },
);


test(
  "missing authoritative conversation-history assembly is incomplete",
  () => {
    const result =
      buildGenesisDayZeroCertificationCandidate({
        repositorySeedCertification:
          repositorySeed(),

        corpus:
          corpus(),

        conversationHistory:
          null,

        conversationCorrelation:
          correlation(),
      });

    assert.equal(
      result.state,
      "INCOMPLETE",
    );

    assert.ok(
      result.blockers.includes(
        "conversation-history-reconciliation-not-assembled",
      ),
    );

    assert.ok(
      result.blockers.includes(
        "authoritative-conversation-history-inventory-missing",
      ),
    );
  },
);


test(
  "incomplete correlation prevents READY candidate",
  () => {
    const result =
      buildGenesisDayZeroCertificationCandidate({
        repositorySeedCertification:
          repositorySeed(),

        corpus:
          corpus(),

        conversationHistory:
          conversationHistory(),

        conversationCorrelation:
          correlation(
            "INCOMPLETE",
          ),
      });

    assert.equal(
      result.state,
      "INCOMPLETE",
    );

    assert.ok(
      result.blockers.includes(
        "conversation-historical-correlation-incomplete",
      ),
    );
  },
);


test(
  "blocked repository-native certification blocks candidate assembly",
  () => {
    const result =
      buildGenesisDayZeroCertificationCandidate({
        repositorySeedCertification:
          repositorySeed(
            "BLOCKED",
          ),

        corpus:
          corpus(),

        conversationHistory:
          conversationHistory(),

        conversationCorrelation:
          correlation(),
      });

    assert.equal(
      result.state,
      "BLOCKED",
    );

    assert.equal(
      result.dayZeroGenesisCertified,
      false,
    );
  },
);


test(
  "candidate identity is deterministic",
  () => {
    const input = {
      repositorySeedCertification:
        repositorySeed(),

      corpus:
        corpus(),

      conversationHistory:
        conversationHistory(),

      conversationCorrelation:
        correlation(),
    };

    const first =
      buildGenesisDayZeroCertificationCandidate(
        input,
      );

    const second =
      buildGenesisDayZeroCertificationCandidate(
        input,
      );

    assert.equal(
      first.candidateId,
      second.candidateId,
    );
  },
);
