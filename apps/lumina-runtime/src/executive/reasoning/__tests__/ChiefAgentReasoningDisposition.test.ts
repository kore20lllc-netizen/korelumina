import assert from "node:assert/strict";
import test from "node:test";

import {
  ChiefAgentReasoningDecisionService,
} from "../ChiefAgentReasoningDecisionService.js";

import {
  createExecutiveReasoning,
} from "../ExecutiveReasoning.js";

import {
  ExecutiveDecisionService,
} from "../../decision/index.js";

function createReasoning(
  disposition:
    "authorize" |
    "review" |
    "deny",
) {
  return createExecutiveReasoning({
    id:
      `reasoning:${disposition}`,

    sessionId:
      `session:${disposition}`,

    title:
      `Reasoning ${disposition}`,

    question:
      "May this operation proceed?",

    conclusion:
      disposition === "deny"
        ? "Governed knowledge does not authorize this operation."
        : "Governed evidence supports further processing.",

    disposition,

    confidence:
      0.9,

    evidence: [
      "canonical:test",
    ],

    assumptions:
      [],

    status:
      "completed",
  });
}

test(
  "authorize disposition creates proposed decision",
  () => {
    const decisionService =
      new ExecutiveDecisionService();

    const service =
      new ChiefAgentReasoningDecisionService(
        decisionService,
      );

    const decision =
      service.createProposedDecision({
        reasoning:
          createReasoning(
            "authorize",
          ),

        requestedBy:
          "chief-agent",
      });

    assert.equal(
      decision.status,
      "proposed",
    );

    assert.equal(
      decision.metadata
        .reasoningDisposition,
      "authorize",
    );

    assert.equal(
      decision.metadata
        .executableCandidate,
      true,
    );
  },
);

test(
  "review disposition creates human-reviewable proposed decision",
  () => {
    const service =
      new ChiefAgentReasoningDecisionService(
        new ExecutiveDecisionService(),
      );

    const decision =
      service.createProposedDecision({
        reasoning:
          createReasoning(
            "review",
          ),

        requestedBy:
          "chief-agent",
      });

    assert.equal(
      decision.status,
      "proposed",
    );

    assert.equal(
      decision.metadata
        .reasoningDisposition,
      "review",
    );
  },
);

test(
  "deny disposition creates terminal rejected decision",
  () => {
    const service =
      new ChiefAgentReasoningDecisionService(
        new ExecutiveDecisionService(),
      );

    const decision =
      service.createProposedDecision({
        reasoning:
          createReasoning(
            "deny",
          ),

        requestedBy:
          "chief-agent",
      });

    assert.equal(
      decision.status,
      "rejected",
    );

    assert.equal(
      decision.metadata
        .reasoningDisposition,
      "deny",
    );

    assert.equal(
      decision.metadata
        .executableCandidate,
      false,
    );
  },
);
