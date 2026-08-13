import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveReasoningService,
} from "../ExecutiveReasoningService.js";

import {
  ChiefAgentReasoningExecutionService,
} from "../ChiefAgentReasoningExecutionService.js";

test(
  "persists structured provider reasoning through ExecutiveReasoningService",
  async () => {
    const reasoningService =
      new ExecutiveReasoningService();

    const executionService =
      new ChiefAgentReasoningExecutionService(
        {
          async reason() {
            return {
              title:
                "Architecture direction",


              disposition:

                "review",

              conclusion:
                "Use the canonical architecture boundary.",



              confidence:
                0.94,

              evidence: [
                "canonical:architecture",
                "memory:architecture",
              ],

              assumptions: [
                "Existing governance remains authoritative.",
              ],

              metadata: {
                model:
                  "test-model",
              },
            };
          },
        },

        reasoningService,
      );

    await executionService.execute({
      eventId:
        "event:reasoning:1",

      eventType:
        "chief-agent.reason",

      organizationId:
        "organization:korelumina",

      projectId:
        "project:korelumina",

      query:
        "Which architecture should we follow?",

      knowledge: {
        canonicalKnowledge: [
          {
            id:
              "canonical:architecture",

            type:
              "CandidatePrinciple",

            title:
              "Architecture",

            summary:
              "Canonical architecture guidance.",

            confidence:
              1,

            evidenceRefs:
              [],

            relationships:
              {},

            createdAt:
              1,

            updatedAt:
              1,

            status:
              "canonical",

            metadata:
              {},
          },
        ],

        organizationalMemory: [
          {
            id:
              "memory:architecture",

            organizationId:
              "organization:korelumina",

            projectId:
              "project:korelumina",

            title:
              "Architecture memory",

            summary:
              "Durable architecture memory.",

            source:
              "architecture",

            references: [
              "canonical:architecture",
            ],

            createdAt:
              new Date(0)
                .toISOString(),
          },
        ],
      },
    });

    const reasoning =
      reasoningService.get(
        "reasoning:event:reasoning:1",
      );

    assert.ok(
      reasoning,
    );

    assert.equal(
      reasoning.conclusion,
      "Use the canonical architecture boundary.",
    );

    assert.equal(
      reasoning.status,
      "completed",
    );

    assert.equal(
      reasoning.confidence,
      0.94,
    );

    assert.deepEqual(
      reasoning.evidence,
      [
        "canonical:architecture",
        "memory:architecture",
      ],
    );

    assert.deepEqual(
      reasoning.metadata
        .canonicalKnowledgeIds,
      [
        "canonical:architecture",
      ],
    );

    assert.deepEqual(
      reasoning.metadata
        .organizationalMemoryRecordIds,
      [
        "memory:architecture",
      ],
    );

    assert.equal(
      reasoning.metadata.model,
      "test-model",
    );
  },
);
