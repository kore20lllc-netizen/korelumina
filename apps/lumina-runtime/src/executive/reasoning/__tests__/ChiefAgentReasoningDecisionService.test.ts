import assert from "node:assert/strict";
import test from "node:test";

import {
  ExecutiveDecisionService,
} from "../../decision/index.js";

import {
  createExecutiveReasoning,
} from "../ExecutiveReasoning.js";

import {
  ChiefAgentReasoningDecisionService,
} from "../ChiefAgentReasoningDecisionService.js";

test(
  "creates a proposed executive decision from completed Chief Agent reasoning",
  () => {
    const decisionService =
      new ExecutiveDecisionService();

    const service =
      new ChiefAgentReasoningDecisionService(
        decisionService,
      );

    const reasoning =
      createExecutiveReasoning({
        id:
          "reasoning:event:test",

        sessionId:
          "event:test",

        title:
          "Preserve architecture boundaries",

        question:
          "What boundaries must be preserved?",

        conclusion:
          "Preserve governance and canonical knowledge boundaries.",

        confidence:
          0.96,

        evidence: [
          "canonical:test",
          "memory:test",
        ],

        assumptions: [
          "Human approval remains required.",
        ],

        status:
          "completed",

        metadata: {
          organizationId:
            "organization:korelumina",

          projectId:
            "project:korelumina",
        },
      });

    const decision =
      service.createProposedDecision({
        reasoning,

        requestedBy:
          "chief-agent",
      });

    assert.equal(
      decision.id,
      "decision:reasoning:event:test",
    );

    assert.equal(
      decision.sessionId,
      reasoning.sessionId,
    );

    assert.equal(
      decision.status,
      "proposed",
    );

    assert.equal(
      decision.approvedBy,
      undefined,
    );

    assert.equal(
      decision.rationale,
      reasoning.conclusion,
    );

    assert.deepEqual(
      decision.evidence,
      reasoning.evidence,
    );

    assert.deepEqual(
      decision.consequences,
      reasoning.assumptions,
    );

    assert.equal(
      decision.metadata.reasoningId,
      reasoning.id,
    );

    assert.equal(
      decision.metadata.reasoningConfidence,
      reasoning.confidence,
    );

    assert.equal(
      decisionService.get(
        decision.id,
      ),
      decision,
    );
  },
);

test(
  "rejects decision creation from incomplete reasoning",
  () => {
    const service =
      new ChiefAgentReasoningDecisionService(
        new ExecutiveDecisionService(),
      );

    const reasoning =
      createExecutiveReasoning({
        id:
          "reasoning:event:pending",

        sessionId:
          "event:pending",

        title:
          "Pending reasoning",

        question:
          "Question",

        conclusion:
          "Not complete.",

        confidence:
          0.5,

        status:
          "analyzing",
      });

    assert.throws(
      () =>
        service.createProposedDecision({
          reasoning,

          requestedBy:
            "chief-agent",
        }),
      /chief_agent_reasoning_not_completed/,
    );
  },
);

test(
  "never auto-approves a reasoning-backed decision",
  () => {
    const service =
      new ChiefAgentReasoningDecisionService(
        new ExecutiveDecisionService(),
      );

    const reasoning =
      createExecutiveReasoning({
        id:
          "reasoning:event:governance",

        sessionId:
          "event:governance",

        title:
          "Governed decision",

        question:
          "Should this proceed?",

        conclusion:
          "Recommend review.",

        confidence:
          1,

        status:
          "completed",
      });

    const decision =
      service.createProposedDecision({
        reasoning,

        requestedBy:
          "chief-agent",
      });

    assert.equal(
      decision.status,
      "proposed",
    );

    assert.equal(
      decision.approvedBy,
      undefined,
    );
  },
);
