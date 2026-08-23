import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import {
  KnowledgePackageService,
  loadKnowledgePackage,
  removeKnowledgePackageForTest,
  saveKnowledgePackage,
} from "../../package/index.js";

import {
  GovernanceExceptionClassificationService,
  hasDurableIncompleteGovernanceIdentityException,
} from "../GovernanceExceptionClassificationService.js";

function packageRecord(
  id:
    string,

  overrides:
    Partial<KnowledgePackage> =
      {},
):
  KnowledgePackage {
  return {
    id,

    state:
      "awaiting_review",

    sourceEvidenceRefs: [
      `evidence:${id}`,
    ],

    knowledgeItemIds: [
      `item:${id}`,
    ],

    items:
      [],

    provenance: {
      evidenceIds: [
        `evidence:${id}`,
      ],

      sourceLocations:
        [],

      contentRefs:
        [],

      sources: [
        "legacy",
      ],
    },

    authority:
      null,

    approvalState:
      "pending_review",

    owner:
      null,

    scope:
      null,

    version:
      null,

    confidence:
      1,

    dependencies:
      [],

    lineage:
      [],

    supersession: {
      supersedes:
        [],

      supersededBy:
        [],
    },

    destination:
      null,

    validationResults:
      [],

    compilerHistory:
      [],

    lifecycleHistory: [
      {
        state:
          "awaiting_review",

        at:
          1000,
      },
    ],

    remediation: {
      required:
        false,

      status:
        "not_required",

      blockedItemIds:
        [],

      updatedAt:
        1000,
    },

    createdAt:
      1000,

    updatedAt:
      1000,

    metadata:
      {},

    ...overrides,
  };
}

function service() {
  return new GovernanceExceptionClassificationService(
    new KnowledgePackageService(),
    () => 5000,
  );
}

test(
  "classifies incomplete legacy governance identity without changing lifecycle or inventing identity",
  () => {
    const id =
      `TEST-GOVERNANCE-EXCEPTION-${Date.now()}-${process.pid}`;

    try {
      saveKnowledgePackage(
        packageRecord(
          id,
        ),
      );

      const result =
        service()
          .classifyIncompleteGovernanceIdentity({
            packageId:
              id,

            recordedBy:
              "human:founder",
          });

      assert.equal(
        result.disposition,
        "classified",
      );

      assert.equal(
        result.knowledgePackage.state,
        "awaiting_review",
      );

      assert.equal(
        result.knowledgePackage.approvalState,
        "pending_review",
      );

      assert.equal(
        result.knowledgePackage.authority,
        null,
      );

      assert.equal(
        result.knowledgePackage.scope,
        null,
      );

      assert.equal(
        result.knowledgePackage.owner,
        null,
      );

      assert.equal(
        result.knowledgePackage.version,
        null,
      );

      assert.deepEqual(
        result.governanceException,
        {
          type:
            "incomplete_governance_identity",

          disposition:
            "manual_reclassification_required",

          source:
            "legacy_governance_identity_audit",

          recordedAt:
            5000,

          recordedBy:
            "human:founder",
        },
      );

      const persisted =
        loadKnowledgePackage(
          id,
        );

      assert.ok(
        persisted,
      );

      assert.equal(
        hasDurableIncompleteGovernanceIdentityException(
          persisted,
        ),
        true,
      );

      assert.equal(
        persisted.metadata
          .canonicalReviewPolicy,
        undefined,
      );

      assert.equal(
        persisted.metadata
          .review,
        undefined,
      );

      assert.equal(
        persisted.metadata
          .canonicalization,
        undefined,
      );
    } finally {
      removeKnowledgePackageForTest(
        id,
      );
    }
  },
);

test(
  "classification is idempotent and preserves original exception proof",
  () => {
    const id =
      `TEST-GOVERNANCE-EXCEPTION-IDEMPOTENT-${Date.now()}-${process.pid}`;

    try {
      saveKnowledgePackage(
        packageRecord(
          id,
        ),
      );

      const classifier =
        service();

      const first =
        classifier
          .classifyIncompleteGovernanceIdentity({
            packageId:
              id,

            recordedBy:
              "human:founder",

            recordedAt:
              4000,
          });

      const second =
        classifier
          .classifyIncompleteGovernanceIdentity({
            packageId:
              id,

            recordedBy:
              "runtime:recovery",

            recordedAt:
              9000,
          });

      assert.equal(
        first.disposition,
        "classified",
      );

      assert.equal(
        second.disposition,
        "already_classified",
      );

      assert.deepEqual(
        second.governanceException,
        first.governanceException,
      );

      assert.equal(
        second.knowledgePackage.updatedAt,
        first.knowledgePackage.updatedAt,
      );
    } finally {
      removeKnowledgePackageForTest(
        id,
      );
    }
  },
);

test(
  "complete governance identity cannot be quarantined as incomplete",
  () => {
    const id =
      `TEST-GOVERNANCE-EXCEPTION-COMPLETE-${Date.now()}-${process.pid}`;

    try {
      saveKnowledgePackage(
        packageRecord(
          id,
          {
            authority:
              "architecture",

            scope:
              "platform",

            owner:
              "Knowledge Governance",

            version:
              "1.0.0",
          },
        ),
      );

      assert.throws(
        () =>
          service()
            .classifyIncompleteGovernanceIdentity({
              packageId:
                id,

              recordedBy:
                "human:founder",
            }),
        /governance_exception_identity_not_incomplete/,
      );
    } finally {
      removeKnowledgePackageForTest(
        id,
      );
    }
  },
);

test(
  "package outside awaiting review cannot be classified",
  () => {
    const id =
      `TEST-GOVERNANCE-EXCEPTION-STATE-${Date.now()}-${process.pid}`;

    try {
      saveKnowledgePackage(
        packageRecord(
          id,
          {
            state:
              "canonical",

            approvalState:
              "approved",
          },
        ),
      );

      assert.throws(
        () =>
          service()
            .classifyIncompleteGovernanceIdentity({
              packageId:
                id,

              recordedBy:
                "human:founder",
            }),
        /governance_exception_package_not_awaiting_review/,
      );
    } finally {
      removeKnowledgePackageForTest(
        id,
      );
    }
  },
);
