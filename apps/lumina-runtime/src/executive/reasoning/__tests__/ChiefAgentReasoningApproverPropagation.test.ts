import assert from "node:assert/strict";
import test from "node:test";

import {
  ChiefAgentReasoningDestinationAdapter,
} from "../ChiefAgentReasoningDestinationAdapter.js";

test(
  "propagates an explicit approver from the executive event payload",
  async () => {
    let receivedApproverId:
      string | undefined;

    const adapter =
      new ChiefAgentReasoningDestinationAdapter(
        {
          materialize:
            () => ({
              canonicalKnowledge:
                [],

              organizationalMemory:
                [],
            }),
        } as never,

        {
          reason:
            async (input) => {
              receivedApproverId =
                input.approverId;

              return {
                title:
                  "Governed reasoning",


                disposition:

                  "review",

                conclusion:
                  "Review required.",



                confidence:
                  1,

                evidence:
                  [],

                assumptions:
                  [],
              };
            },
        },
      );

    await adapter.handle({
      event: {
        id:
          "event:approval-context",

        type:
          "chief-agent.reason",

        category:
          "governance",

        timestamp:
          Date.now(),

        source:
          "test",

        organizationId:
          "organization:korelumina",

        actor: {
          id:
            "chief-agent",

          type:
            "chief-agent",
        },

        confidence:
          "validated",

        evidence:
          [],

        payload: {
          query:
            "Prepare a governed decision.",

          approverId:
            "human:architecture-reviewer",
        },
      },

      route: {
        destinations:
          [],
      } as never,

      context: {
        organizationId:
          "organization:korelumina",

        knowledgeState: {
          metadata: {
            canonicalKnowledgeIds:
              [],

            organizationalMemoryRecordIds:
              [],
          },
        },
      } as never,
    });

    assert.equal(
      receivedApproverId,
      "human:architecture-reviewer",
    );
  },
);

test(
  "does not invent an approver when none is supplied",
  async () => {
    let receivedApproverId:
      string | undefined =
        "unexpected";

    const adapter =
      new ChiefAgentReasoningDestinationAdapter(
        {
          materialize:
            () => ({
              canonicalKnowledge:
                [],

              organizationalMemory:
                [],
            }),
        } as never,

        {
          reason:
            async (input) => {
              receivedApproverId =
                input.approverId;

              return {
                title:
                  "Reasoning",


                disposition:

                  "review",

                conclusion:
                  "No approver supplied.",



                confidence:
                  1,

                evidence:
                  [],

                assumptions:
                  [],
              };
            },
        },
      );

    await adapter.handle({
      event: {
        id:
          "event:no-approver",

        type:
          "chief-agent.reason",

        category:
          "governance",

        timestamp:
          Date.now(),

        source:
          "test",

        actor: {
          id:
            "chief-agent",

          type:
            "chief-agent",
        },

        confidence:
          "validated",

        evidence:
          [],

        payload: {
          query:
            "Reason only.",
        },
      },

      route: {
        destinations:
          [],
      } as never,

      context: {
        knowledgeState: {
          metadata: {
            canonicalKnowledgeIds:
              [],

            organizationalMemoryRecordIds:
              [],
          },
        },
      } as never,
    });

    assert.equal(
      receivedApproverId,
      undefined,
    );
  },
);
