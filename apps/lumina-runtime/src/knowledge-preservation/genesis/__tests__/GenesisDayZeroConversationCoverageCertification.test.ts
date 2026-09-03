import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisDayZeroConversationCoverageEvidence,
} from "../GenesisDayZeroConversationCoverageEvidence.js";

import {
  certifyGenesisDayZeroConversationCoverage,
  validateGenesisDayZeroConversationCoverageCertification,
} from "../GenesisDayZeroConversationCoverageCertification.js";

import type {
  GenesisConversationAcquisitionInventory,
} from "../GenesisConversationAcquisitionInventory.js";

import type {
  GenesisConversationExpectedHistoryInventory,
  GenesisConversationExpectedHistoryReconciliation,
} from "../GenesisConversationExpectedHistoryInventory.js";

import type {
  GenesisConversationHistoryReconciliationProjection,
} from "../GenesisConversationHistoryReconciliationService.js";

import type {
  GenesisConversationCorrelationCompletenessProjection,
} from "../GenesisConversationCorrelationCompleteness.js";


function expectedHistory():
  GenesisConversationExpectedHistoryInventory {
  return {
    inventoryId:
      "genesis-conversation-expected-history:test",

    authority: {
      authorityId:
        "authority-1",

      authorityClass:
        "GENESIS_CONVERSATION_AUTHORITATIVE_COMPLETENESS_CERTIFICATION",

      certifiedBy:
        "operator",

      certifiedAt:
        100,

      scope:
        "governed-attested-conversation-history-corpus",

      version:
        "genesis-conversation-expected-history-authority:v1",
    },

    historicalStart:
      1,

    historicalEnd:
      2,

    conversations: [
      {
        conversationId:
          "conversation-a",

        disposition:
          "EXPECTED_RECOVERABLE",

        sourceLocator:
          "https://chatgpt.com/a",

        firstKnownAt:
          1,

        lastKnownAt:
          2,

        basis:
          "certified",
      },
    ],
  };
}


function acquisitionInventory():
  GenesisConversationAcquisitionInventory {
  return {
    inventoryId:
      "genesis-conversation-acquisition-inventory:test",

    historyState:
      "ACQUIRED",

    completeness:
      "UNVERIFIED",

    configured:
      true,

    acquisitionAvailable:
      true,

    acquisitionId:
      "conversation-acquisition:test",

    acquiredConversationIds: [
      "conversation-a",
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
  };
}


function reconciliation():
  GenesisConversationExpectedHistoryReconciliation {
  return {
    expectedInventoryId:
      "genesis-conversation-expected-history:test",

    acquisitionInventoryId:
      "genesis-conversation-acquisition-inventory:test",

    state:
      "COMPLETE",

    expectedRecoverableConversationIds: [
      "conversation-a",
    ],

    acquiredExpectedConversationIds: [
      "conversation-a",
    ],

    notYetAcquiredConversationIds:
      [],

    historicallyUnavailableConversationIds:
      [],

    unexpectedAcquiredConversationIds:
      [],

    blockers:
      [],

    dayZeroConversationCoverageCertified:
      false,
  };
}


function conversationHistory():
  GenesisConversationHistoryReconciliationProjection {
  return {
    expectedHistory:
      expectedHistory(),

    acquisitionInventory:
      acquisitionInventory(),

    reconciliation:
      reconciliation(),
  };
}


function correlation():
  GenesisConversationCorrelationCompletenessProjection {
  return {
    projectionId:
      "genesis-conversation-correlation-completeness:test",

    state:
      "COMPLETE",

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
      0,

    episodeLineageGaps:
      [],

    blockers:
      [],

    dayZeroGenesisCertified:
      false,
  };
}


test(
  "builds review-ready Day-0 conversation coverage evidence only from governed complete history and complete correlation",
  () => {
    const evidence =
      buildGenesisDayZeroConversationCoverageEvidence({
        conversationHistory:
          conversationHistory(),

        conversationCorrelation:
          correlation(),
      });

    assert.equal(
      evidence.state,
      "READY_FOR_REVIEW",
    );

    assert.equal(
      evidence.governedExpectedHistoryPresent,
      true,
    );

    assert.equal(
      evidence.reconciliationComplete,
      true,
    );

    assert.equal(
      evidence.correlationComplete,
      true,
    );

    assert.equal(
      evidence.dayZeroConversationCoverageCertified,
      false,
    );

    assert.deepEqual(
      evidence.blockers,
      [],
    );
  },
);


test(
  "blocks evidence when expected conversation acquisition is incomplete",
  () => {
    const history =
      conversationHistory();

    history.reconciliation = {
      ...reconciliation(),

      state:
        "BLOCKED",

      acquiredExpectedConversationIds:
        [],

      notYetAcquiredConversationIds: [
        "conversation-a",
      ],

      blockers: [
        "conversation-not-yet-acquired",
      ],
    };

    const evidence =
      buildGenesisDayZeroConversationCoverageEvidence({
        conversationHistory:
          history,

        conversationCorrelation:
          correlation(),
      });

    assert.equal(
      evidence.state,
      "BLOCKED",
    );

    assert.equal(
      evidence.reconciliationComplete,
      false,
    );

    assert.ok(
      evidence.blockers.includes(
        "conversation-history-reconciliation-incomplete",
      ),
    );
  },
);


test(
  "certifies review-ready Day-0 conversation coverage explicitly",
  () => {
    const evidence =
      buildGenesisDayZeroConversationCoverageEvidence({
        conversationHistory:
          conversationHistory(),

        conversationCorrelation:
          correlation(),
      });

    const certification =
      certifyGenesisDayZeroConversationCoverage({
        evidence,

        decision: {
          certifiedBy:
            "operator-1",

          certifiedAt:
            500,

          reason:
            "Governed Day-0 conversation coverage verified.",
        },
      });

    assert.equal(
      certification.state,
      "CERTIFIED",
    );

    assert.equal(
      certification.dayZeroConversationCoverageCertified,
      true,
    );

    assert.equal(
      certification.expectedConversationCount,
      1,
    );

    assert.equal(
      certification.acquiredExpectedConversationCount,
      1,
    );
  },
);


test(
  "rejects certification when conversation coverage evidence is blocked",
  () => {
    const history =
      conversationHistory();

    history.reconciliation = {
      ...reconciliation(),

      state:
        "BLOCKED",

      acquiredExpectedConversationIds:
        [],

      notYetAcquiredConversationIds: [
        "conversation-a",
      ],

      blockers: [
        "conversation-not-yet-acquired",
      ],
    };

    const evidence =
      buildGenesisDayZeroConversationCoverageEvidence({
        conversationHistory:
          history,

        conversationCorrelation:
          correlation(),
      });

    assert.throws(
      () =>
        certifyGenesisDayZeroConversationCoverage({
          evidence,

          decision: {
            certifiedBy:
              "operator",

            certifiedAt:
              500,

            reason:
              "Should fail.",
          },
        }),
      /evidence_not_ready/,
    );
  },
);


test(
  "validates certification against unchanged current evidence",
  () => {
    const evidence =
      buildGenesisDayZeroConversationCoverageEvidence({
        conversationHistory:
          conversationHistory(),

        conversationCorrelation:
          correlation(),
      });

    const certification =
      certifyGenesisDayZeroConversationCoverage({
        evidence,

        decision: {
          certifiedBy:
            "operator",

          certifiedAt:
            500,

          reason:
            "Coverage certified.",
        },
      });

    const validation =
      validateGenesisDayZeroConversationCoverageCertification({
        certification,

        currentEvidence:
          evidence,
      });

    assert.equal(
      validation.state,
      "VALID",
    );

    assert.deepEqual(
      validation.blockers,
      [],
    );
  },
);


test(
  "marks certification stale when governed evidence identity changes",
  () => {
    const evidence =
      buildGenesisDayZeroConversationCoverageEvidence({
        conversationHistory:
          conversationHistory(),

        conversationCorrelation:
          correlation(),
      });

    const certification =
      certifyGenesisDayZeroConversationCoverage({
        evidence,

        decision: {
          certifiedBy:
            "operator",

          certifiedAt:
            500,

          reason:
            "Coverage certified.",
        },
      });

    const changedEvidence = {
      ...evidence,

      evidenceId:
        "genesis-day-zero-conversation-coverage-evidence:changed",
    } as typeof evidence;

    const validation =
      validateGenesisDayZeroConversationCoverageCertification({
        certification,

        currentEvidence:
          changedEvidence,
      });

    assert.equal(
      validation.state,
      "STALE",
    );

    assert.ok(
      validation.blockers.includes(
        "day-zero-conversation-coverage-evidence-changed",
      ),
    );
  },
);
