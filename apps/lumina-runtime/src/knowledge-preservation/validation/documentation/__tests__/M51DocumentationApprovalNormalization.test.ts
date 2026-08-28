import assert from "node:assert/strict";
import test from "node:test";

import {
  DocumentationGovernanceValidator,
} from "../DocumentationGovernanceValidator.js";

import type {
  KnowledgeIRItem,
} from "../../../ir/index.js";


function itemWithApprovalState(
  approvalState:
    string,
): KnowledgeIRItem {
  return {
    id:
      "document:m51-approval-normalization",

    candidateType:
      "CandidateArtifact",

    title:
      "Mission Ownership",

    summary:
      "Mission ownership governance evidence.",

    confidence:
      1,

    evidenceRefs: [
      "genesis-evidence:m51",
    ],

    proposedRelationships:
      {},

    extractedAt:
      1_700_000_000_000,

    compiler: {
      compilerName:
        "documentation-compiler",

      compilerVersion:
        "1.0.0",

      evidenceSourceType:
        "document",

      extractedAt:
        1_700_000_000_000,

      extractionMethod:
        "documentation-compiler",

      confidenceBasis:
        "direct-document-evidence",
    },

    status:
      "extracted",

    metadata: {
      source:
        "genesis-historical-replay",

      contentRef:
        "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

      authorityClass:
        "governance",

      approvalState,

      owner:
        "Chief Systems Architect",

      scope:
        "Chief Agent mission-level orchestration.",

      version:
        "1.0",

      sourceLocation:
        "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

      lineage:
        [],

      dependencies:
        [],
    },
  };
}


test(
  "M51.5i3 accepts ratified Genesis Approved approval state",
  async () => {
    const validator =
      new DocumentationGovernanceValidator();

    const result =
      await validator.validate(
        itemWithApprovalState(
          "Approved",
        ),
      );

    assert.equal(
      result.status,
      "approved",
    );

    assert.deepEqual(
      (
        result.metadata.validation as {
          result:
            string;

          issues:
            unknown[];
        }
      ).issues,
      [],
    );
  },
);


test(
  "M51.5i3 preserves lowercase approved compatibility",
  async () => {
    const validator =
      new DocumentationGovernanceValidator();

    const result =
      await validator.validate(
        itemWithApprovalState(
          "approved",
        ),
      );

    assert.equal(
      result.status,
      "approved",
    );
  },
);


test(
  "M51.5i3 remains fail-closed for non-approved states",
  async () => {
    const validator =
      new DocumentationGovernanceValidator();

    for (
      const approvalState
      of [
        "Pending",
        "pending_review",
        "Rejected",
        "",
      ]
    ) {
      const result =
        await validator.validate(
          itemWithApprovalState(
            approvalState,
          ),
        );

      assert.equal(
        result.status,
        "needs-review",
        approvalState,
      );

      const validation =
        result.metadata.validation as {
          issues:
            Array<{
              code:
                string;
            }>;
        };

      assert.ok(
        validation.issues.some(
          issue =>
            issue.code ===
            "documentation_source_not_approved" ||
            issue.code ===
            "documentation_approval_state_required",
        ),
        approvalState,
      );
    }
  },
);
