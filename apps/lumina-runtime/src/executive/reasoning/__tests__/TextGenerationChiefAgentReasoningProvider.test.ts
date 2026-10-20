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

/* MS-3 (ADR-0044): the reply may carry a mission or plan proposal. */
function replyWith(
  missionProposal: unknown,
) {
  return new TextGenerationChiefAgentReasoningProvider({
    async generateText() {
      return {
        text: JSON.stringify({
          title: "Mission proposal",
          disposition: "review",
          conclusion: "This should become a mission.",
          confidence: 0.8,
          evidence: ["canonical:architecture"],
          assumptions: [],
          missionProposal,
        }),
        model: "test-model",
      };
    },
  });
}

test(
  "a valid mission proposal is returned with the reasoning",
  async () => {
    const result = await replyWith({
      title: "Boundary hardening",
      objective: "Every route sits behind the boundary",
      priority: "high",
      plan: { epics: [{ title: "Routes", tasks: [{ title: "Audit routes", acceptanceCriteria: ["List complete"] }] }] },
    }).reason(input);

    assert.equal(result.missionProposal?.title, "Boundary hardening");
    assert.equal(result.missionProposal?.plan.epics[0].tasks[0].title, "Audit routes");
    assert.equal(result.metadata?.model, "test-model");
  },
);

test(
  "a malformed mission proposal is dropped without failing the reply",
  async () => {
    const result = await replyWith({ title: "No plan" }).reason(input);

    assert.equal(result.missionProposal, undefined);
    assert.equal(result.metadata?.missionProposalInvalid, "mission_proposal_title_and_objective_required");
    assert.equal(result.metadata?.model, "test-model");
    assert.equal(result.conclusion, "This should become a mission.");
  },
);

test(
  "the prompt tells the Chief Agent a proposal is never its own approval",
  async () => {
    let prompt = "";
    await new TextGenerationChiefAgentReasoningProvider({
      async generateText(request) {
        prompt = request.prompt;
        return {
          text: JSON.stringify({ title: "t", disposition: "review", conclusion: "c", confidence: 0.5, evidence: [], assumptions: [], missionProposal: null }),
          model: "m",
        };
      },
    }).reason(input);

    assert.match(prompt, /"missionProposal": null/);
    assert.match(prompt, /never approved by you/);
  },
);
