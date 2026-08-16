import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import {
  KnowledgePackageService,
} from "../../package/index.js";

import {
  CanonicalReviewBatchService,
} from "../CanonicalReviewBatch.js";

import {
  CanonicalReviewService,
} from "../CanonicalReviewService.js";

function item(
  id:
    string,
  authority =
    "architecture-specification",
): KnowledgeIRItem {
  return {
    id,

    candidateType:
      "CandidateArtifact",

    title:
      `Batch candidate ${id}`,

    summary:
      "Governed batch review candidate.",

    confidence:
      1,

    evidenceRefs: [
      `evidence:${id}`,
    ],

    proposedRelationships:
      {},

    extractedAt:
      Date.UTC(
        2026,
        0,
        1,
      ),

    compiler: {
      compilerName:
        "BatchReviewTestCompiler",

      compilerVersion:
        "1.0.0",

      evidenceSourceType:
        "document",

      extractedAt:
        Date.UTC(
          2026,
          0,
          1,
        ),

      extractionMethod:
        "direct-evidence",

      confidenceBasis:
        "test-fixture",
    },

    status:
      "approved",

    metadata: {
      capturedAt:
        Date.UTC(
          2026,
          0,
          1,
        ),

      version:
        "1.0.0",

      authorityClass:
        authority,

      approvalState:
        "approved",

      owner:
        "korelumina-architecture",

      scope:
        "platform",

      source:
        "repository",

      contentRef:
        `/repo/docs/${id}.md`,

      sourceLocation:
        `docs/${id}.md`,
    },
  };
}

test(
  "one human batch decision produces individual package review records",
  () => {
    const packageService =
      new KnowledgePackageService();

    const first =
      packageService.packageValidated([
        item(
          `batch-a-${Date.now()}`,
        ),
      ]);

    const second =
      packageService.packageValidated([
        item(
          `batch-b-${Date.now()}`,
        ),
      ]);

    assert.ok(
      first,
      "first governed batch package must be created",
    );

    assert.ok(
      second,
      "second governed batch package must be created",
    );

    const reviewService =
      new CanonicalReviewService(
        packageService,
      );

    const batchService =
      new CanonicalReviewBatchService(
        packageService,
        reviewService,
      );

    const batch =
      batchService.create(
        [
          first.id,
          second.id,
        ],
        Date.now(),
      );

    assert.equal(
      batch.status,
      "pending",
    );

    const reviewed =
      batchService.review(
        batch.id,
        {
          decision:
            "approved",

          reviewerId:
            "human:knowledge-governance",

          reason:
            "Approved as one governed documentation batch.",
        },
      );

    assert.equal(
      reviewed.status,
      "approved",
    );

    for (
      const packageId
      of reviewed.packageIds
    ) {
      const knowledgePackage =
        packageService.get(
          packageId,
        );

      assert.equal(
        knowledgePackage?.state,
        "approved",
      );

      assert.equal(
        knowledgePackage
          ?.approvalState,
        "approved",
      );

      const history =
        knowledgePackage
          ?.metadata
          .reviewHistory;

      assert.ok(
        Array.isArray(
          history,
        ),
      );

      assert.equal(
        history.length,
        1,
      );
    }
  },
);

test(
  "constitutional package cannot enter a batch",
  () => {
    const packageService =
      new KnowledgePackageService();

    const critical =
      packageService.packageValidated([
        item(
          `constitutional-${Date.now()}`,
          "constitutional",
        ),
      ]);

    assert.ok(
      critical,
      "constitutional governed package must be created",
    );

    const batchService =
      new CanonicalReviewBatchService(
        packageService,
        new CanonicalReviewService(
          packageService,
        ),
      );

    assert.throws(
      () =>
        batchService.create([
          critical.id,
        ]),
      /knowledge_package_not_batch_eligible/,
    );
  },
);
