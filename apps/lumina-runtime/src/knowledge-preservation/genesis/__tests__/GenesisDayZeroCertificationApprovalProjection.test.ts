import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisDayZeroCertificationApprovalProjection,
} from "../GenesisDayZeroCertificationApprovalProjection.js";

import type {
  GenesisDayZeroCertificationApprovalInput,
} from "../GenesisDayZeroCertificationApprovalProjection.js";

import type {
  GenesisDayZeroCertificationCandidate,
} from "../GenesisDayZeroCertificationCandidate.js";


function candidate():
  GenesisDayZeroCertificationCandidate {
  return {
    candidateId:
      "genesis-day-zero-certification-candidate:test",

    state:
      "READY",

    repositoryNative: {
      certificationId:
        "genesis-repository-seed-certification:test",

      state:
        "CERTIFIED",

      replayExact:
        true,

      totalSources:
        100,

      completedSources:
        100,

      blockedSources:
        0,
    },

    conversationHistory: {
      expectedHistoryPresent:
        true,

      expectedInventoryId:
        "genesis-conversation-expected-history:test",

      acquisitionInventoryId:
        "genesis-conversation-acquisition-inventory:test",

      reconciliationState:
        "COMPLETE",

      authorityId:
        "day-zero-history",

      authorityVersion:
        "1",

      expectedRecoverableConversationIds: [
        "conversation-1",
        "conversation-2",
      ],

      acquiredExpectedConversationIds: [
        "conversation-1",
        "conversation-2",
      ],

      notYetAcquiredConversationIds:
        [],

      historicallyUnavailableConversationIds: [
        "conversation-lost",
      ],

      unexpectedAcquiredConversationIds:
        [],
    },

    correlation: {
      projectionId:
        "genesis-conversation-correlation-completeness:test",

      state:
        "COMPLETE",

      conversationManifestSources:
        20,

      admittedConversationSources:
        20,

      correlatedConversationSources:
        20,

      correlatedConversationEvents:
        20,

      unresolvedExplicitLinks:
        0,

      episodeLineageGaps:
        0,
    },

    corpus: {
      projectionId:
        "genesis-corpus-projection:test",

      sourceRevisions:
        120,

      historicalEvents:
        130,

      relationships:
        30,

      evolutionEpisodes:
        12,

      pendingExternalEpisodes:
        0,
    },

    provenance: {
      repositorySeedCertificationId:
        "genesis-repository-seed-certification:test",

      corpusProjectionId:
        "genesis-corpus-projection:test",

      conversationExpectedInventoryId:
        "genesis-conversation-expected-history:test",

      conversationAcquisitionInventoryId:
        "genesis-conversation-acquisition-inventory:test",

      conversationCorrelationProjectionId:
        "genesis-conversation-correlation-completeness:test",
    },

    visibleHistoricalGaps: {
      historicallyUnavailableConversationIds: [
        "conversation-lost",
      ],

      notYetAcquiredConversationIds:
        [],

      unexpectedAcquiredConversationIds:
        [],

      unresolvedExplicitHistoricalLinks:
        [],

      episodeLineageGaps:
        [],
    },

    blockers:
      [],

    dayZeroGenesisCertified:
      false,
  };
}


function unsetRuntime():
  GenesisDayZeroCertificationApprovalInput {
  return {
    state:
      "UNSET",

    candidate:
      candidate(),

    certification:
      null,

    validation:
      null,

    downstream: {
      educationalCorpusCertified:
        false,

      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  };
}


test(
  "READY candidate requires one corpus-level approval and no per-conversation approval",
  () => {
    const result =
      buildGenesisDayZeroCertificationApprovalProjection(
        unsetRuntime(),
      );

    assert.equal(
      result.state,
      "READY_FOR_SINGLE_APPROVAL",
    );

    assert.equal(
      result.approval.available,
      true,
    );

    assert.equal(
      result.approval
        .singleHumanApprovalRequired,
      true,
    );

    assert.equal(
      result.approval
        .perConversationApprovalRequired,
      false,
    );

    assert.equal(
      result.exceptions.length,
      0,
    );
  },
);


test(
  "historically unavailable conversations are acknowledged gaps not approval exceptions",
  () => {
    const result =
      buildGenesisDayZeroCertificationApprovalProjection(
        unsetRuntime(),
      );

    assert.deepEqual(
      result.acknowledgedHistoricalGaps,
      [
        "conversation-lost",
      ],
    );

    assert.equal(
      result.summary
        .historicallyUnavailableConversations,
      1,
    );

    assert.equal(
      result.summary
        .unresolvedExceptions,
      0,
    );
  },
);


test(
  "only unresolved conversation exceptions are surfaced",
  () => {
    const runtime =
      unsetRuntime();

    runtime.candidate = {
      ...runtime.candidate,

      state:
        "INCOMPLETE",

      visibleHistoricalGaps: {
        ...runtime.candidate
          .visibleHistoricalGaps,

        notYetAcquiredConversationIds: [
          "conversation-3",
        ],
      },

      blockers: [
        "conversation-history-coverage-incomplete",
      ],
    };

    const result =
      buildGenesisDayZeroCertificationApprovalProjection(
        runtime,
      );

    assert.equal(
      result.state,
      "EXCEPTIONS_PRESENT",
    );

    assert.equal(
      result.approval.available,
      false,
    );

    assert.ok(
      result.exceptions.some(
        item =>
          item.code ===
          "conversation-not-yet-acquired" &&
          item.subjectId ===
          "conversation-3",
      ),
    );

    assert.equal(
      result.approval
        .perConversationApprovalRequired,
      false,
    );
  },
);


test(
  "valid persisted certification reports CERTIFIED without reopening approval",
  () => {
    const runtime =
      unsetRuntime();

    runtime.state =
      "VALID";

    runtime.certification = {
      certificationId:
        "genesis-day-zero-certification:test",

      certificationVersion:
        "genesis-day-zero-certification:v1",

      state:
        "CERTIFIED",

      candidateId:
        runtime.candidate
          .candidateId,

      certifiedBy:
        "human",

      certifiedAt:
        1000,

      reason:
        "accepted",

      provenance: {
        repositorySeedCertificationId:
          runtime.candidate
            .provenance
            .repositorySeedCertificationId,

        corpusProjectionId:
          runtime.candidate
            .provenance
            .corpusProjectionId,

        conversationExpectedInventoryId:
          runtime.candidate
            .conversationHistory
            .expectedInventoryId!,

        conversationAcquisitionInventoryId:
          runtime.candidate
            .provenance
            .conversationAcquisitionInventoryId,

        conversationCorrelationProjectionId:
          runtime.candidate
            .provenance
            .conversationCorrelationProjectionId,
      },

      certifiedHistoricalGaps: {
        historicallyUnavailableConversationIds: [
          "conversation-lost",
        ],
      },

      downstream: {
        educationalCorpusCertified:
          false,

        initialCompetencyCertified:
          false,

        chiefAgentActivationAuthorized:
          false,
      },
    };

    const result =
      buildGenesisDayZeroCertificationApprovalProjection(
        runtime,
      );

    assert.equal(
      result.state,
      "CERTIFIED",
    );

    assert.equal(
      result.approval.available,
      false,
    );
  },
);
