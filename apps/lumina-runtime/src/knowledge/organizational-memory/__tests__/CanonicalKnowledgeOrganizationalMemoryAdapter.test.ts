import assert from "node:assert/strict";
import test from "node:test";

import type {
  CanonicalKnowledgeItem,
} from "../../../canonical-knowledge/index.js";

import {
  adaptCanonicalKnowledgeToOrganizationalMemoryRecords,
} from "../CanonicalKnowledgeOrganizationalMemoryAdapter.js";

function canonicalItem(
  overrides:
    Partial<CanonicalKnowledgeItem> = {},
): CanonicalKnowledgeItem {
  return {
    id:
      "canonical:document:evidence:test",

    type:
      "CandidateArtifact",

    title:
      "KoreLumina Architecture",

    summary:
      "Canonical organizational knowledge.",

    confidence:
      1,

    evidenceRefs: [
      "evidence:document:test",
    ],

    relationships: {
      dependsOn: [
        "canonical:adr:0001",
      ],
    },

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
          "knowledge-package:test",

        reviewerId:
          "reviewer:human",
      },
    },

    ...overrides,
  };
}

test(
  "canonical knowledge projects into organizational memory",
  () => {
    const records =
      adaptCanonicalKnowledgeToOrganizationalMemoryRecords({
        organizationId:
          "organization:korelumina",

        projectId:
          "project:korelumina",

        items: [
          canonicalItem(),
        ],
      });

    assert.equal(
      records.length,
      1,
    );

    const record =
      records[0];

    assert.equal(
      record.id,
      "canonical-memory:canonical:document:evidence:test",
    );

    assert.equal(
      record.organizationId,
      "organization:korelumina",
    );

    assert.equal(
      record.projectId,
      "project:korelumina",
    );

    assert.equal(
      record.title,
      "KoreLumina Architecture",
    );

    assert.equal(
      record.summary,
      "Canonical organizational knowledge.",
    );

    assert.equal(
      record.source,
      "architecture",
    );

    assert.deepEqual(
      record.references,
      [
        "canonical:document:evidence:test",
        "evidence:document:test",
      ],
    );
  },
);

test(
  "projection preserves canonical identity without mutating canonical knowledge",
  () => {
    const canonical =
      canonicalItem();

    const before =
      structuredClone(
        canonical,
      );

    const [
      record,
    ] =
      adaptCanonicalKnowledgeToOrganizationalMemoryRecords({
        organizationId:
          "organization:korelumina",

        items: [
          canonical,
        ],
      });

    assert.deepEqual(
      canonical,
      before,
    );

    assert.ok(
      record.references.includes(
        canonical.id,
      ),
    );

    assert.equal(
      canonical.status,
      "canonical",
    );
  },
);

test(
  "organizational memory projection is downstream-only",
  () => {
    const [
      record,
    ] =
      adaptCanonicalKnowledgeToOrganizationalMemoryRecords({
        organizationId:
          "organization:korelumina",

        items: [
          canonicalItem({
            metadata: {},
          }),
        ],
      });

    assert.equal(
      record.source,
      "reconciliation",
    );

    assert.equal(
      "status" in record,
      false,
    );

    assert.equal(
      "confidence" in record,
      false,
    );
  },
);
