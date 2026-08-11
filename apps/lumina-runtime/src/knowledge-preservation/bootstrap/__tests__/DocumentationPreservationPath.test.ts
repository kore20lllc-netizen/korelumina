import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceItem,
} from "../../evidence/index.js";

import {
  createKnowledgePreservationPlatform,
} from "../createKnowledgePreservationPlatform.js";

function approvedDocumentEvidence():
  EvidenceItem {
  return {
    id:
      "evidence:approved-document:e2e",

    type:
      "document",

    title:
      "Approved KoreLumina Architecture Document",

    source:
      "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",

    capturedAt:
      100,

    observedAt:
      90,

    contentRef:
      "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",

    checksum:
      "sha256:documentation-e2e",

    metadata: {
      authorityClass:
        "constitutional",

      approvalState:
        "approved",

      owner:
        "KoreLumina Architecture",

      scope:
        "platform",

      version:
        "1.0.0",

      sourceLocation:
        "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",

      lineage: [
        "architecture:genesis",
      ],

      dependencies: [
        "ADR-0001",
      ],

      confidence:
        1,

      content:
        "# KoreLumina Architecture\n\nApproved governed architecture evidence.",
    },

    relationships: {
      dependsOn: [
        "ADR-0001",
      ],
    },
  };
}

test(
  "approved documentation traverses preservation into awaiting-review package without canonicalization",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const evidence =
      approvedDocumentEvidence();

    await platform.preserve(
      evidence,
    );

    const packages =
      platform.packageService.list();

    const knowledgePackage =
      packages.find(
        (candidate) =>
          candidate.sourceEvidenceRefs.includes(
            evidence.id,
          ),
      );

    assert.ok(
      knowledgePackage,
    );

    assert.equal(
      knowledgePackage.state,
      "awaiting_review",
    );

    assert.equal(
      knowledgePackage.items.length,
      1,
    );

    const item =
      knowledgePackage.items[0];

    assert.equal(
      item.compiler.compilerName,
      "documentation-compiler",
    );

    assert.equal(
      item.compiler.evidenceSourceType,
      "document",
    );

    assert.deepEqual(
      item.evidenceRefs,
      [
        evidence.id,
      ],
    );

    assert.equal(
      item.metadata.authorityClass,
      "constitutional",
    );

    assert.equal(
      item.metadata.approvalState,
      "approved",
    );

    assert.equal(
      item.metadata.owner,
      "KoreLumina Architecture",
    );

    assert.equal(
      item.metadata.scope,
      "platform",
    );

    assert.equal(
      item.metadata.version,
      "1.0.0",
    );

    assert.equal(
      item.metadata.checksum,
      "sha256:documentation-e2e",
    );

    assert.deepEqual(
      item.metadata.lineage,
      [
        "architecture:genesis",
      ],
    );

    assert.deepEqual(
      item.metadata.dependencies,
      [
        "ADR-0001",
      ],
    );

    assert.deepEqual(
      platform.canonicalKnowledgeStore.list(),
      [],
    );
  },
);

test(
  "documentation package remains readable from persistent package storage",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const evidence =
      approvedDocumentEvidence();

    await platform.preserve(
      evidence,
    );

    const created =
      platform.packageService
        .list()
        .find(
          (candidate) =>
            candidate.sourceEvidenceRefs.includes(
              evidence.id,
            ),
        );

    assert.ok(
      created,
    );

    const freshPlatform =
      createKnowledgePreservationPlatform();

    const reloaded =
      freshPlatform.packageService.get(
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
      reloaded.sourceEvidenceRefs,
      [
        evidence.id,
      ],
    );

    assert.deepEqual(
      freshPlatform.canonicalKnowledgeStore.list(),
      [],
    );
  },
);
