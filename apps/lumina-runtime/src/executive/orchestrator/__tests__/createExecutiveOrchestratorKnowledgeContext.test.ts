import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutiveContext,
} from "../../context/index.js";

import {
  createExecutiveEvent,
} from "../../events/index.js";

import {
  createExecutiveKernel,
} from "../../kernel/index.js";

import {
  createExecutiveOrchestrator,
} from "../createExecutiveOrchestrator.js";

import type {
  KnowledgeContextWithOrganizationalMemory,
} from "../../../knowledge-platform/context/index.js";

class StubKnowledgeContextBuilder {
  async buildWithOrganizationalMemory():
    Promise<
      KnowledgeContextWithOrganizationalMemory
    > {
    return {
      generatedAt:
        1000,

      request: {
        role:
          "architect",

        objective:
          "chief-agent.request",
      },

      knowledge: [],

      organizationalMemory: {
        records: [
          {
            id:
              "memory:architecture",

            organizationId:
              "organization:korelumina",

            title:
              "Architecture memory",

            summary:
              "Canonical architecture memory.",

            source:
              "architecture",

            references:
              [],

            createdAt:
              new Date(0)
                .toISOString(),
          },
        ],

        insights:
          [],
      },
    };
  }
}

test(
  "executive orchestrator uses knowledge-aware reducer when builder is supplied",
  async () => {
    const kernel =
      createExecutiveKernel({
        context:
          createExecutiveContext({
            organizationId:
              "organization:korelumina",
          }),
      });

    const runtime =
      createExecutiveOrchestrator({
        kernel,

        knowledgeContextBuilder:
          new StubKnowledgeContextBuilder() as never,
      });

    const result =
      await runtime.orchestrator
        .publish(
          createExecutiveEvent({
            id:
              "event:chief-agent:knowledge",

            type:
              "chief-agent.request",

            category:
              "knowledge",

            source:
              "chief-agent",

            actor: {
              id:
                "agent:chief",

              type:
                "chief-agent",
            },

            confidence:
              "validated",

            payload:
              {},
          }),
        );

    assert.equal(
      result.lifecycle.stage,
      "completed",
    );

    assert.ok(
      result.context
        .knowledgeState,
    );

    assert.deepEqual(
      result.context
        .knowledgeState
        ?.metadata
        ?.organizationalMemoryRecordIds,
      [
        "memory:architecture",
      ],
    );
  },
);

test(
  "executive orchestrator preserves default reducer when no knowledge builder is supplied",
  async () => {
    const runtime =
      createExecutiveOrchestrator();

    const result =
      await runtime.orchestrator
        .publish(
          createExecutiveEvent({
            id:
              "event:runtime:test",

            type:
              "runtime.health",

            category:
              "runtime",

            source:
              "runtime",

            actor: {
              id:
                "runtime:1",

              type:
                "runtime",
            },

            confidence:
              "validated",

            payload:
              {},
          }),
        );

    assert.equal(
      result.lifecycle.stage,
      "completed",
    );

    assert.equal(
      result.context
        .knowledgeState,
      undefined,
    );

    assert.equal(
      result.context
        .runtime
        ?.id,
      "runtime",
    );
  },
);
