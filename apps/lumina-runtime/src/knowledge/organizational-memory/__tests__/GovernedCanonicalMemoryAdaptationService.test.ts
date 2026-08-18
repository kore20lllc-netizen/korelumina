import assert from "node:assert/strict";
import test from "node:test";

import type {
  CanonicalKnowledgeItem,
} from "../../../canonical-knowledge/index.js";

import type {
  OrganizationalMemoryRecord,
} from "../OrganizationalMemoryRecord.js";

import {
  GovernedCanonicalMemoryAdaptationService,
} from "../GovernedCanonicalMemoryAdaptationService.js";

function canonicalItem(
  overrides:
    Partial<CanonicalKnowledgeItem> = {},
): CanonicalKnowledgeItem {
  return {
    id:
      "canonical:governed-adaptation",

    type:
      "CandidateArtifact",

    title:
      "Generalized runtime recovery pattern",

    summary:
      "Reusable organizational runtime recovery guidance.",

    confidence:
      1,

    evidenceRefs: [
      "evidence:runtime-recovery",
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
          "KP-2026-000000000401",

        packageVersion:
          2,

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

        reviewReason:
          "Approved for governed organizational adaptation.",

        provenance: {
          evidenceIds: [
            "evidence:runtime-recovery",
          ],

          sourceLocations:
            [],

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
      },
    },

    ...overrides,
  };
}

test(
  "validated generalized canonical knowledge persists as trusted organizational memory",
  () => {
    const persisted:
      OrganizationalMemoryRecord[] =
      [];

    const service =
      new GovernedCanonicalMemoryAdaptationService({
        saveAll(
          records,
        ) {
          persisted.push(
            ...records,
          );
        },
      });

    const result =
      service.adaptAndPersist({
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

    assert.equal(
      persisted.length,
      1,
    );

    const record =
      result.records[0];

    assert.ok(
      record.governance,
    );

    assert.equal(
      record.governance.packageId,
      "KP-2026-000000000401",
    );

    assert.equal(
      record.governance.approval?.decision,
      "approved",
    );

    assert.equal(
      record.governance.trust.canonical,
      true,
    );

    assert.equal(
      record.governance.trust.humanApproved,
      true,
    );

    assert.equal(
      record.governance.trust.adaptationValidated,
      true,
    );

    assert.equal(
      record.governance.privacy.generalized,
      true,
    );

    assert.equal(
      record.governance.privacy.customerSpecificContentRetained,
      false,
    );
  },
);

test(
  "canonical knowledge without human approval cannot enter organizational memory",
  () => {
    let saveCalls =
      0;

    const service =
      new GovernedCanonicalMemoryAdaptationService({
        saveAll() {
          saveCalls +=
            1;
        },
      });

    assert.throws(
      () =>
        service.adaptAndPersist({
          organizationId:
            "organization:korelumina",

          items: [
            canonicalItem({
              metadata: {
                authorityClass:
                  "constitutional",

                governance: {
                  packageId:
                    "KP-2026-000000000402",

                  reviewDecision:
                    "approved",
                },
              } as never,
            }),
          ],

          generalization: {
            generalized:
              true,

            customerSpecificContentRetained:
              false,
          },
        }),
      /organizational_memory_human_approval_missing/,
    );

    assert.equal(
      saveCalls,
      0,
    );
  },
);

test(
  "canonical knowledge without package lineage cannot enter organizational memory",
  () => {
    let saveCalls =
      0;

    const service =
      new GovernedCanonicalMemoryAdaptationService({
        saveAll() {
          saveCalls +=
            1;
        },
      });

    assert.throws(
      () =>
        service.adaptAndPersist({
          organizationId:
            "organization:korelumina",

          items: [
            canonicalItem({
              metadata: {
                authorityClass:
                  "constitutional",

                governance: {
                  reviewDecision:
                    "approved",

                  reviewerId:
                    "reviewer:architect",

                  reviewedAt:
                    2000,
                },
              } as never,
            }),
          ],

          generalization: {
            generalized:
              true,

            customerSpecificContentRetained:
              false,
          },
        }),
      /organizational_memory_package_reference_missing/,
    );

    assert.equal(
      saveCalls,
      0,
    );
  },
);

test(
  "adaptation validation occurs before persistence",
  () => {
    let saveCalls =
      0;

    const service =
      new GovernedCanonicalMemoryAdaptationService({
        saveAll() {
          saveCalls +=
            1;
        },
      });

    assert.throws(
      () =>
        service.adaptAndPersist({
          organizationId:
            "",

          items: [
            canonicalItem(),
          ],

          generalization: {
            generalized:
              true,

            customerSpecificContentRetained:
              false,
          },
        }),
      /organizational_memory_validation_failed:organizational_memory.record.missing_organization_id/,
    );

    assert.equal(
      saveCalls,
      0,
    );
  },
);

test(
  "canonical promotion remains independent from organizational memory adaptation",
  () => {
    const source =
      canonicalItem();

    const before =
      structuredClone(
        source,
      );

    const persisted:
      OrganizationalMemoryRecord[] =
      [];

    new GovernedCanonicalMemoryAdaptationService({
      saveAll(
        records,
      ) {
        persisted.push(
          ...records,
        );
      },
    }).adaptAndPersist({
      organizationId:
        "organization:korelumina",

      items: [
        source,
      ],

      generalization: {
        generalized:
          true,

        customerSpecificContentRetained:
          false,
      },
    });

    assert.deepEqual(
      source,
      before,
    );

    assert.equal(
      persisted.length,
      1,
    );
  },
);
