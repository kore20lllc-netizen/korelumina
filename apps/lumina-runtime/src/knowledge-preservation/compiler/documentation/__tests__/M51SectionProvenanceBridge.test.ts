import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceItem,
} from "../../../evidence/index.js";

import {
  DocumentationCompiler,
} from "../DocumentationCompiler.js";

import {
  KnowledgePackageFactory,
} from "../../../package/KnowledgePackageFactory.js";


function sectionEvidence(): EvidenceItem {
  return {
    id:
      "evidence:document:mission-section",

    type:
      "document",

    title:
      "Chief Agent Mission System — Delegation",

    source:
      "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md",

    capturedAt:
      1_700_000_000_000,

    observedAt:
      1_700_000_000_000,

    contentRef:
      "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md",

    checksum:
      "sha256:m51-section",

    metadata: {
      authorityClass:
        "governance",

      approvalState:
        "approved",

      owner:
        "KoreLumina",

      scope:
        "chief-agent-mission-delegation",

      version:
        "1.0",

      sourceLocation:
        "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md",

      lineStart:
        145,

      lineEnd:
        170,

      content:
        [
          "# Delegation",
          "",
          "The Chief Agent owns missions.",
          "",
          "The Chief Agent never delegates mission ownership.",
        ].join(
          "\n",
        ),
    },

    relationships: {},
  };
}


test(
  "M51.5c1 documentation compiler preserves section line-range provenance",
  async () => {
    const compiler =
      new DocumentationCompiler();

    const items =
      await compiler.compile(
        sectionEvidence(),
      );

    assert.equal(
      items.length,
      1,
    );

    const item =
      items[0];

    assert.equal(
      item.metadata.sourceLocation,
      "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md",
    );

    assert.equal(
      item.metadata.lineStart,
      145,
    );

    assert.equal(
      item.metadata.lineEnd,
      170,
    );

    const originalMetadata =
      item.metadata.originalMetadata as
        Record<
          string,
          unknown
        >;

    assert.equal(
      originalMetadata.lineStart,
      145,
    );

    assert.equal(
      originalMetadata.lineEnd,
      170,
    );
  },
);


test(
  "M51.5c1 Knowledge Package retains section-scoped IR provenance without direct canonical creation",
  async () => {
    const compiler =
      new DocumentationCompiler();

    const items =
      await compiler.compile(
        sectionEvidence(),
      );

    const factory =
      new KnowledgePackageFactory();

    const knowledgePackage =
      factory.createAwaitingReview(
        items,
      );

    assert.equal(
      knowledgePackage.state,
      "awaiting_review",
    );

    assert.equal(
      knowledgePackage.items.length,
      1,
    );

    assert.equal(
      knowledgePackage.items[0]
        .metadata.lineStart,
      145,
    );

    assert.equal(
      knowledgePackage.items[0]
        .metadata.lineEnd,
      170,
    );

    assert.deepEqual(
      knowledgePackage
        .provenance
        .sourceLocations,
      [
        "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md",
      ],
    );

    assert.equal(
      knowledgePackage
        .approvalState,
      "pending_review",
    );
  },
);
