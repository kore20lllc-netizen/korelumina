import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveDecisionService,
} from "../../decision/index.js";

import {
  ChiefAgentReasoningDecisionService,
} from "../ChiefAgentReasoningDecisionService.js";

import {
  ChiefAgentReasoningExecutionService,
} from "../ChiefAgentReasoningExecutionService.js";

import {
  ExecutiveReasoningService,
} from "../ExecutiveReasoningService.js";

test(
  "completed Chief Agent reasoning can be composed into a proposed decision without approval",
  async () => {
    const reasoningService =
      new ExecutiveReasoningService();

    const decisionService =
      new ExecutiveDecisionService();

    const reasoningExecution =
      new ChiefAgentReasoningExecutionService(
        {
          reason:
            async () => ({
              title:
                "Preserve governed architecture",

              conclusion:
                "Maintain canonical knowledge and approval boundaries.",

              confidence:
                0.97,

              evidence: [
                "canonical:test",
                "memory:test",
              ],

              assumptions: [
                "Human approval remains required.",
              ],
            }),
        },

        reasoningService,
      );

    const decisionExecution =
      new ChiefAgentReasoningDecisionService(
        decisionService,
      );

    await reasoningExecution.execute({
      eventId:
        "event:composition",

      eventType:
        "chief-agent.reason",

      organizationId:
        "organization:korelumina",

      projectId:
        "project:korelumina",

      query:
        "What boundaries must be preserved?",

      knowledge: {
        canonicalKnowledge:
          [],

        organizationalMemory:
          [],
      },
    });

    const reasoning =
      reasoningService.get(
        "reasoning:event:composition",
      );

    assert.ok(
      reasoning,
    );

    const decision =
      decisionExecution
        .createProposedDecision({
          reasoning,

          requestedBy:
            "chief-agent",
        });

    assert.equal(
      decision.id,
      "decision:reasoning:event:composition",
    );

    assert.equal(
      decision.status,
      "proposed",
    );

    assert.equal(
      decision.approvedBy,
      undefined,
    );

    assert.deepEqual(
      decision.evidence,
      [
        "canonical:test",
        "memory:test",
      ],
    );

    assert.equal(
      decision.metadata.reasoningId,
      "reasoning:event:composition",
    );
  },
);
