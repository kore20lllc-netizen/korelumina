import assert from "node:assert/strict";
import test from "node:test";

import {
  CanonicalKnowledgeStore,
} from "../../../canonical-knowledge/index.js";

import type {
  OrganizationalMemoryRecord,
} from "../../../knowledge/organizational-memory/index.js";

import {
  adaptCanonicalKnowledgeToOrganizationalMemoryRecords,
} from "../../../knowledge/organizational-memory/index.js";

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

function candidate(
  id: string,
): KnowledgeIRItem {
  return {
    id,

    candidateType:
      "CandidateArtifact",

    title:
      "Architecture",

    summary:
      "Governed architecture knowledge.",

    confidence:
      1,

    evidenceRefs: [
      `evidence:${id}`,
    ],

    proposedRelationships:
      {},

    extractedAt:
      1,

    compiler: {
      compilerName:
        "documentation-compiler",

      compilerVersion:
        "1.0.0",

      evidenceSourceType:
        "document",

      extractedAt:
        1,

      extractionMethod:
        "direct-evidence",

      confidenceBasis:
        "test-fixture",
    },

    status:
      "approved",

    metadata: {
      authorityClass:
        "constitutional",

      approvalState:
        "approved",

      owner:
        "KoreLumina Architecture",

      scope:
        "platform",

      version:
        "1.0.0",

      source:
        "test",

      sourceLocation:
        "test",

      contentRef:
        "test",

      lineage:
        [],

      dependencies:
        [],
    },
  };
}

function createApprovedPackage(
  id: string,
) {
  const packageService =
    new KnowledgePackageService();

  const knowledgePackage =
    packageService.packageValidated([
      candidate(
        id,
      ),
    ]);

  assert.ok(
    knowledgePackage,
  );

  new CanonicalReviewService(
    packageService,
  ).review({
    packageId:
      knowledgePackage.id,

    decision:
      "approved",

    reviewerId:
      "reviewer:test",

    reviewedAt:
      2,

    evidenceConsidered:
      [
        ...knowledgePackage
          .sourceEvidenceRefs,
      ],

    reason:
      "Governed approval.",
  });

  return {
    packageService,
    knowledgePackage:
      packageService.get(
        knowledgePackage.id,
      )!,
  };
}

test(
  "organizational memory can be explicitly persisted after governed canonical promotion",
  () => {
    const {
      packageService,
      knowledgePackage,
    } =
      createApprovedPackage(
        "candidate:persistence-test",
      );

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const persisted:
      OrganizationalMemoryRecord[] =
      [];

    const persistence = {
      saveAll(
        records:
          readonly OrganizationalMemoryRecord[],
      ) {
        persisted.push(
          ...records,
        );
      },
    };

    const service =
      new GovernedCanonicalPromotionService(
        packageService,
        canonicalStore,
      );

    const result =
      service.promoteApprovedPackage(
        knowledgePackage.id,
      );

    assert.equal(
      result.knowledgePackage.state,
      "canonical",
    );

    const organizationalMemoryRecords =
      adaptCanonicalKnowledgeToOrganizationalMemoryRecords({
        organizationId:
          "organization:korelumina",

        projectId:
          "project:korelumina",

        items:
          result.canonicalItems,
      });

    persistence.saveAll(
      organizationalMemoryRecords,
    );

    assert.equal(
      organizationalMemoryRecords.length,
      1,
    );

    assert.equal(
      persisted.length,
      1,
    );

    assert.equal(
      persisted[0].id,
      organizationalMemoryRecords[0].id,
    );

    assert.equal(
      persisted[0].organizationId,
      "organization:korelumina",
    );
  },
);

test(
  "canonical promotion does not implicitly persist organizational memory",
  () => {
    const {
      packageService,
      knowledgePackage,
    } =
      createApprovedPackage(
        "candidate:no-implicit-memory",
      );

    const canonicalStore =
      new CanonicalKnowledgeStore();

    let saveCalls =
      0;

    const persistence = {
      saveAll() {
        saveCalls +=
          1;
      },
    };

    const service =
      new GovernedCanonicalPromotionService(
        packageService,
        canonicalStore,
      );

    const result =
      service.promoteApprovedPackage(
        knowledgePackage.id,
      );

    assert.equal(
      result.knowledgePackage.state,
      "canonical",
    );

    assert.equal(
      saveCalls,
      0,
    );

    void persistence;
  },
);
