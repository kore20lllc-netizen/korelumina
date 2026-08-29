import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import {
  createGenesisHistoricalEvidenceReviewDecision,
  FileGenesisHistoricalEvidenceReviewDecisionStore,
  manifestEntryWithHistoricalEvidenceReview,
} from "../GenesisHistoricalEvidenceReviewDecision.js";

import {
  classifyGenesisHistoricalAdmission,
} from "../GenesisHistoricalAdmissionGovernancePolicy.js";

import type {
  GenesisSourceManifestEntry,
} from "../GenesisSourceManifest.js";


function reviewableDocument():
  GenesisSourceManifestEntry {
  return {
    historicalSourceId:
      "genesis-source:document:test",

    sourceType:
      "document",

    evidenceType:
      "document",

    authorityClass:
      "governance",

    approvalState:
      "Accepted",

    authorityOwner:
      undefined,

    authorityScope:
      undefined,

    authorityVersion:
      undefined,

    effectiveFrom:
      undefined,

    effectiveTo:
      undefined,

    provenanceLocator:
      "docs/test.md",

    sourceChecksum:
      "sha256:test",

    historicalTimestamp:
      100,

    historicalTimestampSource:
      "test",

    discoveredAt:
      200,

    discoveryMethod:
      "documentation",

    replayEligibility:
      "eligible",

    exclusionReason:
      undefined,

    supersedes:
      [],

    conflictsWith:
      [],

    metadata: {
      title:
        "Test governing document",

      sourceLocation:
        "docs/test.md",
    },
  };
}

test(
  "approved historical Evidence review supplies effective manufacturing authority without mutating source manifest",
  () => {
    const source =
      reviewableDocument();

    const before =
      structuredClone(
        source,
      );

    assert.equal(
      classifyGenesisHistoricalAdmission(
        source,
      ).classification,
      "requires-governance-review",
    );

    const decision =
      createGenesisHistoricalEvidenceReviewDecision({
        historicalSourceId:
          source.historicalSourceId,

        evidenceId:
          "genesis-evidence:test",

        sourceChecksum:
          source.sourceChecksum,

        disposition:
          "APPROVE_MANUFACTURING",

        authority: {
          authorityClass:
            "governance",

          authorityOwner:
            "human-governance-review",

          authorityScope:
            "knowledge-ir-education",

          authorityVersion:
            "review-v1",

          approvalState:
            "approved",
        },

        reviewerId:
          "reviewer:test",

        decidedAt:
          200,

        rationale:
          "Reviewed for governed Knowledge manufacturing.",
      });

    const reviewed =
      manifestEntryWithHistoricalEvidenceReview(
        source,
        "genesis-evidence:test",
        decision,
      );

    const result =
      classifyGenesisHistoricalAdmission(
        reviewed,
      );

    assert.equal(
      result.classification,
      "knowledge-seeding-eligible",
    );

    assert.equal(
      result.invokeKnowledgeManufacturing,
      true,
    );

    assert.deepEqual(
      source,
      before,
    );
  },
);


test(
  "historical Evidence review cannot authorize a historical-only source",
  () => {
    const source:
      GenesisSourceManifestEntry = {
        ...reviewableDocument(),

        /*
         * Valid manifest entry, but not a governing authority source
         * and with no approval state. This must remain historical-only.
         */
        authorityClass:
          "historical-reference",

        approvalState:
          undefined,
      };

    assert.equal(
      classifyGenesisHistoricalAdmission(
        source,
      ).classification,
      "historical-evidence-only",
    );

    const decision =
      createGenesisHistoricalEvidenceReviewDecision({
        historicalSourceId:
          source.historicalSourceId,

        evidenceId:
          "genesis-evidence:test",

        sourceChecksum:
          source.sourceChecksum,

        disposition:
          "APPROVE_MANUFACTURING",

        authority: {
          authorityClass:
            "governance",

          authorityOwner:
            "reviewer",

          authorityScope:
            "test",

          authorityVersion:
            "1",

          approvalState:
            "approved",
        },

        reviewerId:
          "reviewer:test",

        decidedAt:
          200,

        rationale:
          "Attempted review.",
      });

    assert.throws(
      () =>
        manifestEntryWithHistoricalEvidenceReview(
          source,
          "genesis-evidence:test",
          decision,
        ),
      /genesis_historical_evidence_review_requires_reviewable_source/,
    );
  },
);


test(
  "rejected historical Evidence review cannot authorize manufacturing",
  () => {
    const source =
      reviewableDocument();

    const decision =
      createGenesisHistoricalEvidenceReviewDecision({
        historicalSourceId:
          source.historicalSourceId,

        evidenceId:
          "genesis-evidence:test",

        sourceChecksum:
          source.sourceChecksum,

        disposition:
          "REJECT_MANUFACTURING",

        reviewerId:
          "reviewer:test",

        decidedAt:
          200,

        rationale:
          "Not approved.",
      });

    assert.throws(
      () =>
        manifestEntryWithHistoricalEvidenceReview(
          source,
          "genesis-evidence:test",
          decision,
        ),
      /genesis_historical_evidence_review_not_approved/,
    );
  },
);


test(
  "review decision store is durable idempotent and conflict rejecting",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-historical-evidence-review-",
        ),
      );

    try {
      const store =
        new FileGenesisHistoricalEvidenceReviewDecisionStore({
          storageRoot:
            root,
        });

      const decision =
        createGenesisHistoricalEvidenceReviewDecision({
          historicalSourceId:
            "genesis-source:document:test",

          evidenceId:
            "genesis-evidence:test",

          sourceChecksum:
            "sha256:test",

          disposition:
            "APPROVE_MANUFACTURING",

          authority: {
            authorityClass:
              "governance",

            authorityOwner:
              "reviewer",

            authorityScope:
              "test",

            authorityVersion:
              "1",

            approvalState:
              "approved",
          },

          reviewerId:
            "reviewer:test",

          decidedAt:
            200,

          rationale:
            "Approved.",
        });

      store.save(
        decision,
      );

      store.save(
        decision,
      );

      assert.deepEqual(
        store.resolve(
          decision.historicalSourceId,
          decision.evidenceId,
        ),
        decision,
      );

      const conflicting =
        createGenesisHistoricalEvidenceReviewDecision({
          ...decision,

          rationale:
            "Different decision payload.",
        });

      assert.throws(
        () =>
          store.save(
            conflicting,
          ),
        /genesis_historical_evidence_review_decision_conflict/,
      );
    } finally {
      rmSync(
        root,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);
