import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import {
  KnowledgePackageFactory,
  KnowledgePackageService,
} from "../index.js";

function validatedItem(
  overrides:
    Partial<KnowledgeIRItem> = {},
): KnowledgeIRItem {
  return {
    id:
      "candidate:package-test",

    candidateType:
      "CandidateArtifact",

    title:
      "Package boundary candidate",

    summary:
      "Validated IR must become reviewable package, not canonical knowledge.",

    confidence:
      1,

    evidenceRefs: [
      "evidence:package-test",
    ],

    proposedRelationships:
      {},

    extractedAt:
      1,

    compiler: {
      compilerName:
        "PackageBoundaryTestCompiler",

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
      source:
        "repository",

      contentRef:
        "/repo/docs/test.md",

      capturedAt:
        Date.UTC(
          2026,
          0,
          1,
        ),

      observedAt:
        Date.UTC(
          2026,
          0,
          1,
        ),

      authorityClass:
        "architecture-specification",

      approvalState:
        "approved-source",

      owner:
        "korelumina-architecture",

      scope:
        "platform",

      version:
        "1.0.0",

      sourceLocation:
        "docs/test.md",

      lineage: [
        "source:test",
      ],

      dependencies: [
        "dependency:test",
      ],

      supersedes: [
        "package:legacy",
      ],

      validation: {
        validator:
          "package-boundary-test",

        result:
          "passed",
      },
    },

    ...overrides,
  };
}

test(
  "validated IR becomes an awaiting-review persistent knowledge capsule",
  () => {
    const service =
      new KnowledgePackageService();

    const item =
      validatedItem();

    const knowledgePackage =
      service.packageValidated([
        item,
      ]);

    assert.ok(
      knowledgePackage,
    );

    assert.match(
      knowledgePackage.id,
      /^KP-2026-\d{12}$/,
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
      knowledgePackage.remediation.required,
      false,
    );

    assert.equal(
      knowledgePackage.remediation.status,
      "not_required",
    );

    assert.deepEqual(
      knowledgePackage.knowledgeItemIds,
      [
        item.id,
      ],
    );

    assert.deepEqual(
      knowledgePackage.sourceEvidenceRefs,
      [
        "evidence:package-test",
      ],
    );

    assert.deepEqual(
      knowledgePackage.provenance,
      {
        evidenceIds: [
          "evidence:package-test",
        ],

        sourceLocations: [
          "docs/test.md",
        ],

        contentRefs: [
          "/repo/docs/test.md",
        ],

        sources: [
          "repository",
        ],
      },
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
      knowledgePackage.confidence,
      1,
    );

    assert.deepEqual(
      knowledgePackage.dependencies,
      [
        "dependency:test",
      ],
    );

    assert.deepEqual(
      knowledgePackage.lineage,
      [
        "source:test",
      ],
    );

    assert.deepEqual(
      knowledgePackage.supersession.supersedes,
      [
        "package:legacy",
      ],
    );

    assert.equal(
      knowledgePackage.validationResults.length,
      1,
    );

    assert.equal(
      knowledgePackage.validationResults[0].blocked,
      false,
    );

    assert.equal(
      knowledgePackage.compilerHistory[0]
        .compiler.compilerName,
      "PackageBoundaryTestCompiler",
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
  },
);

test(
  "package identity is deterministic for identical validated IR",
  () => {
    const factory =
      new KnowledgePackageFactory();

    const item =
      validatedItem();

    const first =
      factory.createAwaitingReview([
        item,
      ]);

    const second =
      factory.createAwaitingReview([
        item,
      ]);

    assert.equal(
      first.id,
      second.id,
    );
  },
);

test(
  "package identity is independent of IR item ordering",
  () => {
    const factory =
      new KnowledgePackageFactory();

    const first =
      validatedItem({
        id:
          "candidate:first",

        evidenceRefs: [
          "evidence:first",
        ],
      });

    const second =
      validatedItem({
        id:
          "candidate:second",

        evidenceRefs: [
          "evidence:second",
        ],
      });

    const a =
      factory.createAwaitingReview([
        first,
        second,
      ]);

    const b =
      factory.createAwaitingReview([
        second,
        first,
      ]);

    assert.equal(
      a.id,
      b.id,
    );
  },
);

test(
  "validation defects create truthful blocked remediation state instead of awaiting review",
  () => {
    const service =
      new KnowledgePackageService();

    const blocked =
      validatedItem({
        id:
          "candidate:blocked",

        status:
          "needs-review",

        metadata: {
          ...validatedItem()
            .metadata,

          validation: {
            validator:
              "governed-validator",

            result:
              "failed",

            issues: [
              "missing-authority-proof",
            ],
          },
        },
      });

    const knowledgePackage =
      service.packageValidated([
        blocked,
      ]);

    assert.ok(
      knowledgePackage,
    );

    assert.equal(
      knowledgePackage.state,
      "validated",
    );

    assert.equal(
      knowledgePackage.approvalState,
      "remediation_required",
    );

    assert.equal(
      knowledgePackage.remediation.required,
      true,
    );

    assert.equal(
      knowledgePackage.remediation.status,
      "required",
    );

    assert.deepEqual(
      knowledgePackage.remediation.blockedItemIds,
      [
        "candidate:blocked",
      ],
    );

    assert.equal(
      knowledgePackage.validationResults[0].blocked,
      true,
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
      ],
    );
  },
);

test(
  "package service registers created packages",
  () => {
    const service =
      new KnowledgePackageService();

    const knowledgePackage =
      service.packageValidated([
        validatedItem(),
      ]);

    assert.ok(
      knowledgePackage,
    );

    assert.deepEqual(
      service.get(
        knowledgePackage.id,
      ),
      knowledgePackage,
    );
  },
);

test(
  "empty validation output does not create an empty package",
  () => {
    const service =
      new KnowledgePackageService();

    assert.equal(
      service.packageValidated(
        [],
      ),
      undefined,
    );
  },
);

test(
  "package persists identity lifecycle provenance compiler and validation history across service instances",
  () => {
    const firstService =
      new KnowledgePackageService();

    const item =
      validatedItem({
        id:
          "candidate:persistence-roundtrip",

        evidenceRefs: [
          "evidence:persistence-roundtrip",
        ],
      });

    const created =
      firstService.packageValidated([
        item,
      ]);

    assert.ok(
      created,
    );

    const secondService =
      new KnowledgePackageService();

    const reloaded =
      secondService.get(
        created.id,
      );

    assert.ok(
      reloaded,
    );

    assert.equal(
      reloaded.id,
      created.id,
    );

    assert.equal(
      reloaded.state,
      "awaiting_review",
    );

    assert.equal(
      reloaded.approvalState,
      "pending_review",
    );

    assert.deepEqual(
      reloaded.lifecycleHistory,
      created.lifecycleHistory,
    );

    assert.deepEqual(
      reloaded.provenance,
      created.provenance,
    );

    assert.deepEqual(
      reloaded.compilerHistory,
      created.compilerHistory,
    );

    assert.deepEqual(
      reloaded.validationResults,
      created.validationResults,
    );

    assert.deepEqual(
      reloaded.remediation,
      created.remediation,
    );

    assert.equal(
      "canonical" in reloaded,
      false,
    );
  },
);
