import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutiveContext,
} from "../ExecutiveContext.js";

import {
  ExecutiveKnowledgeContextReducer,
} from "../ExecutiveKnowledgeContextReducer.js";

import {
  createExecutiveEvent,
} from "../../events/index.js";

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

      knowledge: [
        {
          id:
            "canonical:test",

          type:
            "CandidateArtifact",

          title:
            "Canonical test",

          summary:
            "Canonical knowledge.",

          confidence:
            1,

          evidenceRefs: [
            "evidence:test",
          ],

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

      organizationalMemory: {
        records: [
          {
            id:
              "canonical-memory:canonical:test",

            organizationId:
              "organization:korelumina",

            title:
              "Canonical memory",

            summary:
              "Memory projection.",

            source:
              "architecture",

            references: [
              "canonical:test",
            ],

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
  "chief agent event enriches executive knowledge state",
  async () => {
    const reducer =
      new ExecutiveKnowledgeContextReducer(
        new StubKnowledgeContextBuilder() as never,
      );

    const current =
      createExecutiveContext({
        organizationId:
          "organization:korelumina",
      });

    const event =
      createExecutiveEvent({
        id:
          "event:chief-agent:test",

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

        projectId:
          "project:korelumina",

        confidence:
          "validated",

        evidence: [
          {
            id:
              "evidence:test",

            type:
              "document",
          },
        ],

        payload: {
          query:
            "KoreLumina architecture",
        },
      });

    const result =
      await reducer.reduce(
        current,
        event,
      );

    assert.equal(
      result.project?.id,
      "project:korelumina",
    );

    assert.ok(
      result.knowledgeState,
    );

    assert.equal(
      result.knowledgeState.label,
      "Chief Agent Knowledge Context",
    );

    const metadata =
      result.knowledgeState
        .metadata;

    assert.ok(
      metadata,
    );

    assert.deepEqual(
      metadata.canonicalKnowledgeIds,
      [
        "canonical:test",
      ],
    );

    assert.deepEqual(
      metadata.organizationalMemoryRecordIds,
      [
        "canonical-memory:canonical:test",
      ],
    );
  },
);

test(
  "non-chief-agent event preserves structural executive reduction only",
  async () => {
    let called =
      false;

    const builder = {
      async buildWithOrganizationalMemory() {
        called =
          true;

        throw new Error(
          "should_not_be_called",
        );
      },
    };

    const reducer =
      new ExecutiveKnowledgeContextReducer(
        builder as never,
      );

    const current =
      createExecutiveContext();

    const event =
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
      });

    const result =
      await reducer.reduce(
        current,
        event,
      );

    assert.equal(
      called,
      false,
    );

    assert.equal(
      result.runtime?.id,
      "runtime",
    );

    assert.equal(
      result.knowledgeState,
      undefined,
    );
  },
);
