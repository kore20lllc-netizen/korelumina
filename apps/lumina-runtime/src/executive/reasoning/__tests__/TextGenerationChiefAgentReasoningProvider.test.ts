import assert from "node:assert/strict";
import test from "node:test";

import {
  TextGenerationChiefAgentReasoningProvider,
} from "../TextGenerationChiefAgentReasoningProvider.js";

const input = {
  eventId:
    "event:reasoning:test",

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
          "CandidatePrinciple" as const,

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
          "canonical" as const,

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
          "architecture" as const,

        references: [
          "canonical:architecture",
        ],

        createdAt:
          new Date(0)
            .toISOString(),
      },
    ],
  },
};

test(
  "returns validated structured reasoning from text generation",
  async () => {
    let prompt =
      "";

    const provider =
      new TextGenerationChiefAgentReasoningProvider(
        {
          async generateText(
            request,
          ) {
            prompt =
              request.prompt;

            return {
              text:
                JSON.stringify({
                  title:
                    "Architecture direction",


                  disposition:

                    "review",

                  conclusion:
                    "Use the canonical architecture boundary.",



                  confidence:
                    0.93,

                  evidence: [
                    "canonical:architecture",
                    "memory:architecture",
                  ],

                  assumptions: [
                    "Governance remains authoritative.",
                  ],
                }),

              model:
                "test-model",
            };
          },
        },
      );

    const result =
      await provider.reason(
        input,
      );

    assert.match(
      prompt,
      /Canonical architecture guidance/,
    );

    assert.match(
      prompt,
      /Durable architecture memory/,
    );

    assert.equal(
      result.title,
      "Architecture direction",
    );

    assert.equal(
      result.conclusion,
      "Use the canonical architecture boundary.",
    );

    assert.equal(
      result.confidence,
      0.93,
    );

    assert.deepEqual(
      result.evidence,
      [
        "canonical:architecture",
        "memory:architecture",
      ],
    );

    assert.equal(
      result.metadata?.model,
      "test-model",
    );
  },
);

test(
  "rejects evidence not present in governed reasoning knowledge",
  async () => {
    const provider =
      new TextGenerationChiefAgentReasoningProvider(
        {
          async generateText() {
            return {
              text:
                JSON.stringify({
                  title:
                    "Invalid reasoning",


                  disposition:

                    "review",

                  conclusion:
                    "Invalid.",



                  confidence:
                    0.5,

                  evidence: [
                    "evidence:raw-document",
                  ],

                  assumptions:
                    [],
                }),

              model:
                "test-model",
            };
          },
        },
      );

    await assert.rejects(
      () =>
        provider.reason(
          input,
        ),
      /chief_agent_reasoning_unauthorized_evidence:evidence:raw-document/,
    );
  },
);

test(
  "rejects malformed structured reasoning",
  async () => {
    const provider =
      new TextGenerationChiefAgentReasoningProvider(
        {
          async generateText() {
            return {
              text:
                JSON.stringify({
                  title:
                    "Architecture",


                  disposition:

                    "review",

                  conclusion:
                    "",

                  confidence:
                    2,

                  evidence:
                    [],

                  assumptions:
                    [],
                }),

              model:
                "test-model",
            };
          },
        },
      );

    await assert.rejects(
      () =>
        provider.reason(
          input,
        ),
      /chief_agent_reasoning_invalid_conclusion/,
    );
  },
);
