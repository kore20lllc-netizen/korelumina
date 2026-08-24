import assert from "node:assert/strict";
import test from "node:test";

import {
  ChiefAgentReasoningKnowledgeMaterializer,
} from "../ChiefAgentReasoningKnowledgeMaterializer.js";


test(
  "Chief Agent materialization cannot resolve canonical IDs outside current-policy view",
  () => {
    const materializer =
      new ChiefAgentReasoningKnowledgeMaterializer(
        {
          list:
            () => [
              {
                id:
                  "canonical:allowed",

                type:
                  "CandidateDecision",

                title:
                  "Allowed",

                summary:
                  "Allowed",

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
        },

        {
          list:
            () =>
              [],
        } as any,
      );

    const result =
      materializer.materialize({
        organizationId:
          undefined,

        knowledgeState: {
          metadata: {
            canonicalKnowledgeIds: [
              "canonical:allowed",
              "canonical:drift",
            ],
          },
        },
      } as any);

    assert.deepEqual(
      result.canonicalKnowledge.map(
        item =>
          item.id,
      ),
      [
        "canonical:allowed",
      ],
    );
  },
);
