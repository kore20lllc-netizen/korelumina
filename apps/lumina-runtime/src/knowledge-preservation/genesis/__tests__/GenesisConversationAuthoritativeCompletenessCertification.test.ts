import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyGenesisConversationAuthoritativeCompleteness,
  validateGenesisConversationAuthoritativeCompletenessCertification,
} from "../GenesisConversationAuthoritativeCompletenessCertification.js";

import type {
  GenesisConversationAuthoritativeCompletenessEvidence,
} from "../GenesisConversationAuthoritativeCompletenessEvidence.js";


function evidence():
  GenesisConversationAuthoritativeCompletenessEvidence {
  return {
    state:
      "READY_FOR_REVIEW",

    candidateId:
      "candidate-1",

    reviewId:
      "review-1",

    acquisitionId:
      "acquisition-1",

    acquisitionInventoryId:
      "inventory-1",

    candidateConversationCount:
      56,

    acquiredConversationCount:
      56,

    projectCount:
      6,

    historicalSourceCount:
      272,

    evidenceCount:
      272,

    knownOmissionCount:
      0,

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

    blockers: [
      "authoritative-completeness-evidence-not-certified",
    ],

    authoritativeCompletenessEvidenceCertified:
      false,

    authoritativeExpectedHistoryCreated:
      false,

    authoritativeExpectedHistoryCreationAvailable:
      false,

    dayZeroConversationCoverageCertified:
      false,

    promotionAvailable:
      false,
  };
}


test(
  "certifies ready completeness evidence without creating expected history or Day Zero authority",
  () => {
    const certification =
      certifyGenesisConversationAuthoritativeCompleteness({
        evidence:
          evidence(),

        decision: {
          certifiedBy:
            "operator-1",

          certifiedAt:
            1000,

          reason:
            "Reviewed complete governed evidence package.",
        },
      });

    assert.equal(
      certification.state,
      "CERTIFIED",
    );

    assert.equal(
      certification.candidateConversationCount,
      56,
    );

    assert.equal(
      certification.authoritativeExpectedHistoryCreated,
      false,
    );

    assert.equal(
      certification.dayZeroConversationCoverageCertified,
      false,
    );

    assert.equal(
      certification.promotionAvailable,
      false,
    );
  },
);


test(
  "rejects certification when completeness evidence is not ready",
  () => {
    const blocked = {
      ...evidence(),

      state:
        "BLOCKED" as const,

      blockers: [
        "conversation-candidate-count-mismatch",
      ],
    };

    assert.throws(
      () =>
        certifyGenesisConversationAuthoritativeCompleteness({
          evidence:
            blocked,

          decision: {
            certifiedBy:
              "operator-1",

            certifiedAt:
              1000,

            reason:
              "Invalid attempt.",
          },
        }),
      /evidence_not_ready/,
    );
  },
);


test(
  "valid certification becomes stale when acquisition provenance changes",
  () => {
    const current =
      evidence();

    const certification =
      certifyGenesisConversationAuthoritativeCompleteness({
        evidence:
          current,

        decision: {
          certifiedBy:
            "operator-1",

          certifiedAt:
            1000,

          reason:
            "Reviewed.",
        },
      });

    const validation =
      validateGenesisConversationAuthoritativeCompletenessCertification({
        certification,

        currentEvidence: {
          ...current,

          acquisitionInventoryId:
            "inventory-2",
        },
      });

    assert.equal(
      validation.state,
      "STALE",
    );

    assert.ok(
      validation.blockers.includes(
        "conversation-completeness-acquisition-inventory-changed",
      ),
    );
  },
);
