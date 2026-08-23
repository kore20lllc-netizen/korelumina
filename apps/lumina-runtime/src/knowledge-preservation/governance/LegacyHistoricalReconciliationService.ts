import type {
  KnowledgePackage,
} from "../package/index.js";

import {
  KnowledgePackageService,
  saveKnowledgePackage,
} from "../package/index.js";

import {
  hasDurableIncompleteGovernanceIdentityException,
} from "./GovernanceExceptionClassificationService.js";


export const LEGACY_HISTORICAL_RECONCILIATION_DISPOSITION =
  "represented_as_genesis_historical_correlation" as const;

export interface VerifiedGenesisHistoricalCorrelationProof {
  replayId:
    string;

  evidenceId:
    string;

  historicalSourceId:
    string;

  sourceReferenceId:
    string;

  sourceRevisionId:
    string;

  eventId:
    string;

  eventKind:
    "implementation-committed";

  sourceChecksum:
    string;
}

export interface LegacyHistoricalReconciliationInput {
  packageId:
    string;

  reconciledBy:
    string;

  proof:
    VerifiedGenesisHistoricalCorrelationProof;

  reconciledAt?:
    number;
}

export interface LegacyHistoricalReconciliationRecord {
  disposition:
    typeof LEGACY_HISTORICAL_RECONCILIATION_DISPOSITION;

  replayId:
    string;

  evidenceId:
    string;

  historicalSourceId:
    string;

  sourceReferenceId:
    string;

  sourceRevisionId:
    string;

  eventId:
    string;

  eventKind:
    "implementation-committed";

  sourceChecksum:
    string;

  reconciledAt:
    number;

  reconciledBy:
    string;
}

export interface LegacyHistoricalReconciliationResult {
  packageId:
    string;

  disposition:
    | "reconciled"
    | "already_reconciled";

  reconciliation:
    LegacyHistoricalReconciliationRecord;

  knowledgePackage:
    KnowledgePackage;
}

export type LegacyHistoricalReconciliationWriter =
  (
    knowledgePackage:
      KnowledgePackage,
  ) => void;


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
      `legacy_historical_reconciliation_${field}_required`,
    );
  }

  return normalized;
}

function requirePrefix(
  value:
    string,

  prefix:
    string,

  field:
    string,
): string {
  const normalized =
    required(
      value,
      field,
    );

  if (
    !normalized.startsWith(
      prefix,
    )
  ) {
    throw new Error(
      `legacy_historical_reconciliation_${field}_invalid`,
    );
  }

  return normalized;
}

function readExisting(
  knowledgePackage:
    KnowledgePackage,
): LegacyHistoricalReconciliationRecord |
  null {
  const raw =
    knowledgePackage
      .metadata
      .historicalReconciliation;

  if (
    typeof raw !==
      "object" ||
    raw === null
  ) {
    return null;
  }

  const record =
    raw as Record<
      string,
      unknown
    >;

  if (
    record.disposition !==
      LEGACY_HISTORICAL_RECONCILIATION_DISPOSITION ||
    typeof record.replayId !==
      "string" ||
    typeof record.evidenceId !==
      "string" ||
    typeof record.historicalSourceId !==
      "string" ||
    typeof record.sourceReferenceId !==
      "string" ||
    typeof record.sourceRevisionId !==
      "string" ||
    typeof record.eventId !==
      "string" ||
    record.eventKind !==
      "implementation-committed" ||
    typeof record.sourceChecksum !==
      "string" ||
    typeof record.reconciledAt !==
      "number" ||
    typeof record.reconciledBy !==
      "string"
  ) {
    return null;
  }

  return {
    disposition:
      LEGACY_HISTORICAL_RECONCILIATION_DISPOSITION,

    replayId:
      record.replayId,

    evidenceId:
      record.evidenceId,

    historicalSourceId:
      record.historicalSourceId,

    sourceReferenceId:
      record.sourceReferenceId,

    sourceRevisionId:
      record.sourceRevisionId,

    eventId:
      record.eventId,

    eventKind:
      "implementation-committed",

    sourceChecksum:
      record.sourceChecksum,

    reconciledAt:
      record.reconciledAt,

    reconciledBy:
      record.reconciledBy,
  };
}

function sameProof(
  existing:
    LegacyHistoricalReconciliationRecord,

  proof:
    VerifiedGenesisHistoricalCorrelationProof,
): boolean {
  return (
    existing.replayId ===
      proof.replayId &&
    existing.evidenceId ===
      proof.evidenceId &&
    existing.historicalSourceId ===
      proof.historicalSourceId &&
    existing.sourceReferenceId ===
      proof.sourceReferenceId &&
    existing.sourceRevisionId ===
      proof.sourceRevisionId &&
    existing.eventId ===
      proof.eventId &&
    existing.eventKind ===
      proof.eventKind &&
    existing.sourceChecksum ===
      proof.sourceChecksum
  );
}

export class LegacyHistoricalReconciliationService {
  constructor(
    private readonly packageService:
      KnowledgePackageService =
        new KnowledgePackageService(),

    private readonly writer:
      LegacyHistoricalReconciliationWriter =
        saveKnowledgePackage,

    private readonly now:
      () => number =
        () => Date.now(),
  ) {}

  reconcileVerifiedHistoricalCorrelation(
    input:
      LegacyHistoricalReconciliationInput,
  ):
    LegacyHistoricalReconciliationResult {
    const packageId =
      required(
        input.packageId,
        "package_id",
      );

    const reconciledBy =
      required(
        input.reconciledBy,
        "reconciled_by",
      );

    const proof:
      VerifiedGenesisHistoricalCorrelationProof = {
      replayId:
        requirePrefix(
          input.proof.replayId,
          "genesis-replay:",
          "replay_id",
        ),

      evidenceId:
        requirePrefix(
          input.proof.evidenceId,
          "genesis-evidence:",
          "evidence_id",
        ),

      historicalSourceId:
        requirePrefix(
          input.proof.historicalSourceId,
          "genesis-source:commit:",
          "historical_source_id",
        ),

      sourceReferenceId:
        requirePrefix(
          input.proof.sourceReferenceId,
          "genesis-source-ref:",
          "source_reference_id",
        ),

      sourceRevisionId:
        requirePrefix(
          input.proof.sourceRevisionId,
          "genesis-source-revision:",
          "source_revision_id",
        ),

      eventId:
        requirePrefix(
          input.proof.eventId,
          "genesis-event:",
          "event_id",
        ),

      eventKind:
        input.proof.eventKind,

      sourceChecksum:
        requirePrefix(
          input.proof.sourceChecksum,
          "sha256:",
          "source_checksum",
        ),
    };

    if (
      proof.eventKind !==
        "implementation-committed"
    ) {
      throw new Error(
        "legacy_historical_reconciliation_event_kind_invalid",
      );
    }

    const knowledgePackage =
      this.packageService
        .get(
          packageId,
        );

    if (
      !knowledgePackage
    ) {
      throw new Error(
        "legacy_historical_reconciliation_package_not_found",
      );
    }

    const existing =
      readExisting(
        knowledgePackage,
      );

    if (
      existing
    ) {
      if (
        !sameProof(
          existing,
          proof,
        )
      ) {
        throw new Error(
          "legacy_historical_reconciliation_conflict",
        );
      }

      return {
        packageId,

        disposition:
          "already_reconciled",

        reconciliation:
          existing,

        knowledgePackage,
      };
    }

    if (
      !hasDurableIncompleteGovernanceIdentityException(
        knowledgePackage,
      )
    ) {
      throw new Error(
        "legacy_historical_reconciliation_governance_exception_required",
      );
    }

    if (
      knowledgePackage.state !==
        "awaiting_review" ||
      knowledgePackage
        .approvalState !==
        "pending_review"
    ) {
      throw new Error(
        "legacy_historical_reconciliation_package_not_quarantined",
      );
    }

    if (
      knowledgePackage
        .sourceEvidenceRefs
        .length !==
        1 ||
      knowledgePackage
        .sourceEvidenceRefs[0] !==
        proof.evidenceId
    ) {
      throw new Error(
        "legacy_historical_reconciliation_evidence_mismatch",
      );
    }

    /*
     * This transition does not manufacture governance identity.
     *
     * The package is retained as historical evidence that an
     * obsolete manufacturing path overproduced a Knowledge
     * Package from commit-history Evidence. The authoritative
     * modern representation is the verified Genesis historical
     * correlation object supplied by the resolver/orchestrator.
     *
     * There is no replacement Knowledge Package, so the package
     * is archived rather than superseded.
     */
    const reconciledAt =
      input.reconciledAt ??
      this.now();

    const reconciliation:
      LegacyHistoricalReconciliationRecord = {
      disposition:
        LEGACY_HISTORICAL_RECONCILIATION_DISPOSITION,

      ...proof,

      reconciledAt,

      reconciledBy,
    };

    const updated:
      KnowledgePackage = {
      ...knowledgePackage,

      state:
        "archived",

      updatedAt:
        Math.max(
          knowledgePackage.updatedAt,
          reconciledAt,
        ),

      lifecycleHistory: [
        ...knowledgePackage
          .lifecycleHistory,
        {
          state:
            "archived",

          at:
            reconciledAt,

          reason:
            "legacy_package_reconciled_to_genesis_historical_correlation",
        },
      ],

      metadata: {
        ...knowledgePackage.metadata,

        historicalReconciliation:
          reconciliation,
      },
    };

    this.packageService
      .registry
      .register(
        updated,
      );

    this.writer(
      updated,
    );

    return {
      packageId,

      disposition:
        "reconciled",

      reconciliation,

      knowledgePackage:
        updated,
    };
  }
}
