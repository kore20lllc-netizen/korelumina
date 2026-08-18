import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceItem,
} from "../../../evidence/index.js";

import {
  ConversationCompiler,
} from "../ConversationCompiler.js";

function conversationEvidence(
  overrides:
    Partial<EvidenceItem> = {},
): EvidenceItem {
  return {
    id:
      "evidence:conversation:test",

    type:
      "conversation",

    title:
      "KoreLumina architecture evolution",

    source:
      "conversation:chief-agent-education",

    capturedAt:
      200,

    observedAt:
      190,

    contentRef:
      "conversation:inline",

    checksum:
      "sha256:conversation-test",

    metadata: {
      conversationId:
        "conversation-001",

      sessionId:
        "session-001",

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
        0.98,

      lineage: [
        "conversation:genesis",
      ],

      dependencies: [
        "architecture:current",
      ],

      content:
        "The architecture evolved through validated reconstruction milestones.",
    },

    relationships: {
      explains: [
        "architecture:current",
      ],
    },

    ...overrides,
  };
}

test(
  "conversation compiler supports conversation evidence only",
  () => {
    const compiler =
      new ConversationCompiler();

    assert.equal(
      compiler.supports(
        conversationEvidence(),
      ),
      true,
    );

    assert.equal(
      compiler.supports(
        conversationEvidence({
          type:
            "document",
        }),
      ),
      false,
    );
  },
);

test(
  "conversation compiler emits provenance-preserving IR",
  async () => {
    const compiler =
      new ConversationCompiler();

    const evidence =
      conversationEvidence();

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
      `conversation:${evidence.id}`,
    );

    assert.equal(
      item.candidateType,
      "CandidateLesson",
    );

    assert.deepEqual(
      item.evidenceRefs,
      [
        evidence.id,
      ],
    );

    assert.equal(
      item.confidence,
      0.98,
    );

    assert.equal(
      item.metadata.conversationId,
      "conversation-001",
    );

    assert.equal(
      item.metadata.sessionId,
      "session-001",
    );

    assert.deepEqual(
      item.metadata.participants,
      [
        "user",
        "assistant",
      ],
    );

    assert.equal(
      item.metadata.approvalState,
      "approved",
    );

    assert.deepEqual(
      item.metadata.lineage,
      [
        "conversation:genesis",
      ],
    );

    assert.deepEqual(
      item.metadata.dependencies,
      [
        "architecture:current",
      ],
    );

    assert.deepEqual(
      item.proposedRelationships,
      evidence.relationships,
    );

    assert.equal(
      item.compiler.compilerName,
      "conversation-compiler",
    );

    assert.equal(
      item.compiler.evidenceSourceType,
      "conversation",
    );
  },
);

test(
  "conversation compiler does not canonicalize evidence",
  async () => {
    const compiler =
      new ConversationCompiler();

    const [
      item,
    ] =
      await compiler.compile(
        conversationEvidence(),
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
