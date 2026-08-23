import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import {
  LegacyHistoricalReconciliationService,
} from "../LegacyHistoricalReconciliationService.js";


function legacyPackage():
  KnowledgePackage {
  return {
    id:
      "KP-2026-000009",

    state:
      "awaiting_review",

    sourceEvidenceRefs: [
      "genesis-evidence:aaaaaaaa",
    ],

    knowledgeItemIds: [
      "candidate:legacy",
    ],

    items:
      [],

    provenance: {
      evidenceIds: [
        "genesis-evidence:aaaaaaaa",
      ],

      sourceLocations:
        [],

      contentRefs:
        [],

      sources: [
        "genesis-historical-replay",
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
          1,
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
        1,
    },

    createdAt:
      1,

    updatedAt:
      1,

    metadata: {
      governanceException: {
        type:
          "incomplete_governance_identity",

        disposition:
          "manual_reclassification_required",

        source:
          "legacy_governance_identity_audit",

        recordedAt:
          2,

        recordedBy:
          "human:founder",
      },
    },
  };
}

function proof() {
  return {
    replayId:
      "genesis-replay:aaaaaaaa",

    evidenceId:
      "genesis-evidence:aaaaaaaa",

    historicalSourceId:
      "genesis-source:commit:aaaaaaaa",

    sourceReferenceId:
      "genesis-source-ref:aaaaaaaa",

    sourceRevisionId:
      "genesis-source-revision:aaaaaaaa",

    eventId:
      "genesis-event:aaaaaaaa",

    eventKind:
      "implementation-committed" as const,

    sourceChecksum:
      "sha256:aaaaaaaa",
  };
}

function harness(
  initial:
    KnowledgePackage =
      legacyPackage(),
) {
  let current =
    initial;

  const writes:
    KnowledgePackage[] = [];

  const packageService =
    {
      registry: {
        register(
          value:
            KnowledgePackage,
        ) {
          current =
            value;
        },
      },

      get(
        id:
          string,
      ) {
        return id ===
          current.id
          ? current
          : undefined;
      },
    };

  const service =
    new LegacyHistoricalReconciliationService(
      packageService as never,
      (
        value,
      ) => {
        current =
          value;

        writes.push(
          value,
        );
      },
      () => 100,
    );

  return {
    service,
    writes,
    current:
      () => current,
  };
}

test(
  "verified historical correlation archives legacy package without manufacturing governance identity",
  () => {
    const {
      service,
      writes,
    } =
      harness();

    const result =
      service
        .reconcileVerifiedHistoricalCorrelation({
          packageId:
            "KP-2026-000009",

          reconciledBy:
            "human:founder",

          proof:
            proof(),
        });

    assert.equal(
      result.disposition,
      "reconciled",
    );

    assert.equal(
      result
        .knowledgePackage
        .state,
      "archived",
    );

    assert.equal(
      result
        .knowledgePackage
        .authority,
      null,
    );

    assert.equal(
      result
        .knowledgePackage
        .owner,
      null,
    );

    assert.equal(
      result
        .knowledgePackage
        .scope,
      null,
    );

    assert.equal(
      result
        .knowledgePackage
        .version,
      null,
    );

    assert.deepEqual(
      result
        .knowledgePackage
        .supersession,
      {
        supersedes:
          [],

        supersededBy:
          [],
      },
    );

    assert.equal(
      writes.length,
      1,
    );

    assert.equal(
      result
        .knowledgePackage
        .lifecycleHistory
        .at(-1)
        ?.reason,
      "legacy_package_reconciled_to_genesis_historical_correlation",
    );
  },
);

test(
  "reconciliation preserves durable governance exception",
  () => {
    const {
      service,
    } =
      harness();

    const result =
      service
        .reconcileVerifiedHistoricalCorrelation({
          packageId:
            "KP-2026-000009",

          reconciledBy:
            "human:founder",

          proof:
            proof(),
        });

    assert.deepEqual(
      result
        .knowledgePackage
        .metadata
        .governanceException,
      legacyPackage()
        .metadata
        .governanceException,
    );
  },
);

test(
  "same verified proof is idempotent",
  () => {
    const {
      service,
      writes,
    } =
      harness();

    service
      .reconcileVerifiedHistoricalCorrelation({
        packageId:
          "KP-2026-000009",

        reconciledBy:
          "human:founder",

        proof:
          proof(),
      });

    const second =
      service
        .reconcileVerifiedHistoricalCorrelation({
          packageId:
            "KP-2026-000009",

          reconciledBy:
            "human:founder",

          proof:
            proof(),
        });

    assert.equal(
      second.disposition,
      "already_reconciled",
    );

    assert.equal(
      writes.length,
      1,
    );
  },
);

test(
  "different proof after reconciliation fails closed",
  () => {
    const {
      service,
    } =
      harness();

    service
      .reconcileVerifiedHistoricalCorrelation({
        packageId:
          "KP-2026-000009",

        reconciledBy:
          "human:founder",

        proof:
          proof(),
      });

    assert.throws(
      () =>
        service
          .reconcileVerifiedHistoricalCorrelation({
            packageId:
              "KP-2026-000009",

            reconciledBy:
              "human:founder",

            proof: {
              ...proof(),

              eventId:
                "genesis-event:bbbbbbbb",
            },
          }),
      /legacy_historical_reconciliation_conflict/,
    );
  },
);

test(
  "package without durable governance exception fails closed",
  () => {
    const candidate =
      legacyPackage();

    candidate.metadata =
      {};

    const {
      service,
    } =
      harness(
        candidate,
      );

    assert.throws(
      () =>
        service
          .reconcileVerifiedHistoricalCorrelation({
            packageId:
              candidate.id,

            reconciledBy:
              "human:founder",

            proof:
              proof(),
          }),
      /legacy_historical_reconciliation_governance_exception_required/,
    );
  },
);

test(
  "evidence mismatch fails closed",
  () => {
    const {
      service,
    } =
      harness();

    assert.throws(
      () =>
        service
          .reconcileVerifiedHistoricalCorrelation({
            packageId:
              "KP-2026-000009",

            reconciledBy:
              "human:founder",

            proof: {
              ...proof(),

              evidenceId:
                "genesis-evidence:bbbbbbbb",
            },
          }),
      /legacy_historical_reconciliation_evidence_mismatch/,
    );
  },
);
