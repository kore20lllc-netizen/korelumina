import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceItem,
} from "../../evidence/index.js";

import {
  createKnowledgePreservationPlatform,
} from "../createKnowledgePreservationPlatform.js";

function approvedConversationEvidence():
  EvidenceItem {
  return {
    id:
      "evidence:conversation:e2e",

    type:
      "conversation",

    title:
      "Validated KoreLumina reconstruction conversation",

    source:
      "conversation:reconstruction-history",

    capturedAt:
      200,

    observedAt:
      190,

    contentRef:
      "conversation:inline",

    checksum:
      "sha256:conversation-e2e",

    metadata: {
      conversationId:
        "conversation-e2e",

      sessionId:
        "session-e2e",

      participants: [
        "user",
        "assistant",
      ],

      owner:
        "KoreLumina",

      scope:
        "architecture-evolution",

      version:
        "1.0.0",

      approvalState:
        "approved",

      confidence:
        1,

      lineage: [
        "conversation:reconstruction",
      ],

      dependencies: [
        "architecture:current",
      ],

      content:
        "Validated conversation explaining how KoreLumina architecture evolved.",
    },

    relationships: {
      explains: [
        "architecture:current",
      ],
    },
  };
}

test(
  "approved conversation traverses preservation into awaiting-review package without canonicalization",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const evidence =
      approvedConversationEvidence();

    await platform.preserve(
      evidence,
    );

    const knowledgePackage =
      platform.packageService
        .list()
        .find(
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
      "conversation-compiler",
    );

    assert.equal(
      item.candidateType,
      "CandidateLesson",
    );

    assert.equal(
      item.metadata.conversationId,
      "conversation-e2e",
    );

    assert.equal(
      item.metadata.approvalState,
      "approved",
    );

    assert.deepEqual(
      platform.canonicalKnowledgeStore.list(),
      [],
    );
  },
);

test(
  "conversation package survives persistent reload and remains non-canonical",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const evidence =
      approvedConversationEvidence();

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
