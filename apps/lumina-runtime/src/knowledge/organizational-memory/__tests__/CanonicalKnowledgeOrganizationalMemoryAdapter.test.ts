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


test(
  "canonical projection preserves governed stewardship metadata",
  () => {
    const canonical =
      canonicalItem({
        metadata: {
          authorityClass:
            "constitutional",

          governance: {
            packageId:
              "KP-2026-000000000301",

            packageVersion:
              "3.0.0",

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
              1786000000000,

            reviewReason:
              "Approved stable organizational pattern.",

            provenance: {
              evidenceIds: [
                "evidence:runtime-recovery",
              ],

              sourceLocations: [
                "docs/runtime-recovery.md",
              ],

              contentRefs: [
                "sha256:runtime-recovery",
              ],

              sources: [
                "repository",
              ],
            },

            lineage: [
              "knowledge-ir:runtime-recovery",
            ],

            dependencies: [
              "runtime:isolation",
            ],

            supersedes: [
              "canonical:runtime-recovery:v2",
            ],
          },
        } as never,
      });

    const [
      memory,
    ] =
      adaptCanonicalKnowledgeToOrganizationalMemoryRecords({
        organizationId:
          "organization:korelumina",

        projectId:
          "project:korelumina",

        items: [
          canonical,
        ],

        generalization: {
          generalized:
            true,

          customerSpecificContentRetained:
            false,
        },
      });

    assert.ok(
      memory.governance,
    );

    assert.equal(
      memory.governance.canonicalItemId,
      canonical.id,
    );

    assert.equal(
      memory.governance.packageId,
      "KP-2026-000000000301",
    );

    assert.equal(
      memory.governance.packageVersion,
      "3.0.0",
    );

    assert.equal(
      memory.governance.authority,
      "Architecture Council",
    );

    assert.equal(
      memory.governance.scope,
      "organizational",
    );

    assert.equal(
      memory.governance.approval?.decision,
      "approved",
    );

    assert.equal(
      memory.governance.approval?.reviewerId,
      "reviewer:architect",
    );

    assert.deepEqual(
      memory.governance.lineage,
      [
        "knowledge-ir:runtime-recovery",
      ],
    );

    assert.deepEqual(
      memory.governance.dependencies,
      [
        "runtime:isolation",
      ],
    );

    assert.deepEqual(
      memory.governance.supersedes,
      [
        "canonical:runtime-recovery:v2",
      ],
    );

    assert.equal(
      memory.governance.trust.canonical,
      true,
    );

    assert.equal(
      memory.governance.trust.humanApproved,
      true,
    );

    assert.equal(
      memory.governance.trust.adaptationValidated,
      false,
    );

    assert.equal(
      memory.governance.privacy.generalized,
      true,
    );

    assert.equal(
      memory.governance.privacy.customerSpecificContentRetained,
      false,
    );

    assert.ok(
      memory.governance.provenanceRefs.includes(
        "docs/runtime-recovery.md",
      ),
    );
  },
);

test(
  "canonical projection does not claim generalization without explicit declaration",
  () => {
    const [
      memory,
    ] =
      adaptCanonicalKnowledgeToOrganizationalMemoryRecords({
        organizationId:
          "organization:korelumina",

        items: [
          canonicalItem(),
        ],
      });

    assert.ok(
      memory.governance,
    );

    assert.equal(
      memory.governance.privacy.generalized,
      false,
    );

    assert.equal(
      memory.governance.trust.adaptationValidated,
      false,
    );
  },
);
