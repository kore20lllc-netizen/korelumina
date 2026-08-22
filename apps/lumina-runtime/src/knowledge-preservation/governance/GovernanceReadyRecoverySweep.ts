import type {
  KnowledgePackage,
} from "../package/index.js";

import {
  KnowledgePackageService,
} from "../package/index.js";

import type {
  KnowledgeManufacturingRun,
} from "../manufacturing/index.js";

import {
  KnowledgeManufacturingRunService,
} from "../manufacturing/index.js";

import type {
  GovernanceReadyConsumptionResult,
} from "./GovernanceReadyRuntimeConsumer.js";

import {
  GovernanceReadyRuntimeConsumer,
} from "./GovernanceReadyRuntimeConsumer.js";

import type {
  GovernanceReadySignal,
} from "./GovernanceReadySignal.js";

export interface GovernanceReadyRecoveryPackageReader {
  list():
    KnowledgePackage[];
}

export interface GovernanceReadyRecoveryRunReader {
  findByPackageId(
    packageId:
      string,
  ):
    KnowledgeManufacturingRun |
    undefined;
}

export interface GovernanceReadyRecoveryConsumer {
  consume(
    signal:
      GovernanceReadySignal,
  ):
    GovernanceReadyConsumptionResult;
}

export interface GovernanceReadyRecoveryPackageResult {
  packageId:
    string;

  packageVersion:
    string | null;

  manufacturingRunId?:
    string;

  disposition:
    "recovered" |
    "ignored" |
    "exception";

  consumptionDisposition?:
    GovernanceReadyConsumptionResult[
      "disposition"
    ];

  reason?:
    string;
}

export interface GovernanceReadyRecoverySweepResult {
  executedAt:
    number;

  scanned:
    number;

  recoverable:
    number;

  recovered:
    number;

  ignored:
    number;

  exceptions:
    number;

  packages:
    GovernanceReadyRecoveryPackageResult[];
}

function isPotentiallyStranded(
  knowledgePackage:
    KnowledgePackage,
): boolean {
  return (
    knowledgePackage.state ===
      "awaiting_review" &&
    knowledgePackage
      .approvalState ===
      "pending_review"
  );
}

function isParkedAtGovernanceBoundary(
  run:
    KnowledgeManufacturingRun,
): boolean {
  if (
    run.status !==
      "active" ||
    run.currentStage !==
      "Canonical Review"
  ) {
    return false;
  }

  return run.stageHistory.some(
    (event) =>
      event.stage ===
        "Canonical Review" &&
      event.outcome ===
        "awaiting_human_review",
  );
}

export class GovernanceReadyRecoverySweep {
  constructor(
    private readonly packageReader:
      GovernanceReadyRecoveryPackageReader =
        new KnowledgePackageService(),

    private readonly runReader:
      GovernanceReadyRecoveryRunReader =
        new KnowledgeManufacturingRunService(),

    private readonly consumer:
      GovernanceReadyRecoveryConsumer =
        new GovernanceReadyRuntimeConsumer(),

    private readonly now:
      () => number =
        () => Date.now(),
  ) {}

  execute():
    GovernanceReadyRecoverySweepResult {
    const executedAt =
      this.now();

    const candidates =
      this.packageReader
        .list()
        .filter(
          isPotentiallyStranded,
        )
        .sort(
          (
            left,
            right,
          ) =>
            left.id.localeCompare(
              right.id,
            ),
        );

    const results:
      GovernanceReadyRecoveryPackageResult[] =
        [];

    let recoverable =
      0;

    for (
      const knowledgePackage
      of candidates
    ) {
      const base = {
        packageId:
          knowledgePackage.id,

        packageVersion:
          knowledgePackage.version,
      };

      if (
        !knowledgePackage.version ||
        !knowledgePackage.version.trim()
      ) {
        results.push({
          ...base,

          disposition:
            "exception",

          reason:
            "governance_recovery_package_version_missing",
        });

        continue;
      }

      const run =
        this.runReader
          .findByPackageId(
            knowledgePackage.id,
          );

      if (!run) {
        results.push({
          ...base,

          disposition:
            "exception",

          reason:
            "governance_recovery_manufacturing_run_not_found",
        });

        continue;
      }

      if (
        run.packageId !==
          knowledgePackage.id
      ) {
        results.push({
          ...base,

          manufacturingRunId:
            run.id,

          disposition:
            "exception",

          reason:
            "governance_recovery_manufacturing_package_mismatch",
        });

        continue;
      }

      if (
        !isParkedAtGovernanceBoundary(
          run,
        )
      ) {
        results.push({
          ...base,

          manufacturingRunId:
            run.id,

          disposition:
            "ignored",

          reason:
            "governance_recovery_run_not_parked_at_canonical_review",
        });

        continue;
      }

      recoverable +=
        1;

      const signal:
        GovernanceReadySignal = {
        packageId:
          knowledgePackage.id,

        packageVersion:
          knowledgePackage.version,

        manufacturingRunId:
          run.id,

        evidenceId:
          run.evidenceId,

        /*
         * Recovery execution time intentionally replaces the
         * lost original emission time. Durable package/run
         * identity is preserved; no synthetic claim is made
         * about when the missing event originally fired.
         */
        emittedAt:
          executedAt,
      };

      try {
        const consumption =
          this.consumer
            .consume(
              signal,
            );

        if (
          consumption.disposition ===
            "executed"
        ) {
          results.push({
            ...base,

            manufacturingRunId:
              run.id,

            disposition:
              "recovered",

            consumptionDisposition:
              consumption.disposition,
          });

          continue;
        }

        if (
          consumption.disposition ===
            "exception"
        ) {
          results.push({
            ...base,

            manufacturingRunId:
              run.id,

            disposition:
              "exception",

            consumptionDisposition:
              consumption.disposition,

            reason:
              consumption.reason,
          });

          continue;
        }

        results.push({
          ...base,

          manufacturingRunId:
            run.id,

          disposition:
            "ignored",

          consumptionDisposition:
            consumption.disposition,

          reason:
            consumption.reason,
        });
      } catch (
        error
      ) {
        results.push({
          ...base,

          manufacturingRunId:
            run.id,

          disposition:
            "exception",

          reason:
            error instanceof
              Error
              ? error.message
              : String(
                  error,
                ),
        });
      }
    }

    return {
      executedAt,

      scanned:
        candidates.length,

      recoverable,

      recovered:
        results.filter(
          (result) =>
            result.disposition ===
              "recovered",
        ).length,

      ignored:
        results.filter(
          (result) =>
            result.disposition ===
              "ignored",
        ).length,

      exceptions:
        results.filter(
          (result) =>
            result.disposition ===
              "exception",
        ).length,

      packages:
        results,
    };
  }
}
