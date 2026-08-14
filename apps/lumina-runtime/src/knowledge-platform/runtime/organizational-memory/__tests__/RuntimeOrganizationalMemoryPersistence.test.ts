import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type {
  CanonicalKnowledgeItem,
} from "../../../../canonical-knowledge/index.js";

import {
  GovernedCanonicalMemoryAdaptationService,
} from "../../../../knowledge/organizational-memory/index.js";

import {
  RuntimeOrganizationalMemoryStore,
} from "../RuntimeOrganizationalMemoryStore.js";

function canonicalItem():
  CanonicalKnowledgeItem {
  return {
    id:
      "canonical:persistence-reload",

    type:
      "CandidateArtifact",

    title:
      "Generalized persistence recovery pattern",

    summary:
      "Reusable organizational persistence guidance.",

    confidence:
      1,

    evidenceRefs: [
      "evidence:persistence-reload",
    ],

    relationships:
      {},

    createdAt:
      1000,

    updatedAt:
      1000,

    status:
      "canonical",

    metadata: {
      authorityClass:
        "constitutional",

      governance: {
        packageId:
          "KP-2026-000000000601",

        packageVersion:
          "1.0.0",

        authority:
          "Architecture Council",

        owner:
          "Runtime Architecture",

        scope:
          "organizational",

        reviewDecision:
          "approved",

        reviewerId:
          "reviewer:architect",

        reviewedAt:
          2000,

        provenance: {
          evidenceIds: [
            "evidence:persistence-reload",
          ],

          sourceLocations:
            [],

          contentRefs: [
            "sha256:persistence-reload",
          ],

          sources: [
            "repository",
          ],
        },

        lineage: [
          "knowledge-ir:persistence-reload",
        ],

        dependencies:
          [],
      },
    },
  };
}

test(
  "validated organizational memory survives durable store reconstruction",
  () => {
    const root =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-organizational-memory-",
        ),
      );

    try {
      const initialStore =
        new RuntimeOrganizationalMemoryStore(
          root,
        );

      const result =
        new GovernedCanonicalMemoryAdaptationService(
          initialStore,
        ).adaptAndPersist({
          organizationId:
            "organization:korelumina",

          projectId:
            "project:korelumina",

          items: [
            canonicalItem(),
          ],

          generalization: {
            generalized:
              true,

            customerSpecificContentRetained:
              false,
          },
        });

      assert.equal(
        result.records.length,
        1,
      );

      const reconstructedStore =
        new RuntimeOrganizationalMemoryStore(
          root,
        );

      const persisted =
        reconstructedStore.list();

      assert.equal(
        persisted.length,
        1,
      );

      assert.equal(
        persisted[0].id,
        result.records[0].id,
      );

      assert.equal(
        persisted[0].governance
          ?.packageId,
        "KP-2026-000000000601",
      );

      assert.equal(
        persisted[0].governance
          ?.packageVersion,
        "1.0.0",
      );

      assert.equal(
        persisted[0].governance
          ?.trust
          .adaptationValidated,
        true,
      );

      assert.equal(
        persisted[0].governance
          ?.privacy
          .generalized,
        true,
      );
    } finally {
      fs.rmSync(
        root,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);
