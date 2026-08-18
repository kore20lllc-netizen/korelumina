import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceItem,
} from "../../../evidence/index.js";

import {
  DocumentationCompiler,
} from "../DocumentationCompiler.js";

function documentEvidence(
  overrides:
    Partial<EvidenceItem> = {},
): EvidenceItem {
  return {
    id:
      "evidence:document:test",

    type:
      "document",

    title:
      "KoreLumina Architecture",

    source:
      "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",

    capturedAt:
      100,

    observedAt:
      90,

    contentRef:
      "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",

    checksum:
      "sha256:test",

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
        "architecture:v0",
      ],

      dependencies: [
        "ADR-0001",
      ],

      supersedes:
        "architecture:legacy",

      confidence:
        0.99,

      content:
        "# KoreLumina\n\nGoverned architecture document.",
    },

    relationships: {
      dependsOn: [
        "ADR-0001",
      ],

      supersedes: [
        "architecture:legacy",
      ],
    },

    ...overrides,
  };
}

test(
  "documentation compiler supports document evidence",
  () => {
    const compiler =
      new DocumentationCompiler();

    assert.equal(
      compiler.supports(
        documentEvidence(),
      ),
      true,
    );

    assert.equal(
      compiler.supports(
        documentEvidence({
          type:
            "source-file",
        }),
      ),
      false,
    );
  },
);

test(
  "documentation compiler emits provenance-preserving IR",
  async () => {
    const compiler =
      new DocumentationCompiler();

    const evidence =
      documentEvidence();

    const items =
      await compiler.compile(
        evidence,
      );

    assert.equal(
      items.length,
      1,
    );

    const item =
      items[0];

    assert.equal(
      item.id,
      `document:${evidence.id}`,
    );

    assert.equal(
      item.candidateType,
      "CandidateArtifact",
    );

    assert.deepEqual(
      item.evidenceRefs,
      [
        evidence.id,
      ],
    );

    assert.equal(
      item.confidence,
      0.99,
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
      "sha256:test",
    );

    assert.equal(
      item.metadata.sourceLocation,
      "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",
    );

    assert.deepEqual(
      item.metadata.lineage,
      [
        "architecture:v0",
      ],
    );

    assert.deepEqual(
      item.metadata.dependencies,
      [
        "ADR-0001",
      ],
    );

    assert.deepEqual(
      item.proposedRelationships,
      evidence.relationships,
    );

    assert.equal(
      item.compiler.compilerName,
      "documentation-compiler",
    );

    assert.equal(
      item.compiler.evidenceSourceType,
      "document",
    );
  },
);

test(
  "documentation compiler does not canonicalize evidence",
  async () => {
    const compiler =
      new DocumentationCompiler();

    const [
      item,
    ] =
      await compiler.compile(
        documentEvidence(),
      );

    assert.notEqual(
      item.status,
      "approved",
    );

    assert.equal(
      item.status,
      "extracted",
    );

    assert.equal(
      "canonical" in item,
      false,
    );
  },
);
