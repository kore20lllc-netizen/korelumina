import assert from "node:assert/strict";
import test from "node:test";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  CanonicalKnowledgeStore,
} from "../../../canonical-knowledge/index.js";

import {
  RuntimeOrganizationalMemoryStore,
} from "../../../knowledge-platform/runtime/index.js";

import {
  createExecutiveContext,
} from "../../context/index.js";

import {
  createExecutiveEvent,
} from "../../events/index.js";

import {
  ChiefAgentReasoningDestinationAdapter,
} from "../ChiefAgentReasoningDestinationAdapter.js";

import {
  ChiefAgentReasoningKnowledgeMaterializer,
} from "../ChiefAgentReasoningKnowledgeMaterializer.js";

test(
  "passes materialized governed knowledge to reasoning provider",
  async () => {
    const canonicalStore =
      new CanonicalKnowledgeStore();

    canonicalStore.registerGoverned({
      id:
        "canonical:architecture",

      type:
        "CandidatePrinciple",

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
        "canonical",

      metadata:
        {},
    });

    const root =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-reasoning-adapter-",
        ),
      );

    const memoryStore =
      new RuntimeOrganizationalMemoryStore(
        root,
      );

    memoryStore.save({
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
        "architecture",

      references: [
        "canonical:architecture",
      ],

      createdAt:
        new Date(0)
          .toISOString(),
    });

    let received:
      unknown;

    const adapter =
      new ChiefAgentReasoningDestinationAdapter(
        new ChiefAgentReasoningKnowledgeMaterializer(
          canonicalStore,
          memoryStore,
        ),
        {
          async reason(input) {
            received =
              input;
          },
        },
      );

    await adapter.handle({
      event:
        createExecutiveEvent({
          id:
            "event:reasoning:test",

          type:
            "chief-agent.reason",

          category:
            "architecture",

          source:
            "chief-agent",

          organizationId:
            "organization:korelumina",

          projectId:
            "project:korelumina",

          actor: {
            id:
              "agent:chief",

            type:
              "chief-agent",
          },

          confidence:
            "validated",

          payload: {
            query:
              "What architecture should we follow?",
          },
        }),

      route: {
        eventId:
          "event:reasoning:test",

        destinations: [
          "reasoning",
        ],

        reason:
          "test",
      },

      context:
        createExecutiveContext({
          organizationId:
            "organization:korelumina",

          project: {
            id:
              "project:korelumina",
          },

          knowledgeState: {
            id:
              "knowledge-context:test",

            metadata: {
              canonicalKnowledgeIds: [
                "canonical:architecture",
              ],

              organizationalMemoryRecordIds: [
                "memory:architecture",
              ],
            },
          },
        }),
    });

    const input =
      received as {
        query?: string;
        knowledge: {
          canonicalKnowledge:
            Array<{ id: string }>;
          organizationalMemory:
            Array<{ id: string }>;
        };
      };

    assert.equal(
      input.query,
      "What architecture should we follow?",
    );

    assert.deepEqual(
      input.knowledge
        .canonicalKnowledge
        .map(
          (item) => item.id,
        ),
      [
        "canonical:architecture",
      ],
    );

    assert.deepEqual(
      input.knowledge
        .organizationalMemory
        .map(
          (record) => record.id,
        ),
      [
        "memory:architecture",
      ],
    );

    fs.rmSync(
      root,
      {
        recursive: true,
        force: true,
      },
    );
  },
);

test(
  "does nothing when no reasoning provider is configured",
  async () => {
    const root =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-reasoning-no-provider-",
        ),
      );

    const adapter =
      new ChiefAgentReasoningDestinationAdapter(
        new ChiefAgentReasoningKnowledgeMaterializer(
          new CanonicalKnowledgeStore(),
          new RuntimeOrganizationalMemoryStore(
            root,
          ),
        ),
      );

    await adapter.handle({
      event:
        createExecutiveEvent({
          id:
            "event:no-provider",

          type:
            "chief-agent.reason",

          category:
            "architecture",

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

      route: {
        eventId:
          "event:no-provider",

        destinations: [
          "reasoning",
        ],

        reason:
          "test",
      },

      context:
        createExecutiveContext(),
    });

    fs.rmSync(
      root,
      {
        recursive: true,
        force: true,
      },
    );
  },
);
