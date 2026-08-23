import assert from "node:assert/strict";
import test from "node:test";

import type {
  VerifiedGenesisHistoricalCorrelationProof,
} from "../LegacyHistoricalReconciliationService.js";

import {
  LegacyHistoricalReconciliationOrchestrator,
} from "../LegacyHistoricalReconciliationOrchestrator.js";


function proof(
  packageId:
    string,
):
  VerifiedGenesisHistoricalCorrelationProof {
  const suffix =
    packageId
      .replace(
        /[^0-9]/g,
        "",
      );

  return {
    replayId:
      `genesis-replay:${suffix}`,

    evidenceId:
      `genesis-evidence:${suffix}`,

    historicalSourceId:
      `genesis-source:commit:${suffix}`,

    sourceReferenceId:
      `genesis-source-ref:${suffix}`,

    sourceRevisionId:
      `genesis-source-revision:${suffix}`,

    eventId:
      `genesis-event:${suffix}`,

    eventKind:
      "implementation-committed",

    sourceChecksum:
      `sha256:${suffix}`,
  };
}


test(
  "single package resolves proof before transition",
  () => {
    const calls:
      string[] =
      [];

    const orchestrator =
      new LegacyHistoricalReconciliationOrchestrator(
        {
          resolveForPackage(
            packageId,
          ) {
            calls.push(
              `resolve:${packageId}`,
            );

            return proof(
              packageId,
            );
          },
        },
        {
          reconcileVerifiedHistoricalCorrelation(
            input,
          ) {
            calls.push(
              `transition:${input.packageId}`,
            );

            assert.equal(
              input.reconciledBy,
              "human:founder",
            );

            assert.equal(
              input.reconciledAt,
              100,
            );

            return {
              packageId:
                input.packageId,

              disposition:
                "reconciled",

              reconciliation:
                {} as never,

              knowledgePackage:
                {} as never,
            };
          },
        },
      );

    const result =
      orchestrator.executeOne({
        packageId:
          "KP-2026-000009",

        actorId:
          "human:founder",

        executedAt:
          100,
      });

    assert.equal(
      result.disposition,
      "reconciled",
    );

    assert.deepEqual(
      calls,
      [
        "resolve:KP-2026-000009",
        "transition:KP-2026-000009",
      ],
    );
  },
);


test(
  "resolver failure prevents transition",
  () => {
    let transitioned =
      false;

    const orchestrator =
      new LegacyHistoricalReconciliationOrchestrator(
        {
          resolveForPackage() {
            throw new Error(
              "proof_missing",
            );
          },
        },
        {
          reconcileVerifiedHistoricalCorrelation() {
            transitioned =
              true;

            throw new Error(
              "must_not_execute",
            );
          },
        },
      );

    const result =
      orchestrator.executeOne({
        packageId:
          "KP-2026-000009",

        actorId:
          "human:founder",
      });

    assert.equal(
      result.disposition,
      "exception",
    );

    assert.equal(
      result.reason,
      "proof_missing",
    );

    assert.equal(
      transitioned,
      false,
    );
  },
);


test(
  "transition failure is isolated",
  () => {
    const orchestrator =
      new LegacyHistoricalReconciliationOrchestrator(
        {
          resolveForPackage(
            packageId,
          ) {
            return proof(
              packageId,
            );
          },
        },
        {
          reconcileVerifiedHistoricalCorrelation() {
            throw new Error(
              "transition_failed",
            );
          },
        },
      );

    const result =
      orchestrator.executeOne({
        packageId:
          "KP-2026-000009",

        actorId:
          "human:founder",
      });

    assert.equal(
      result.disposition,
      "exception",
    );

    assert.equal(
      result.reason,
      "transition_failed",
    );
  },
);


test(
  "already reconciled remains idempotent",
  () => {
    const orchestrator =
      new LegacyHistoricalReconciliationOrchestrator(
        {
          resolveForPackage(
            packageId,
          ) {
            return proof(
              packageId,
            );
          },
        },
        {
          reconcileVerifiedHistoricalCorrelation(
            input,
          ) {
            return {
              packageId:
                input.packageId,

              disposition:
                "already_reconciled",

              reconciliation:
                {} as never,

              knowledgePackage:
                {} as never,
            };
          },
        },
      );

    const result =
      orchestrator.executeOne({
        packageId:
          "KP-2026-000009",

        actorId:
          "human:founder",
      });

    assert.equal(
      result.disposition,
      "already_reconciled",
    );
  },
);


test(
  "batch execution is deterministic and isolates failures",
  () => {
    const transitioned:
      string[] =
      [];

    const orchestrator =
      new LegacyHistoricalReconciliationOrchestrator(
        {
          resolveForPackage(
            packageId,
          ) {
            if (
              packageId ===
                "KP-2026-000010"
            ) {
              throw new Error(
                "proof_unavailable",
              );
            }

            return proof(
              packageId,
            );
          },
        },
        {
          reconcileVerifiedHistoricalCorrelation(
            input,
          ) {
            transitioned.push(
              input.packageId,
            );

            return {
              packageId:
                input.packageId,

              disposition:
                "reconciled",

              reconciliation:
                {} as never,

              knowledgePackage:
                {} as never,
            };
          },
        },
        () => 500,
      );

    const result =
      orchestrator.executeBatch({
        packageIds: [
          "KP-2026-000011",
          "KP-2026-000009",
          "KP-2026-000010",
        ],

        actorId:
          "human:founder",
      });

    assert.deepEqual(
      result.packages.map(
        item =>
          item.packageId,
      ),
      [
        "KP-2026-000009",
        "KP-2026-000010",
        "KP-2026-000011",
      ],
    );

    assert.equal(
      result.requested,
      3,
    );

    assert.equal(
      result.reconciled,
      2,
    );

    assert.equal(
      result.exceptions,
      1,
    );

    assert.deepEqual(
      transitioned,
      [
        "KP-2026-000009",
        "KP-2026-000011",
      ],
    );
  },
);


test(
  "batch counts idempotent results separately",
  () => {
    const orchestrator =
      new LegacyHistoricalReconciliationOrchestrator(
        {
          resolveForPackage(
            packageId,
          ) {
            return proof(
              packageId,
            );
          },
        },
        {
          reconcileVerifiedHistoricalCorrelation(
            input,
          ) {
            return {
              packageId:
                input.packageId,

              disposition:
                input.packageId ===
                  "KP-2026-000009"
                  ? "already_reconciled"
                  : "reconciled",

              reconciliation:
                {} as never,

              knowledgePackage:
                {} as never,
            };
          },
        },
      );

    const result =
      orchestrator.executeBatch({
        packageIds: [
          "KP-2026-000009",
          "KP-2026-000010",
        ],

        actorId:
          "human:founder",
      });

    assert.equal(
      result.reconciled,
      1,
    );

    assert.equal(
      result.alreadyReconciled,
      1,
    );

    assert.equal(
      result.exceptions,
      0,
    );
  },
);


test(
  "duplicate package IDs fail before execution",
  () => {
    let resolverCalls =
      0;

    const orchestrator =
      new LegacyHistoricalReconciliationOrchestrator(
        {
          resolveForPackage(
            packageId,
          ) {
            resolverCalls +=
              1;

            return proof(
              packageId,
            );
          },
        },
        {
          reconcileVerifiedHistoricalCorrelation() {
            throw new Error(
              "not_reached",
            );
          },
        },
      );

    assert.throws(
      () =>
        orchestrator.executeBatch({
          packageIds: [
            "KP-2026-000009",
            "KP-2026-000009",
          ],

          actorId:
            "human:founder",
        }),
      /duplicate_package_id/,
    );

    assert.equal(
      resolverCalls,
      0,
    );
  },
);
