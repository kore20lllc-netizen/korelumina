import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutiveContext,
} from "../ExecutiveContext.js";

import {
  createExecutiveEvent,
} from "../../events/index.js";

import {
  DefaultExecutiveContextReducer,
} from "../../orchestrator/ExecutivePipeline.js";

test(
  "propagates organization scope from Executive event into context",
  () => {
    const reducer =
      new DefaultExecutiveContextReducer();

    const context =
      reducer.reduce(
        createExecutiveContext(),
        createExecutiveEvent({
          id:
            "event:organization-scope",

          type:
            "chief-agent.organization-scope",

          category:
            "knowledge",

          source:
            "test",

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
      );

    assert.equal(
      context.organizationId,
      "organization:korelumina",
    );
  },
);

test(
  "preserves existing organization scope when event omits it",
  () => {
    const reducer =
      new DefaultExecutiveContextReducer();

    const context =
      reducer.reduce(
        createExecutiveContext({
          organizationId:
            "organization:korelumina",
        }),
        createExecutiveEvent({
          id:
            "event:no-organization",

          type:
            "system.test",

          category:
            "system",

          source:
            "test",

          actor: {
            id:
              "system:test",

            type:
              "system",
          },

          confidence:
            "validated",

          payload:
            {},
        }),
      );

    assert.equal(
      context.organizationId,
      "organization:korelumina",
    );
  },
);
