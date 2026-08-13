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

test(
  "KnowledgePreservationPlatform preserve terminates at awaiting-review package and never invokes publisher",
  async () => {
    const platform =
      new KnowledgePreservationPlatform();

    let publisherInvocations =
      0;

    platform.compilerRegistry.register({
      name:
        "governance-boundary-test-compiler",

      version:
        "1.0.0",

      supports:
        () =>
          true,

      compile:
        async () => [
          candidate({
            id:
              "candidate:preservation-boundary",

            confidence:
              1,

            status:
              "approved",

            evidenceRefs: [
              "evidence:preservation-boundary",
            ],
          }),
        ],
    });

    platform.publisherRegistry.register({
      name:
        "forbidden-preservation-publisher",

      version:
        "1.0.0",

      publish:
        async () => {
          publisherInvocations +=
            1;
        },
    });

    await platform.preserve({
      id:
        "evidence:preservation-boundary",

      type:
        "document",

      title:
        "Preservation governance boundary",

      source:
        "canonical-governance-boundary-test",

      capturedAt:
        1,

      observedAt:
        1,

      contentRef:
        "memory://preservation-governance-boundary",

      metadata: {
        confidence:
          1,
      },

      relationships:
        {},
    });

    assert.equal(
      publisherInvocations,
      0,
    );

    assert.deepEqual(
      platform.canonicalKnowledgeStore.list(),
      [],
    );

    const knowledgePackage =
      platform.packageService
        .list()
        .find(
          (item) =>
            item.sourceEvidenceRefs
              .includes(
                "evidence:preservation-boundary",
              ),
        );

    assert.ok(
      knowledgePackage,
    );

    assert.equal(
      knowledgePackage.state,
      "awaiting_review",
    );
  },
);

test(
  "alternate KnowledgePlatform preserve path cannot publish or canonicalize validated high-confidence IR",
  async () => {
    const platform =
      new KnowledgePlatform();

    let publisherInvocations =
      0;

    platform.compilerRegistry.register({
      name:
        "alternate-governance-boundary-test-compiler",

      version:
        "1.0.0",

      supports:
        () =>
          true,

      compile:
        async () => [
          candidate({
            id:
              "candidate:alternate-preservation-boundary",

            confidence:
              1,

            status:
              "approved",

            evidenceRefs: [
              "evidence:alternate-preservation-boundary",
            ],
          }),
        ],
    });

    platform.publisherRegistry.register({
      name:
        "forbidden-alternate-publisher",

      version:
        "1.0.0",

      publish:
        async () => {
          publisherInvocations +=
            1;
        },
    });

    await platform.preserve({
      id:
        "evidence:alternate-preservation-boundary",

      type:
        "document",

      title:
        "Alternate preservation governance boundary",

      source:
        "canonical-governance-boundary-test",

      capturedAt:
        1,

      observedAt:
        1,

      contentRef:
        "memory://alternate-preservation-governance-boundary",

      metadata: {
        confidence:
          1,
      },

      relationships:
        {},
    });

    assert.equal(
      publisherInvocations,
      0,
    );

    assert.deepEqual(
      platform.list(),
      [],
    );

    const knowledgePackage =
      platform.packageService
        .list()
        .find(
          (item) =>
            item.sourceEvidenceRefs
              .includes(
                "evidence:alternate-preservation-boundary",
              ),
        );

    assert.ok(
      knowledgePackage,
    );

    assert.equal(
      knowledgePackage.state,
      "awaiting_review",
    );
  },
);
