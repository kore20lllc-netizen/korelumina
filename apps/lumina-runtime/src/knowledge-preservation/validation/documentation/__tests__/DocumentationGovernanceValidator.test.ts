import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgeIRItem,
} from "../../../ir/index.js";

import {
  DocumentationGovernanceValidator,
} from "../DocumentationGovernanceValidator.js";

function documentItem(
  overrides:
    Partial<KnowledgeIRItem> = {},
): KnowledgeIRItem {
  return {
    id:
      "document:evidence:test",

    candidateType:
      "CandidateArtifact",

    title:
      "Governed documentation",

    summary:
      "Governed documentation.",

    confidence:
      1,

    evidenceRefs: [
      "evidence:test",
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
        "documentation-compiler",

      confidenceBasis:
        "direct-document-evidence",
    },

    status:
      "extracted",

    metadata: {
      source:
        "repository-architecture",

      contentRef:
        "/repo/docs/test.md",

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

      sourceLocation:
        "docs/test.md",

      lineage: [
        "architecture:test",
      ],

      dependencies: [
        "architecture:dependency",
      ],
    },

    ...overrides,
  };
}

test(
  "approved governed documentation validates successfully",
  async () => {
    const validator =
      new DocumentationGovernanceValidator();

    const result =
      await validator.validate(
        documentItem(),
      );

    assert.equal(
      result.status,
      "approved",
    );

    assert.deepEqual(
      result.metadata.validation,
      {
        validator:
          "documentation-governance-validator",

        validatorVersion:
          "1.0.0",

        result:
          "passed",

        checkedAt:
          (
            result.metadata.validation as {
              checkedAt:
                number;
            }
          ).checkedAt,

        issues:
          [],
      },
    );
  },
);

test(
  "unapproved documentation is blocked for remediation",
  async () => {
    const validator =
      new DocumentationGovernanceValidator();

    const result =
      await validator.validate(
        documentItem({
          metadata: {
            ...documentItem()
              .metadata,

            approvalState:
              "draft",
          },
        }),
      );

    assert.equal(
      result.status,
      "needs-review",
    );

    const validation =
      result.metadata.validation as {
        result:
          string;

        issues:
          Array<{
            code:
              string;
          }>;
      };

    assert.equal(
      validation.result,
      "failed",
    );

    assert.ok(
      validation.issues.some(
        (issue) =>
          issue.code ===
          "documentation_source_not_approved",
      ),
    );
  },
);

test(
  "missing governance metadata is blocked instead of silently validated",
  async () => {
    const validator =
      new DocumentationGovernanceValidator();

    const result =
      await validator.validate(
        documentItem({
          metadata: {
            approvalState:
              "approved",
          },
        }),
      );

    assert.equal(
      result.status,
      "needs-review",
    );

    const validation =
      result.metadata.validation as {
        issues:
          unknown[];
      };

    assert.ok(
      validation.issues.length >
      0,
    );
  },
);
