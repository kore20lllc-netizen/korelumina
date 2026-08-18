import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  createKnowledgePreservationPlatform,
} from "../../../bootstrap/index.js";

function repositoryRoot():
string {
  let current =
    process.cwd();

  for (
    let depth = 0;
    depth < 8;
    depth += 1
  ) {
    const document =
      path.join(
        current,
        "docs",
        "architecture",
        "EXECUTIVE_MUTATION_GOVERNANCE_SPECIFICATION_V1.md",
      );

    if (
      fs.existsSync(
        document,
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
    "repository_root_not_found",
  );
}

test(
  "real approved KoreLumina document reaches governed awaiting-review package without canonical promotion",
  async () => {
    const root =
      repositoryRoot();

    const sourceLocation =
      "docs/architecture/EXECUTIVE_MUTATION_GOVERNANCE_SPECIFICATION_V1.md";

    const contentRef =
      path.join(
        root,
        sourceLocation,
      );

    assert.equal(
      fs.existsSync(
        contentRef,
      ),
      true,
    );

    const stat =
      fs.statSync(
        contentRef,
      );

    const platform =
      createKnowledgePreservationPlatform();

    const evidenceId =
      "evidence:documentation-pipeline:executive-mutation-governance-v1";

    await platform.preserve({
      id:
        evidenceId,

      type:
        "document",

      title:
        "Executive Mutation Governance Specification V1",

      source:
        "repository-architecture",

      capturedAt:
        stat.mtimeMs,

      observedAt:
        stat.mtimeMs,

      contentRef,

      metadata: {
        confidence:
          1,

        authorityClass:
          "architecture-specification",

        approvalState:
          "approved",

        owner:
          "korelumina-architecture",

        scope:
          "platform",

        version:
          "1.0.0",

        sourceLocation,

        documentClassification:
          "governance-specification",

        lineage: [
          "executive-governance",
        ],

        dependencies: [
          "knowledge-constitution",
        ],

        destination:
          "canonical-review",
      },

      relationships: {
        dependsOn: [
          "knowledge-constitution",
        ],
      },
    });

    const knowledgePackage =
      platform.packageService
        .list()
        .find(
          (item) =>
            item.sourceEvidenceRefs
              .includes(
                evidenceId,
              ),
        );

    assert.ok(
      knowledgePackage,
    );

    assert.match(
      knowledgePackage.id,
      /^KP-\d{4}-\d{6}$/,
    );

    assert.equal(
      knowledgePackage.state,
      "awaiting_review",
    );

    assert.equal(
      knowledgePackage.approvalState,
      "pending_review",
    );

    assert.equal(
      knowledgePackage.authority,
      "architecture-specification",
    );

    assert.equal(
      knowledgePackage.owner,
      "korelumina-architecture",
    );

    assert.equal(
      knowledgePackage.scope,
      "platform",
    );

    assert.equal(
      knowledgePackage.version,
      "1.0.0",
    );

    assert.equal(
      knowledgePackage.destination,
      "canonical-review",
    );

    assert.equal(
      knowledgePackage.items.length,
      1,
    );

    const item =
      knowledgePackage.items[0];

    assert.equal(
      item.compiler.compilerName,
      "documentation-compiler",
    );

    assert.equal(
      item.status,
      "approved",
    );

    assert.equal(
      item.metadata.sourceLocation,
      sourceLocation,
    );

    assert.equal(
      item.metadata.documentClassification,
      "governance-specification",
    );

    const validation =
      item.metadata.validation as {
        validator:
          string;

        result:
          string;

        issues:
          unknown[];
      };

    assert.equal(
      validation.validator,
      "documentation-governance-validator",
    );

    assert.equal(
      validation.result,
      "passed",
    );

    assert.deepEqual(
      validation.issues,
      [],
    );

    assert.equal(
      knowledgePackage.validationResults[0].blocked,
      false,
    );

    assert.equal(
      knowledgePackage.compilerHistory[0]
        .compiler.compilerName,
      "documentation-compiler",
    );

    assert.deepEqual(
      knowledgePackage.lifecycleHistory.map(
        (entry) =>
          entry.state,
      ),
      [
        "captured",
        "compiled",
        "validated",
        "awaiting_review",
      ],
    );

    assert.deepEqual(
      platform.canonicalKnowledgeStore.list(),
      [],
    );
  },
);
