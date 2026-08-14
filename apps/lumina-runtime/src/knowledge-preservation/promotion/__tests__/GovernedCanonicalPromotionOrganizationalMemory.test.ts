import assert from "node:assert/strict";
import test from "node:test";

import {
  CanonicalKnowledgeStore,
} from "../../../canonical-knowledge/CanonicalKnowledgeStore.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import {
  KnowledgePackageService,
} from "../../package/index.js";

import {
  CanonicalReviewService,
} from "../../review/index.js";

import {
  GovernedCanonicalPromotionService,
} from "../GovernedCanonicalPromotionService.js";

import {
  adaptCanonicalKnowledgeToOrganizationalMemoryRecords,
} from "../../../knowledge/organizational-memory/index.js";

function candidate(
  id: string,
): KnowledgeIRItem {
  return {
    id,

    candidateType:
      "CandidateArtifact",

    title:
      "Organizational memory projection candidate",

    summary:
      "Canonical knowledge projected downstream.",

    confidence:
      1,

    evidenceRefs: [
      `evidence:${id}`,
    ],

    proposedRelationships:
      {},

    extractedAt:
      0,

    compiler: {
      compilerName:
        "PromotionMemoryProjectionTest",

      compilerVersion:
        "1.0.0",

      evidenceSourceType:
        "document",

      extractedAt:
        0,

      extractionMethod:
        "direct-evidence",

      confidenceBasis:
        "test-fixture",
    },

    status:
      "extracted",

    metadata: {
      authorityClass:
        "constitutional",
    },
  };
}

test(
  "organizational memory adaptation consumes governed canonical output",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:memory-projection",
        ),
      ]);

    assert.ok(
      created,
    );

    new CanonicalReviewService(
      packageService,
    ).review({
      packageId:
        created.id,

      decision:
        "approved",

      reviewerId:
        "reviewer:human",

      reviewedAt:
        1000,
    });

    const result =
      new GovernedCanonicalPromotionService(
        packageService,
        canonicalStore,
      ).promoteApprovedPackage(
        created.id,
      );

    assert.equal(
      result.canonicalItems.length,
      1,
    );

    const canonical =
      result.canonicalItems[0];

    const organizationalMemoryRecords =
      adaptCanonicalKnowledgeToOrganizationalMemoryRecords({
        organizationId:
          "organization:korelumina",

        projectId:
          "project:korelumina",

        teamId:
          "team:architecture",

        items:
          result.canonicalItems,
      });

    assert.equal(
      organizationalMemoryRecords.length,
      1,
    );

    const memory =
      organizationalMemoryRecords[0];

    assert.equal(
      memory.id,
      `canonical-memory:${canonical.id}`,
    );

    assert.equal(
      memory.organizationId,
      "organization:korelumina",
    );

    assert.equal(
      memory.projectId,
      "project:korelumina",
    );

    assert.equal(
      memory.teamId,
      "team:architecture",
    );

    assert.ok(
      memory.references.includes(
        canonical.id,
      ),
    );

    for (
      const evidenceRef
      of canonical.evidenceRefs
    ) {
      assert.ok(
        memory.references.includes(
          evidenceRef,
        ),
      );
    }
  },
);

test(
  "canonical promotion does not require organizational memory adaptation",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:no-memory-context",
        ),
      ]);

    assert.ok(
      created,
    );

    new CanonicalReviewService(
      packageService,
    ).review({
      packageId:
        created.id,

      decision:
        "approved",

      reviewerId:
        "reviewer:human",

      reviewedAt:
        2000,
    });

    const result =
      new GovernedCanonicalPromotionService(
        packageService,
        canonicalStore,
      ).promoteApprovedPackage(
        created.id,
      );

    assert.equal(
      result.knowledgePackage.state,
      "canonical",
    );

    assert.equal(
      result.canonicalItems.length,
      1,
    );

    assert.equal(
      result.knowledgePackage.state,
      "canonical",
    );
  },
);

test(
  "memory projection receives only canonical output",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const created =
      packageService.packageValidated([
        candidate(
          "candidate:downstream-only",
        ),
      ]);

    assert.ok(
      created,
    );

    assert.throws(
      () =>
        new GovernedCanonicalPromotionService(
          packageService,
          canonicalStore,
        ).promoteApprovedPackage(
          created.id,
        ),
      /knowledge_package_not_approved/,
    );

    assert.equal(
      canonicalStore.size(),
      0,
    );
  },
);
