import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/createKnowledgePreservationPlatform.js";

import type {
  EvidenceItem,
} from "../../evidence/index.js";

import {
  CanonicalReviewService,
} from "../../review/index.js";

import {
  GovernedCanonicalPromotionService,
} from "../../promotion/index.js";

import {
  CanonicalKnowledgeStore,
} from "../../../canonical-knowledge/CanonicalKnowledgeStore.js";

import {
  adaptCanonicalKnowledgeToOrganizationalMemoryRecords,
} from "../../../knowledge/organizational-memory/index.js";

function resolveRepositoryRoot(): string {
  let current =
    process.cwd();

  for (
    let depth = 0;
    depth < 8;
    depth += 1
  ) {
    const architectureDocument =
      path.join(
        current,
        "KORELUMINA_MASTER_ARCHITECTURE.md",
      );

    const runtimePackage =
      path.join(
        current,
        "apps",
        "lumina-runtime",
        "package.json",
      );

    if (
      fs.existsSync(
        architectureDocument,
      ) &&
      fs.existsSync(
        runtimePackage,
      )
    ) {
      return current;
    }

    const parent =
      path.dirname(
        current,
      );

    if (
      parent === current
    ) {
      break;
    }

    current =
      parent;
  }

  throw new Error(
    "korelumina_repository_root_not_found",
  );
}

test(
  "real approved KoreLumina master architecture traverses the full governed knowledge path",
  async () => {
    const repositoryRoot =
      resolveRepositoryRoot();

    const documentPath =
      path.join(
        repositoryRoot,
        "KORELUMINA_MASTER_ARCHITECTURE.md",
      );

    assert.equal(
      fs.existsSync(
        documentPath,
      ),
      true,
    );

    const documentContent =
      fs.readFileSync(
        documentPath,
        "utf8",
      );

    assert.ok(
      documentContent.trim().length >
        0,
    );

    const evidence:
      EvidenceItem = {
        id:
          "evidence:korelumina-master-architecture",

        type:
          "document",

        title:
          "KoreLumina Master Architecture",

        source:
          "repository",

        capturedAt:
          1000,

        observedAt:
          1000,

        contentRef:
          documentPath,

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
            "current",

          sourceLocation:
            "KORELUMINA_MASTER_ARCHITECTURE.md",

          confidence:
            1,
        },

        relationships:
          {},
      };

    const platform =
      createKnowledgePreservationPlatform();

    await platform.preserve(
      evidence,
    );

    const packageCandidate =
      platform.packageService
        .list()
        .find(
          (candidate) =>
            candidate.sourceEvidenceRefs.includes(
              evidence.id,
            ),
        );

    assert.ok(
      packageCandidate,
    );

    assert.equal(
      packageCandidate.state,
      "awaiting_review",
    );

    assert.equal(
      packageCandidate.items.length,
      1,
    );

    const compiledItem =
      packageCandidate.items[0];

    assert.equal(
      compiledItem.compiler.compilerName,
      "documentation-compiler",
    );

    assert.deepEqual(
      compiledItem.evidenceRefs,
      [
        evidence.id,
      ],
    );

    assert.equal(
      compiledItem.metadata.authorityClass,
      "constitutional",
    );

    assert.equal(
      compiledItem.metadata.approvalState,
      "approved",
    );

    assert.equal(
      compiledItem.metadata.sourceLocation,
      "KORELUMINA_MASTER_ARCHITECTURE.md",
    );

    assert.deepEqual(
      platform.canonicalKnowledgeStore.list(),
      [],
    );

    const reviewService =
      new CanonicalReviewService(
        platform.packageService,
      );

    const reviewed =
      reviewService.review({
        packageId:
          packageCandidate.id,

        decision:
          "approved",

        reviewerId:
          "reviewer:full-path-certification",

        reviewedAt:
          2000,

        reason:
          "Approved master architecture certification fixture.",
      });

    assert.equal(
      reviewed.knowledgePackage.state,
      "approved",
    );

    const canonicalStore =
      new CanonicalKnowledgeStore();

    const promotionService =
      new GovernedCanonicalPromotionService(
        platform.packageService,
        canonicalStore,
      );

    const promoted =
      promotionService
        .promoteApprovedPackage(
          packageCandidate.id,
        );

    assert.equal(
      promoted.knowledgePackage.state,
      "canonical",
    );

    assert.equal(
      promoted.canonicalItems.length,
      1,
    );

    const canonical =
      promoted.canonicalItems[0];

    const organizationalMemoryRecords =
      adaptCanonicalKnowledgeToOrganizationalMemoryRecords({
        organizationId:
          "organization:korelumina",

        projectId:
          "project:korelumina",

        items:
          promoted.canonicalItems,
      });

    assert.equal(
      organizationalMemoryRecords.length,
      1,
    );

    const memory =
      organizationalMemoryRecords[0];

    assert.equal(
      canonical.status,
      "canonical",
    );

    assert.deepEqual(
      canonical.evidenceRefs,
      [
        evidence.id,
      ],
    );

    assert.ok(
      memory.references.includes(
        canonical.id,
      ),
    );

    assert.ok(
      memory.references.includes(
        evidence.id,
      ),
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
      canonicalStore.size(),
      1,
    );

    const reloadedPackage =
      platform.packageService.get(
        packageCandidate.id,
      );

    assert.ok(
      reloadedPackage,
    );

    assert.equal(
      reloadedPackage.state,
      "canonical",
    );
  },
);
