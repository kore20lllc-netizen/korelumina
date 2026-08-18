import assert from "node:assert/strict";
import test from "node:test";

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
  ChiefAgentReasoningKnowledgeMaterializer,
} from "../ChiefAgentReasoningKnowledgeMaterializer.js";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test(
  "materializes only governed knowledge references already present in executive context",
  () => {
    const canonicalStore =
      new CanonicalKnowledgeStore();

    canonicalStore.registerGoverned({
      id:
        "canonical:architecture",

      type:
        "CandidatePrinciple",

      title:
        "KoreLumina Architecture",

      summary:
        "Canonical architecture guidance.",

      confidence:
        1,

      evidenceRefs:
        ["evidence:architecture"],

      relationships:
        {},

      createdAt:
        1,

      updatedAt:
        1,

      status:
        "canonical",

      metadata: {
        governance: {
          reviewDecision:
            "approved",
        },
      },
    });

    canonicalStore.registerGoverned({
      id:
        "canonical:not-authorized",

      type:
        "CandidatePrinciple",

      title:
        "Unreferenced canonical item",

      summary:
        "Must not be materialized.",

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
          "korelumina-reasoning-memory-",
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
        "Persistent organizational architecture memory.",

      source:
        "architecture",

      references: [
        "canonical:architecture",
      ],

      createdAt:
        new Date(0)
          .toISOString(),
    });

    memoryStore.save({
      id:
        "memory:other-org",

      organizationId:
        "organization:other",

      title:
        "Other organization memory",

      summary:
        "Must never cross organization boundary.",

      source:
        "architecture",

      references:
        [],

      createdAt:
        new Date(0)
          .toISOString(),
    });

    const materializer =
      new ChiefAgentReasoningKnowledgeMaterializer(
        canonicalStore,
        memoryStore,
      );

    const result =
      materializer.materialize(
        createExecutiveContext({
          organizationId:
            "organization:korelumina",

          knowledgeState: {
            id:
              "knowledge-context:test",

            metadata: {
              canonicalKnowledgeIds: [
                "canonical:architecture",
              ],

              organizationalMemoryRecordIds: [
                "memory:architecture",
                "memory:other-org",
              ],

              organizationalMemoryInsightIds:
                [],
            },
          },
        }),
      );

    assert.deepEqual(
      result.canonicalKnowledge.map(
        (item) => item.id,
      ),
      [
        "canonical:architecture",
      ],
    );

    assert.deepEqual(
      result.organizationalMemory.map(
        (record) => record.id,
      ),
      [
        "memory:architecture",
      ],
    );

    assert.equal(
      result.canonicalKnowledge[0]
        ?.summary,
      "Canonical architecture guidance.",
    );

    assert.equal(
      result.organizationalMemory[0]
        ?.summary,
      "Persistent organizational architecture memory.",
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
  "returns no organizational memory without organization scope",
  () => {
    const root =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-reasoning-noscope-",
        ),
      );

    const materializer =
      new ChiefAgentReasoningKnowledgeMaterializer(
        new CanonicalKnowledgeStore(),
        new RuntimeOrganizationalMemoryStore(
          root,
        ),
      );

    const result =
      materializer.materialize(
        createExecutiveContext({
          knowledgeState: {
            id:
              "knowledge-context:test",

            metadata: {
              organizationalMemoryRecordIds: [
                "memory:any",
              ],
            },
          },
        }),
      );

    assert.deepEqual(
      result.organizationalMemory,
      [],
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
