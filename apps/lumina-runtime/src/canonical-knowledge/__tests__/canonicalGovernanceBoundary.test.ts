import assert from "node:assert/strict";
import test from "node:test";

import {
  CanonicalKnowledgeStore,
  KnowledgePromotionPolicy,
} from "../index.js";

import {
  KnowledgePlatform,
} from "../../knowledge-platform/KnowledgePlatform.js";

import {
  KnowledgePreservationPlatform,
} from "../../knowledge-preservation/bootstrap/KnowledgePreservationPlatform.js";

import type {
  KnowledgeIRItem,
} from "../../knowledge-preservation/ir/index.js";

function candidate(
  overrides: Partial<KnowledgeIRItem> = {},
): KnowledgeIRItem {
  return {
    id: "candidate:test",
    candidateType: "CandidateArtifact",
    title: "Governance boundary candidate",
    summary: "Validated knowledge must not become canonical automatically.",
    confidence: 1,
    evidenceRefs: ["evidence:test"],
    proposedRelationships: {},
    extractedAt: 0,
    compiler: {
      compilerName: "GovernanceBoundaryTestCompiler",
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
  "high confidence alone never grants canonical promotion authority",
  () => {
    const policy =
      new KnowledgePromotionPolicy();

    const decision =
      policy.evaluate(
        candidate({
          confidence: 1,
          status: "approved",
        }),
        [],
      );

    assert.equal(
      decision.promote,
      false,
    );

    assert.equal(
      decision.reason,
      "governed-approval-required",
    );
  },
);

test(
  "rejected IR remains non-canonical",
  () => {
    const store =
      new CanonicalKnowledgeStore();

    const promoted =
      store.promote(
        candidate({
          confidence: 1,
          status: "rejected",
        }),
      );

    assert.equal(
      promoted,
      undefined,
    );

    assert.deepEqual(
      store.list(),
      [],
    );
  },
);

test(
  "explicit promoteAll cannot bypass governance with high-confidence IR",
  () => {
    const store =
      new CanonicalKnowledgeStore();

    const promoted =
      store.promoteAll([
        candidate({
          confidence: 1,
          status: "approved",
        }),
      ]);

    assert.deepEqual(
      promoted,
      [],
    );

    assert.deepEqual(
      store.list(),
      [],
    );
  },
);

test(
  "KnowledgePlatform explicit promote API cannot bypass governance",
  () => {
    const platform =
      new KnowledgePlatform();

    const promoted =
      platform.promote([
        candidate({
          confidence: 1,
          status: "approved",
        }),
      ]);

    assert.deepEqual(
      promoted,
      [],
    );

    assert.deepEqual(
      platform.list(),
      [],
    );
  },
);

test(
  "existing canonical registry records remain readable",
  async () => {
    const {
      CanonicalKnowledgeRegistry,
    } = await import(
      "../CanonicalKnowledgeRegistry.js"
    );

    const registry =
      new CanonicalKnowledgeRegistry();

    const existing = {
      id: "canonical:existing",
      type: "CandidateArtifact" as const,
      title: "Existing canonical knowledge",
      summary: "Historical canonical data remains readable.",
      confidence: 1,
      evidenceRefs: ["evidence:existing"],
      relationships: {},
      createdAt: 0,
      updatedAt: 0,
      status: "canonical" as const,
      metadata: {},
    };

    registry.register(
      existing,
    );

    assert.deepEqual(
      registry.get(existing.id),
      existing,
    );

    assert.deepEqual(
      registry.list(),
      [existing],
    );
  },
);

test(
  "preservation platform exposes no automatic canonical record before governed promotion",
  () => {
    const platform =
      new KnowledgePreservationPlatform();

    assert.deepEqual(
      platform.canonicalKnowledgeStore.list(),
      [],
    );
  },
);
