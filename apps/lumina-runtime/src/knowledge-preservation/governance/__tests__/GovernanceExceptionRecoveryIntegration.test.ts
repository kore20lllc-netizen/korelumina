import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import {
  GovernanceReadyRecoverySweep,
} from "../GovernanceReadyRecoverySweep.js";

function quarantinedPackage():
  KnowledgePackage {
  return {
    id:
      "KP-LEGACY-QUARANTINED",

    state:
      "awaiting_review",

    sourceEvidenceRefs:
      [],

    knowledgeItemIds:
      [],

    items:
      [],

    provenance: {
      evidenceIds:
        [],

      sourceLocations:
        [],

      contentRefs:
        [],

      sources:
        [],
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

    lifecycleHistory:
      [],

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
      2000,

    metadata: {
      governanceException: {
        type:
          "incomplete_governance_identity",

        disposition:
          "manual_reclassification_required",

        source:
          "legacy_governance_identity_audit",

        recordedAt:
          2000,

        recordedBy:
          "human:founder",
      },
    },
  };
}

test(
  "durably classified governance exception is ignored without run lookup or consumer retry",
  () => {
    let runReads =
      0;

    let consumerCalls =
      0;

    const result =
      new GovernanceReadyRecoverySweep(
        {
          list() {
            return [
              quarantinedPackage(),
            ];
          },
        },

        {
          findByPackageId() {
            runReads +=
              1;

            throw new Error(
              "must_not_read_run",
            );
          },
        },

        {
          consume() {
            consumerCalls +=
              1;

            throw new Error(
              "must_not_consume",
            );
          },
        },

        () => 5000,
      ).execute();

    assert.equal(
      result.scanned,
      1,
    );

    assert.equal(
      result.recoverable,
      0,
    );

    assert.equal(
      result.recovered,
      0,
    );

    assert.equal(
      result.ignored,
      1,
    );

    assert.equal(
      result.exceptions,
      0,
    );

    assert.equal(
      result.packages[0]
        ?.reason,
      "governance_recovery_durable_exception",
    );

    assert.equal(
      runReads,
      0,
    );

    assert.equal(
      consumerCalls,
      0,
    );
  },
);
