import assert from "node:assert/strict";
import test from "node:test";

import {
  createHistoricalConversationEducationalClassification,
  validateHistoricalConversationEducationalClassification,
  type HistoricalConversationEducationalClassification,
} from "../HistoricalConversationEducationalClassification.js";


function createFixture() {
  return createHistoricalConversationEducationalClassification({
    conversationId:
      "conversation-001",

    sourceEvidenceIds: [
      "evidence-002",
      "evidence-001",
    ],

    sourceChecksum:
      "source-checksum-001",

    requirementContributions: [
      {
        requirementId:
          "conversation:mission",

        evidenceIds: [
          "evidence-002",
        ],

        basis:
          "The correlated historical evidence explicitly discusses the governing mission.",
      },
      {
        requirementId:
          "conversation:architecture",

        evidenceIds: [
          "evidence-001",
          "evidence-002",
        ],

        basis:
          "The correlated historical evidence describes system architecture.",
      },
    ],

    createdAt:
      100,
  });
}


test(
  "classification deterministically normalizes source evidence and requirement contributions",
  () => {
    const first =
      createFixture();

    const second =
      createHistoricalConversationEducationalClassification({
        conversationId:
          "conversation-001",

        sourceEvidenceIds: [
          "evidence-001",
          "evidence-002",
          "evidence-001",
        ],

        sourceChecksum:
          "source-checksum-001",

        requirementContributions: [
          {
            requirementId:
              "conversation:architecture",

            evidenceIds: [
              "evidence-002",
              "evidence-001",
              "evidence-002",
            ],

            basis:
              "The correlated historical evidence describes system architecture.",
          },
          {
            requirementId:
              "conversation:mission",

            evidenceIds: [
              "evidence-002",
            ],

            basis:
              "The correlated historical evidence explicitly discusses the governing mission.",
          },
        ],

        createdAt:
          999,
      });

    assert.equal(
      first.classificationId,
      second.classificationId,
    );

    assert.equal(
      first.checksum,
      second.checksum,
    );

    assert.deepEqual(
      first.sourceEvidenceIds,
      [
        "evidence-001",
        "evidence-002",
      ],
    );

    assert.deepEqual(
      first.requirementContributions.map(
        (contribution) =>
          contribution.requirementId,
      ),
      [
        "conversation:architecture",
        "conversation:mission",
      ],
    );
  },
);


test(
  "one historical conversation may contribute to multiple governed educational requirements",
  () => {
    const classification =
      createFixture();

    assert.equal(
      classification.requirementContributions.length,
      2,
    );

    assert.deepEqual(
      validateHistoricalConversationEducationalClassification(
        classification,
      ),
      {
        state:
          "VALID",
      },
    );
  },
);


test(
  "classification requires governed conversation educational requirement ids",
  () => {
    assert.throws(
      () =>
        createHistoricalConversationEducationalClassification({
          conversationId:
            "conversation-001",

          sourceEvidenceIds: [
            "evidence-001",
          ],

          sourceChecksum:
            "source-checksum-001",

          requirementContributions: [
            {
              requirementId:
                "conversation:unknown" as "conversation:architecture",

              evidenceIds: [
                "evidence-001",
              ],

              basis:
                "Unsupported requirement.",
            },
          ],

          createdAt:
            100,
        }),
      /historical_conversation_educational_classification_requirement_not_governed/,
    );
  },
);


test(
  "classification rejects duplicate requirement assignments",
  () => {
    assert.throws(
      () =>
        createHistoricalConversationEducationalClassification({
          conversationId:
            "conversation-001",

          sourceEvidenceIds: [
            "evidence-001",
          ],

          sourceChecksum:
            "source-checksum-001",

          requirementContributions: [
            {
              requirementId:
                "conversation:architecture",

              evidenceIds: [
                "evidence-001",
              ],

              basis:
                "Architecture evidence one.",
            },
            {
              requirementId:
                "conversation:architecture",

              evidenceIds: [
                "evidence-001",
              ],

              basis:
                "Architecture evidence two.",
            },
          ],

          createdAt:
            100,
        }),
      /historical_conversation_educational_classification_duplicate_requirement/,
    );
  },
);


test(
  "classification permits a governed zero-contribution classification",
  () => {
    const classification =
      createHistoricalConversationEducationalClassification({
        conversationId:
          "conversation-002",

        sourceEvidenceIds: [
          "evidence-003",
        ],

        sourceChecksum:
          "source-checksum-002",

        requirementContributions: [],

        createdAt:
          101,
      });

    assert.deepEqual(
      classification.requirementContributions,
      [],
    );

    assert.deepEqual(
      validateHistoricalConversationEducationalClassification(
        classification,
      ),
      {
        state:
          "VALID",
      },
    );
  },
);


test(
  "validation rejects identity tampering",
  () => {
    const classification =
      createFixture();

    const tampered: HistoricalConversationEducationalClassification = {
      ...classification,

      sourceChecksum:
        "tampered-source-checksum",
    };

    const validation =
      validateHistoricalConversationEducationalClassification(
        tampered,
      );

    assert.equal(
      validation.state,
      "INVALID",
    );
  },
);


test(
  "validation rejects lineage tampering independently of deterministic identity",
  () => {
    const classification =
      createFixture();

    const tampered: HistoricalConversationEducationalClassification = {
      ...classification,

      lineage: {
        ...classification.lineage,

        sourceConversationId:
          "different-conversation",
      },
    };

    assert.deepEqual(
      validateHistoricalConversationEducationalClassification(
        tampered,
      ),
      {
        state:
          "INVALID",

        reason:
          "historical_conversation_educational_classification_lineage_mismatch",
      },
    );
  },
);
