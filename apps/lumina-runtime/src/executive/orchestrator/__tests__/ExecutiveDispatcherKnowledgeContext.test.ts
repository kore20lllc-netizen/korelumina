import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutiveContext,
} from "../../context/index.js";

import {
  createExecutiveEvent,
} from "../../events/index.js";

import {
  RegistryExecutiveDispatcher,
} from "../ExecutiveDispatcher.js";

test(
  "destination handler receives enriched executive knowledge context",
  async () => {
    const dispatcher =
      new RegistryExecutiveDispatcher();

    let receivedContext:
      unknown;

    dispatcher.register(
      "reasoning",
      (dispatchContext) => {
        receivedContext =
          dispatchContext.context;
      },
    );

    const executiveContext =
      createExecutiveContext({
        organizationId:
          "organization:korelumina",

        knowledgeState: {
          id:
            "knowledge-context:1000",

          metadata: {
            canonicalKnowledgeIds: [
              "canonical:architecture",
            ],

            organizationalMemoryRecordIds: [
              "memory:architecture",
            ],

            organizationalMemoryInsightIds:
              [],
          },
        },
      });

    const result =
      await dispatcher.dispatch({
        event:
          createExecutiveEvent({
            id:
              "event:knowledge-dispatch",

            type:
              "chief-agent.reason",

            category:
              "architecture",

            source:
              "chief-agent",

            organizationId:
              "organization:korelumina",

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

        route: {
          eventId:
            "event:knowledge-dispatch",

          destinations: [
            "reasoning",
          ],

          reason:
            "test",
        },

        context:
          executiveContext,
      });

    assert.equal(
      result.successful,
      true,
    );

    assert.equal(
      receivedContext,
      executiveContext,
    );

    const received =
      receivedContext as
        typeof executiveContext;

    assert.deepEqual(
      received
        .knowledgeState
        ?.metadata
        ?.canonicalKnowledgeIds,
      [
        "canonical:architecture",
      ],
    );

    assert.deepEqual(
      received
        .knowledgeState
        ?.metadata
        ?.organizationalMemoryRecordIds,
      [
        "memory:architecture",
      ],
    );
  },
);
