import assert from "node:assert/strict";
import test from "node:test";

import {
  CanonicalKnowledgeStore,
} from "../../../canonical-knowledge/index.js";

import type {
  OrganizationalMemoryRecord,
} from "../../../knowledge/organizational-memory/index.js";

import {
  KnowledgePackageService,
} from "../../package/index.js";

import {
  GovernedCanonicalPromotionService,
} from "../GovernedCanonicalPromotionService.js";

test(
  "persists organizational memory only after governed canonical promotion",
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
        persistence,
      );

    const result =
      service.promoteApprovedPackage(
        knowledgePackage.id,
        {
          organizationId:
            "organization:korelumina",

          projectId:
            "project:korelumina",
        },
      );

    assert.equal(
      result.knowledgePackage.state,
      "canonical",
    );

    assert.equal(
      result.organizationalMemoryRecords.length,
      1,
    );

    assert.equal(
      persisted.length,
      1,
    );

    assert.equal(
      persisted[0].id,
      result.organizationalMemoryRecords[0].id,
    );

    assert.equal(
      persisted[0].organizationId,
      "organization:korelumina",
    );
  },
);

test(
  "does not persist organizational memory without organization context",
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
        persistence,
      );

    const result =
      service.promoteApprovedPackage(
        knowledgePackage.id,
      );

    assert.deepEqual(
      result.organizationalMemoryRecords,
      [],
    );

    assert.equal(
      saveCalls,
      0,
    );
  },
);
