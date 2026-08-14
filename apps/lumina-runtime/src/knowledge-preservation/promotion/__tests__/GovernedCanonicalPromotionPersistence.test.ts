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

import {
  KnowledgePackageService,
} from "../../package/index.js";

import {
  GovernedCanonicalPromotionService,
} from "../GovernedCanonicalPromotionService.js";

test(
  "organizational memory can be explicitly persisted after governed canonical promotion",
  () => {
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const knowledgePackage = {
      id:
        "knowledge-package:persistence-test",

      state:
        "approved",

      sourceEvidenceRefs: [
        "evidence:test",
      ],

      items: [
        {
          id:
            "document:evidence:test",

          type:
            "CandidateArtifact",

          title:
            "Architecture",

          summary:
            "Governed architecture knowledge.",

          confidence:
            1,

          evidenceRefs: [
            "evidence:test",
          ],

          relationships:
            {},

          metadata: {
            authorityClass:
              "constitutional",
          },

          compiler: {
            compilerName:
              "documentation-compiler",
          },

          createdAt:
            1,

          updatedAt:
            1,

          status:
            "validated",
        },
      ],

      createdAt:
        1,

      updatedAt:
        2,

      metadata: {
        review: {
          decision:
            "approved",

          reviewerId:
            "reviewer:test",

          reviewedAt:
            2,

          reason:
            "approved",
        },
      },
    };

    packageService.registry.register(
      knowledgePackage as never,
    );

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
    const packageService =
      new KnowledgePackageService();

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const knowledgePackage = {
      id:
        "knowledge-package:no-context",

      state:
        "approved",

      sourceEvidenceRefs: [
        "evidence:test",
      ],

      items: [
        {
          id:
            "document:evidence:test",

          type:
            "CandidateArtifact",

          title:
            "Architecture",

          summary:
            "Governed architecture knowledge.",

          confidence:
            1,

          evidenceRefs: [
            "evidence:test",
          ],

          relationships:
            {},

          metadata:
            {},

          compiler: {
            compilerName:
              "documentation-compiler",
          },

          createdAt:
            1,

          updatedAt:
            1,

          status:
            "validated",
        },
      ],

      createdAt:
        1,

      updatedAt:
        2,

      metadata: {
        review: {
          decision:
            "approved",

          reviewerId:
            "reviewer:test",

          reviewedAt:
            2,
        },
      },
    };

    packageService.registry.register(
      knowledgePackage as never,
    );

    let saveCalls = 0;

    const persistence = {
      saveAll() {
        saveCalls += 1;
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
  },
);
