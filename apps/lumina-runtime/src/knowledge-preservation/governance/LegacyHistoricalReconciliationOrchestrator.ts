import type {
  LegacyHistoricalReconciliationResult,
  VerifiedGenesisHistoricalCorrelationProof,
} from "./LegacyHistoricalReconciliationService.js";

import {
  LegacyHistoricalReconciliationService,
} from "./LegacyHistoricalReconciliationService.js";

import {
  VerifiedGenesisHistoricalCorrelationResolver,
} from "./VerifiedGenesisHistoricalCorrelationResolver.js";


export interface LegacyHistoricalReconciliationResolverPort {
  resolveForPackage(
    packageId:
      string,
  ):
    VerifiedGenesisHistoricalCorrelationProof;
}

export interface LegacyHistoricalReconciliationTransitionPort {
  reconcileVerifiedHistoricalCorrelation(
    input: {
      packageId:
        string;

      reconciledBy:
        string;

      proof:
        VerifiedGenesisHistoricalCorrelationProof;

      reconciledAt?:
        number;
    },
  ):
    LegacyHistoricalReconciliationResult;
}

export interface LegacyHistoricalReconciliationOrchestratorInput {
  packageId:
    string;

  actorId:
    string;

  executedAt?:
    number;
}

export interface LegacyHistoricalReconciliationOrchestratorPackageResult {
  packageId:
    string;

  disposition:
    | "reconciled"
    | "already_reconciled"
    | "exception";

  replayId?:
    string;

  evidenceId?:
    string;

  historicalSourceId?:
    string;

  sourceReferenceId?:
    string;

  sourceRevisionId?:
    string;

  eventId?:
    string;

  sourceChecksum?:
    string;

  reason?:
    string;
}

export interface LegacyHistoricalReconciliationBatchInput {
  packageIds:
    readonly string[];

  actorId:
    string;

  executedAt?:
    number;
}

export interface LegacyHistoricalReconciliationBatchResult {
  actorId:
    string;

  executedAt:
    number;

  requested:
    number;

  reconciled:
    number;

  alreadyReconciled:
    number;

  exceptions:
    number;

  packages:
    LegacyHistoricalReconciliationOrchestratorPackageResult[];
}


function required(
  value:
    string,

  field:
    string,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `legacy_historical_reconciliation_orchestrator_${field}_required`,
    );
  }

  return normalized;
}

function normalizePackageIds(
  packageIds:
    readonly string[],
): string[] {
  const normalized =
    packageIds.map(
      (
        packageId,
      ) =>
        required(
          packageId,
          "package_id",
        ),
    );

  const unique =
    [
      ...new Set(
        normalized,
      ),
    ];

  if (
    unique.length !==
      normalized.length
  ) {
    throw new Error(
      "legacy_historical_reconciliation_orchestrator_duplicate_package_id",
    );
  }

  return unique.sort(
    (
      left,
      right,
    ) =>
      left.localeCompare(
        right,
      ),
  );
}


export class LegacyHistoricalReconciliationOrchestrator {
  constructor(
    private readonly resolver:
      LegacyHistoricalReconciliationResolverPort =
        new VerifiedGenesisHistoricalCorrelationResolver(),

    private readonly transition:
      LegacyHistoricalReconciliationTransitionPort =
        new LegacyHistoricalReconciliationService(),

    private readonly now:
      () => number =
        () => Date.now(),
  ) {}

  executeOne(
    input:
      LegacyHistoricalReconciliationOrchestratorInput,
  ):
    LegacyHistoricalReconciliationOrchestratorPackageResult {
    const packageId =
      required(
        input.packageId,
        "package_id",
      );

    const actorId =
      required(
        input.actorId,
        "actor_id",
      );

    const executedAt =
      input.executedAt ??
      this.now();

    try {
      const proof =
        this.resolver
          .resolveForPackage(
            packageId,
          );

      const result =
        this.transition
          .reconcileVerifiedHistoricalCorrelation({
            packageId,

            reconciledBy:
              actorId,

            proof,

            reconciledAt:
              executedAt,
          });

      return {
        packageId,

        disposition:
          result.disposition,

        replayId:
          proof.replayId,

        evidenceId:
          proof.evidenceId,

        historicalSourceId:
          proof.historicalSourceId,

        sourceReferenceId:
          proof.sourceReferenceId,

        sourceRevisionId:
          proof.sourceRevisionId,

        eventId:
          proof.eventId,

        sourceChecksum:
          proof.sourceChecksum,
      };
    } catch (
      error
    ) {
      return {
        packageId,

        disposition:
          "exception",

        reason:
          error instanceof
            Error
            ? error.message
            : String(
                error,
              ),
      };
    }
  }

  executeBatch(
    input:
      LegacyHistoricalReconciliationBatchInput,
  ):
    LegacyHistoricalReconciliationBatchResult {
    const actorId =
      required(
        input.actorId,
        "actor_id",
      );

    const packageIds =
      normalizePackageIds(
        input.packageIds,
      );

    const executedAt =
      input.executedAt ??
      this.now();

    const packages =
      packageIds.map(
        (
          packageId,
        ) =>
          this.executeOne({
            packageId,

            actorId,

            executedAt,
          }),
      );

    return {
      actorId,

      executedAt,

      requested:
        packageIds.length,

      reconciled:
        packages.filter(
          (
            result,
          ) =>
            result.disposition ===
              "reconciled",
        ).length,

      alreadyReconciled:
        packages.filter(
          (
            result,
          ) =>
            result.disposition ===
              "already_reconciled",
        ).length,

      exceptions:
        packages.filter(
          (
            result,
          ) =>
            result.disposition ===
              "exception",
        ).length,

      packages,
    };
  }
}
