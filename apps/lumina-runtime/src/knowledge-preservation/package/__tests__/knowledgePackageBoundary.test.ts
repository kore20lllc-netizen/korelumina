import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import {
  KnowledgePackageFactory,
  KnowledgePackageService,
} from "../index.js";

function validatedItem(
  overrides: Partial<KnowledgeIRItem> = {},
): KnowledgeIRItem {
  return {
    id: "candidate:package-test",
    candidateType: "CandidateArtifact",
    title: "Package boundary candidate",
    summary: "Validated IR must become reviewable package, not canonical knowledge.",
    confidence: 1,
    evidenceRefs: [
      "evidence:package-test",
    ],
    proposedRelationships: {},
    extractedAt: 0,
    compiler: {
      compilerName: "PackageBoundaryTestCompiler",
      compilerVersion: "1.0.0",
      evidenceSourceType: "document",
      extractedAt: 0,
      extractionMethod: "direct-evidence",
      confidenceBasis: "test-fixture",
    },
    status: "approved",
    metadata: {},
    ...overrides,
  };
}

test(
  "validated IR becomes an awaiting-review knowledge package",
  () => {
    const service =
      new KnowledgePackageService();

    const item =
      validatedItem();

    const knowledgePackage =
      service.packageValidated([
        item,
      ]);

    assert.ok(
      knowledgePackage,
    );

    assert.equal(
      knowledgePackage.state,
      "awaiting_review",
    );

    assert.deepEqual(
      knowledgePackage.knowledgeItemIds,
      [
        item.id,
      ],
    );

    assert.deepEqual(
      knowledgePackage.sourceEvidenceRefs,
      [
        "evidence:package-test",
      ],
    );

    assert.deepEqual(
      knowledgePackage.items,
      [
        item,
      ],
    );
  },
);

test(
  "package identity is deterministic for the same validated IR",
  () => {
    const factory =
      new KnowledgePackageFactory();

    const item =
      validatedItem();

    const first =
      factory.createAwaitingReview([
        item,
      ]);

    const second =
      factory.createAwaitingReview([
        item,
      ]);

    assert.equal(
      first.id,
      second.id,
    );
  },
);

test(
  "package identity is independent of item ordering",
  () => {
    const factory =
      new KnowledgePackageFactory();

    const first =
      validatedItem({
        id: "candidate:first",
        evidenceRefs: [
          "evidence:first",
        ],
      });

    const second =
      validatedItem({
        id: "candidate:second",
        evidenceRefs: [
          "evidence:second",
        ],
      });

    const a =
      factory.createAwaitingReview([
        first,
        second,
      ]);

    const b =
      factory.createAwaitingReview([
        second,
        first,
      ]);

    assert.equal(
      a.id,
      b.id,
    );
  },
);

test(
  "package service registers created packages",
  () => {
    const service =
      new KnowledgePackageService();

    const knowledgePackage =
      service.packageValidated([
        validatedItem(),
      ]);

    assert.ok(
      knowledgePackage,
    );

    assert.equal(
      service.registry.size(),
      1,
    );

    assert.deepEqual(
      service.get(
        knowledgePackage.id,
      ),
      knowledgePackage,
    );
  },
);

test(
  "empty validation output does not create an empty package",
  () => {
    const service =
      new KnowledgePackageService();

    const knowledgePackage =
      service.packageValidated(
        [],
      );

    assert.equal(
      knowledgePackage,
      undefined,
    );

    assert.equal(
      service.registry.size(),
      0,
    );
  },
);

test(
  "package creation preserves IR provenance without canonicalizing it",
  () => {
    const service =
      new KnowledgePackageService();

    const item =
      validatedItem({
        confidence: 0.99,
        evidenceRefs: [
          "evidence:document:001",
          "evidence:document:002",
        ],
      });

    const knowledgePackage =
      service.packageValidated([
        item,
      ]);

    assert.ok(
      knowledgePackage,
    );

    assert.equal(
      knowledgePackage.state,
      "awaiting_review",
    );

    assert.deepEqual(
      knowledgePackage.sourceEvidenceRefs,
      [
        "evidence:document:001",
        "evidence:document:002",
      ],
    );

    assert.equal(
      "canonical" in knowledgePackage,
      false,
    );
  },
);

test(
  "knowledge package persists across service instances",
  () => {
    const firstService =
      new KnowledgePackageService();

    const item =
      validatedItem({
        id: "candidate:persistence-roundtrip",
        evidenceRefs: [
          "evidence:persistence-roundtrip",
        ],
      });

    const created =
      firstService.packageValidated([
        item,
      ]);

    assert.ok(
      created,
    );

    const secondService =
      new KnowledgePackageService();

    const reloaded =
      secondService.get(
        created.id,
      );

    assert.ok(
      reloaded,
    );

    assert.equal(
      reloaded.id,
      created.id,
    );

    assert.equal(
      reloaded.state,
      "awaiting_review",
    );

    assert.deepEqual(
      reloaded.knowledgeItemIds,
      [
        item.id,
      ],
    );

    assert.deepEqual(
      reloaded.sourceEvidenceRefs,
      [
        "evidence:persistence-roundtrip",
      ],
    );

    assert.equal(
      "canonical" in reloaded,
      false,
    );
  },
);
