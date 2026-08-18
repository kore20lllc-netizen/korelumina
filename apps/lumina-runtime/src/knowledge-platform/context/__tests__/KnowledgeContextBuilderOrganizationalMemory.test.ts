import assert from "node:assert/strict";
import test from "node:test";

import type {
  OrganizationalMemoryProvider,
} from "../../../knowledge/organizational-memory/index.js";

import {
  organizationalMemoryProviderRegistry,
} from "../../../knowledge/organizational-memory/index.js";

import {
  KnowledgePlatform,
} from "../../KnowledgePlatform.js";

import {
  KnowledgeContextBuilder,
} from "../KnowledgeContextBuilder.js";

class TestOrganizationalMemoryProvider
  implements OrganizationalMemoryProvider
{
  readonly id =
    "knowledge-context-test-provider";

  async recall(
    input: {
      organizationId: string;
      projectIds: string[];
      teamIds: string[];
      query: string;
      references: string[];
    },
  ) {
    return {
      records: [
        {
          id:
            "memory:test",

          organizationId:
            input.organizationId,

          projectId:
            input.projectIds[0],

          teamId:
            input.teamIds[0],

          title:
            "Organizational memory",

          summary:
            input.query,

          source:
            "architecture" as const,

          references:
            input.references,

          createdAt:
            new Date(0)
              .toISOString(),
        },
      ],

      insights: [],
    };
  }
}

test(
  "existing synchronous context build remains canonical-only",
  () => {
    const platform =
      new KnowledgePlatform();

    const builder =
      new KnowledgeContextBuilder(
        platform,
      );

    const context =
      builder.build({
        role:
          "architect",

        objective:
          "Understand architecture",
      });

    assert.deepEqual(
      context.knowledge,
      [],
    );

    assert.equal(
      "organizationalMemory" in
        context,
      false,
    );
  },
);

test(
  "context builder recalls organizational memory through existing provider pipeline",
  async () => {
    const provider =
      new TestOrganizationalMemoryProvider();

    organizationalMemoryProviderRegistry
      .registerOrganizationalMemoryProvider(
        provider,
      );

    const platform =
      new KnowledgePlatform();

    const builder =
      new KnowledgeContextBuilder(
        platform,
      );

    const context =
      await builder
        .buildWithOrganizationalMemory({
          role:
            "architect",

          objective:
            "Understand KoreLumina architecture",

          organizationId:
            "organization:korelumina",

          projectIds: [
            "project:korelumina",
          ],

          teamIds: [
            "team:architecture",
          ],

          references: [
            "canonical:test",
          ],
        });

    assert.equal(
      context.organizationalMemory
        .records.length,
      1,
    );

    const memory =
      context.organizationalMemory
        .records[0];

    assert.equal(
      memory.organizationId,
      "organization:korelumina",
    );

    assert.equal(
      memory.projectId,
      "project:korelumina",
    );

    assert.ok(
      memory.references.includes(
        "canonical:test",
      ),
    );
  },
);

test(
  "organizational memory is optional when no organization scope is provided",
  async () => {
    const builder =
      new KnowledgeContextBuilder(
        new KnowledgePlatform(),
      );

    const context =
      await builder
        .buildWithOrganizationalMemory({
          role:
            "architect",

          objective:
            "Understand architecture",
        });

    assert.deepEqual(
      context.organizationalMemory,
      {
        records: [],
        insights: [],
      },
    );
  },
);
