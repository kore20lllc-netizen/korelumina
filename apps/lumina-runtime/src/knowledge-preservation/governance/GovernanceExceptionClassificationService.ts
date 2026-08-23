import type {
  KnowledgePackage,
} from "../package/index.js";

import {
  KnowledgePackageService,
  saveKnowledgePackage,
} from "../package/index.js";

export const GOVERNANCE_EXCEPTION_INCOMPLETE_IDENTITY =
  "incomplete_governance_identity" as const;

export const GOVERNANCE_EXCEPTION_MANUAL_RECLASSIFICATION =
  "manual_reclassification_required" as const;

export interface GovernanceExceptionRecord {
  type:
    typeof GOVERNANCE_EXCEPTION_INCOMPLETE_IDENTITY;

  disposition:
    typeof GOVERNANCE_EXCEPTION_MANUAL_RECLASSIFICATION;

  source:
    "legacy_governance_identity_audit";

  recordedAt:
    number;

  recordedBy:
    string;
}

export interface GovernanceExceptionClassificationInput {
  packageId:
    string;

  recordedBy:
    string;

  recordedAt?:
    number;
}

export interface GovernanceExceptionClassificationResult {
  packageId:
    string;

  disposition:
    "classified" |
    "already_classified";

  governanceException:
    GovernanceExceptionRecord;

  knowledgePackage:
    KnowledgePackage;
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
      `governance_exception_${field}_required`,
    );
  }

  return normalized;
}

function governanceExceptionRecord(
  knowledgePackage:
    KnowledgePackage,
): GovernanceExceptionRecord | null {
  const raw =
    knowledgePackage
      .metadata
      .governanceException;

  if (
    typeof raw !==
      "object" ||
    raw ===
      null
  ) {
    return null;
  }

  const record =
    raw as Record<
      string,
      unknown
    >;

  if (
    record.type !==
      GOVERNANCE_EXCEPTION_INCOMPLETE_IDENTITY ||
    record.disposition !==
      GOVERNANCE_EXCEPTION_MANUAL_RECLASSIFICATION ||
    record.source !==
      "legacy_governance_identity_audit" ||
    typeof record.recordedAt !==
      "number" ||
    typeof record.recordedBy !==
      "string" ||
    !record.recordedBy.trim()
  ) {
    return null;
  }

  return {
    type:
      GOVERNANCE_EXCEPTION_INCOMPLETE_IDENTITY,

    disposition:
      GOVERNANCE_EXCEPTION_MANUAL_RECLASSIFICATION,

    source:
      "legacy_governance_identity_audit",

    recordedAt:
      record.recordedAt,

    recordedBy:
      record.recordedBy,
  };
}

export function hasDurableIncompleteGovernanceIdentityException(
  knowledgePackage:
    KnowledgePackage,
): boolean {
  return (
    governanceExceptionRecord(
      knowledgePackage,
    ) !==
    null
  );
}

export class GovernanceExceptionClassificationService {
  constructor(
    private readonly packageService:
      KnowledgePackageService =
        new KnowledgePackageService(),

    private readonly now:
      () => number =
        () => Date.now(),
  ) {}

  classifyIncompleteGovernanceIdentity(
    input:
      GovernanceExceptionClassificationInput,
  ):
    GovernanceExceptionClassificationResult {
    const packageId =
      required(
        input.packageId,
        "package_id",
      );

    const recordedBy =
      required(
        input.recordedBy,
        "recorded_by",
      );

    const knowledgePackage =
      this.packageService
        .get(
          packageId,
        );

    if (!knowledgePackage) {
      throw new Error(
        "governance_exception_package_not_found",
      );
    }

    const existing =
      governanceExceptionRecord(
        knowledgePackage,
      );

    if (existing) {
      return {
        packageId,

        disposition:
          "already_classified",

        governanceException:
          existing,

        knowledgePackage,
      };
    }

    if (
      knowledgePackage.state !==
        "awaiting_review" ||
      knowledgePackage
        .approvalState !==
        "pending_review"
    ) {
      throw new Error(
        "governance_exception_package_not_awaiting_review",
      );
    }

    if (
      knowledgePackage.authority &&
      knowledgePackage.scope &&
      knowledgePackage.owner &&
      knowledgePackage.version
    ) {
      throw new Error(
        "governance_exception_identity_not_incomplete",
      );
    }

    const recordedAt =
      input.recordedAt ??
      this.now();

    const governanceException:
      GovernanceExceptionRecord = {
      type:
        GOVERNANCE_EXCEPTION_INCOMPLETE_IDENTITY,

      disposition:
        GOVERNANCE_EXCEPTION_MANUAL_RECLASSIFICATION,

      source:
        "legacy_governance_identity_audit",

      recordedAt,

      recordedBy,
    };

    const updated:
      KnowledgePackage = {
      ...knowledgePackage,

      updatedAt:
        Math.max(
          knowledgePackage.updatedAt,
          recordedAt,
        ),

      metadata: {
        ...knowledgePackage.metadata,

        governanceException,
      },
    };

    this.packageService
      .registry
      .register(
        updated,
      );

    saveKnowledgePackage(
      updated,
    );

    return {
      packageId,

      disposition:
        "classified",

      governanceException,

      knowledgePackage:
        updated,
    };
  }
}
