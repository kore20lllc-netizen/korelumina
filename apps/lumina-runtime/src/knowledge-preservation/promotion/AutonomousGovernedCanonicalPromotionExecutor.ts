import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  CanonicalKnowledgeStore,
} from "../../canonical-knowledge/CanonicalKnowledgeStore.js";

import type {
  KnowledgePackage,
} from "../package/index.js";

import {
  KnowledgePackageService,
} from "../package/index.js";

import {
  KnowledgeManufacturingRunService,
} from "../manufacturing/index.js";

import {
  loadCanonicalReviewPolicy,
} from "../review/CanonicalReviewPolicyStore.js";

import {
  resolveKnowledgeStoragePath,
} from "../storage/index.js";

import {
  GovernedCanonicalPromotionService,
} from "./GovernedCanonicalPromotionService.js";

export type AutonomousPromotionDisposition =
  | "promoted"
  | "already_canonical"
  | "exception"
  | "failed";

export interface AutonomousGovernedCanonicalPromotionInput {
  policyId:
    string;

  policyVersion:
    string;

  actorId:
    string;

  executedAt?:
    number;
}

export interface AutonomousPromotionPackageResult {
  packageId:
    string;

  packageVersion:
    string | null;

  policyId:
    string;

  policyVersion:
    string;

  actorId:
    string;

  disposition:
    AutonomousPromotionDisposition;

  canonicalKnowledgeIds:
    string[];

  reason?:
    string;

  error?:
    string;
}

export interface AutonomousGovernedCanonicalPromotionResult {
  executionId:
    string;

  policyId:
    string;

  policyVersion:
    string;

  actorId:
    string;

  executedAt:
    number;

  eligible:
    number;

  promoted:
    number;

  alreadyCanonical:
    number;

  failed:
    number;

  exceptions:
    number;

  packages:
    AutonomousPromotionPackageResult[];
}

interface PromotionResult {
  knowledgePackage:
    KnowledgePackage;

  canonicalItems:
    Array<{
      id:
        string;
    }>;
}

export interface GovernedCanonicalPromotionPort {
  promoteApprovedPackage(
    packageId:
      string,
  ): PromotionResult;
}

interface PolicyReference {
  policyId?:
    unknown;

  policyVersion?:
    unknown;
}

interface PolicyExecutionProof {
  policyId?:
    unknown;

  policyVersion?:
    unknown;

  executedBy?:
    unknown;

  executedAt?:
    unknown;

  packageIds?:
    unknown;

  decision?:
    unknown;
}

interface ReviewProof {
  packageId?:
    unknown;

  packageVersion?:
    unknown;

  decision?:
    unknown;

  reviewerId?:
    unknown;

  reviewedAt?:
    unknown;

  evidenceConsidered?:
    unknown;

  reason?:
    unknown;
}

interface CanonicalizationMetadata {
  canonicalItemIds?:
    unknown;
}

interface AutonomousPromotionAttemptRecord {
  actorId:
    string;

  attemptedAt:
    number;

  packages:
    AutonomousPromotionPackageResult[];

  totals: {
    eligible:
      number;

    promoted:
      number;

    alreadyCanonical:
      number;

    failed:
      number;

    exceptions:
      number;
  };
}

interface AutonomousPromotionExecutionRecord {
  id:
    string;

  policyId:
    string;

  policyVersion:
    string;

  candidateIdentities:
    string[];

  createdAt:
    number;

  updatedAt:
    number;

  attempts:
    AutonomousPromotionAttemptRecord[];
}

const executionRoot =
  resolveKnowledgeStoragePath(
    "autonomous-promotion-executions",
  );

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
      `autonomous_canonical_promotion_${field}_required`,
    );
  }

  return normalized;
}

function objectValue(
  value:
    unknown,
): Record<string, unknown> | null {
  return (
    typeof value ===
      "object" &&
    value !==
      null
  )
    ? value as
        Record<string, unknown>
    : null;
}

function metadataObject(
  knowledgePackage:
    KnowledgePackage,

  key:
    string,
): Record<string, unknown> | null {
  return objectValue(
    knowledgePackage
      .metadata[
        key
      ],
  );
}

function metadataArray(
  knowledgePackage:
    KnowledgePackage,

  key:
    string,
): Record<string, unknown>[] {
  const value =
    knowledgePackage
      .metadata[
        key
      ];

  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value
    .map(
      objectValue,
    )
    .filter(
      (
        item,
      ): item is
        Record<string, unknown> =>
          item !== null,
    );
}

function exactPolicyReference(
  knowledgePackage:
    KnowledgePackage,

  policyId:
    string,

  policyVersion:
    string,
): boolean {
  const value =
    metadataObject(
      knowledgePackage,
      "canonicalReviewPolicy",
    ) as
      PolicyReference |
      null;

  return (
    value?.policyId ===
      policyId &&
    value.policyVersion ===
      policyVersion
  );
}

function policyExecutionProofs(
  knowledgePackage:
    KnowledgePackage,
): PolicyExecutionProof[] {
  const current =
    metadataObject(
      knowledgePackage,
      "policyExecution",
    );

  return [
    ...(
      current
        ? [
            current as
              PolicyExecutionProof,
          ]
        : []
    ),

    ...metadataArray(
      knowledgePackage,
      "policyExecutionHistory",
    ).map(
      (value) =>
        value as
          PolicyExecutionProof,
    ),
  ];
}

function hasExactPolicyExecutionApproval(
  knowledgePackage:
    KnowledgePackage,

  policyId:
    string,

  policyVersion:
    string,
): boolean {
  return policyExecutionProofs(
    knowledgePackage,
  ).some(
    (proof) =>
      proof.policyId ===
        policyId &&
      proof.policyVersion ===
        policyVersion &&
      proof.decision ===
        "approved" &&
      (
        !Array.isArray(
          proof.packageIds,
        ) ||
        proof.packageIds.includes(
          knowledgePackage.id,
        )
      ),
  );
}

function reviewProof(
  knowledgePackage:
    KnowledgePackage,
): ReviewProof | null {
  return metadataObject(
    knowledgePackage,
    "review",
  ) as
    ReviewProof |
    null;
}

function reviewHistory(
  knowledgePackage:
    KnowledgePackage,
): ReviewProof[] {
  return metadataArray(
    knowledgePackage,
    "reviewHistory",
  ).map(
    (value) =>
      value as
        ReviewProof,
  );
}

function exactPolicyReviewReason(
  policyId:
    string,

  policyVersion:
    string,
): string {
  return (
    `governed-policy-execution:${policyId}@${policyVersion}`
  );
}

function validateApprovalProof(
  knowledgePackage:
    KnowledgePackage,

  policyId:
    string,

  policyVersion:
    string,
): string | null {
  const review =
    reviewProof(
      knowledgePackage,
    );

  if (!review) {
    return "review_proof_missing";
  }

  if (
    review.packageId !==
      knowledgePackage.id
  ) {
    return "review_package_identity_mismatch";
  }

  if (
    review.packageVersion !==
      knowledgePackage.version
  ) {
    return "stale_package_version";
  }

  if (
    review.decision !==
      "approved"
  ) {
    return "review_not_approved";
  }

  if (
    typeof review.reviewerId !==
      "string" ||
    !review.reviewerId.trim()
  ) {
    return "reviewer_identity_missing";
  }

  if (
    typeof review.reviewedAt !==
      "number"
  ) {
    return "review_timestamp_missing";
  }

  if (
    !Array.isArray(
      review.evidenceConsidered,
    ) ||
    review.evidenceConsidered
      .length ===
      0
  ) {
    return "review_evidence_missing";
  }

  if (
    review.reason !==
      exactPolicyReviewReason(
        policyId,
        policyVersion,
      )
  ) {
    return "approval_not_attributable_to_requested_policy";
  }

  const matchingHistory =
    reviewHistory(
      knowledgePackage,
    ).some(
      (history) =>
        history.packageId ===
          knowledgePackage.id &&
        history.packageVersion ===
          knowledgePackage.version &&
        history.decision ===
          "approved" &&
        history.reviewerId ===
          review.reviewerId &&
        history.reviewedAt ===
          review.reviewedAt &&
        history.reason ===
          review.reason,
    );

  if (
    !matchingHistory
  ) {
    return "matching_review_history_missing";
  }

  if (
    !hasExactPolicyExecutionApproval(
      knowledgePackage,
      policyId,
      policyVersion,
    )
  ) {
    return "policy_execution_approval_missing";
  }

  return null;
}

function hasGovernanceIdentity(
  knowledgePackage:
    KnowledgePackage,
): boolean {
  return Boolean(
    knowledgePackage
      .authority &&
    knowledgePackage
      .owner &&
    knowledgePackage
      .scope,
  );
}

function hasProvenance(
  knowledgePackage:
    KnowledgePackage,
): boolean {
  return (
    knowledgePackage
      .sourceEvidenceRefs
      .length >
      0 ||
    knowledgePackage
      .provenance
      .evidenceIds
      .length >
      0 ||
    knowledgePackage
      .provenance
      .sourceLocations
      .length >
      0
  );
}

function validationPassed(
  knowledgePackage:
    KnowledgePackage,
): boolean {
  return (
    !knowledgePackage
      .remediation
      .required &&
    knowledgePackage
      .validationResults
      .length >
      0 &&
    knowledgePackage
      .validationResults
      .every(
        (result) =>
          !result.blocked &&
          (
            result.status ===
              "approved" ||
            result.status ===
              "merged"
          ),
      )
  );
}

function canonicalKnowledgeIds(
  knowledgePackage:
    KnowledgePackage,
): string[] {
  const value =
    metadataObject(
      knowledgePackage,
      "canonicalization",
    ) as
      CanonicalizationMetadata |
      null;

  if (
    !Array.isArray(
      value
        ?.canonicalItemIds,
    )
  ) {
    return [];
  }

  return value
    .canonicalItemIds
    .filter(
      (
        id,
      ): id is string =>
        typeof id ===
          "string" &&
        id.trim().length >
          0,
    );
}

function candidateIdentity(
  knowledgePackage:
    KnowledgePackage,
): string {
  return (
    `${knowledgePackage.id}@${knowledgePackage.version ?? "unversioned"}`
  );
}

function executionIdentity(
  policyId:
    string,

  policyVersion:
    string,

  candidates:
    KnowledgePackage[],
): string {
  const digest =
    crypto
      .createHash(
        "sha256",
      )
      .update(
        JSON.stringify({
          policyId,
          policyVersion,

          candidates:
            candidates
              .map(
                candidateIdentity,
              )
              .sort(),
        }),
      )
      .digest(
        "hex",
      )
      .slice(
        0,
        24,
      );

  return (
    `autonomous-promotion:${digest}`
  );
}

function executionPath(
  executionId:
    string,
): string {
  const safe =
    executionId
      .replaceAll(
        "/",
        "_",
      )
      .replaceAll(
        "\\",
        "_",
      )
      .replaceAll(
        ":",
        "_",
      );

  return path.join(
    executionRoot,
    `${safe}.json`,
  );
}

function loadExecution(
  executionId:
    string,
): AutonomousPromotionExecutionRecord | null {
  const file =
    executionPath(
      executionId,
    );

  if (
    !fs.existsSync(
      file,
    )
  ) {
    return null;
  }

  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8",
    ),
  ) as
    AutonomousPromotionExecutionRecord;
}

function saveExecution(
  execution:
    AutonomousPromotionExecutionRecord,
): void {
  fs.mkdirSync(
    executionRoot,
    {
      recursive:
        true,
    },
  );

  fs.writeFileSync(
    executionPath(
      execution.id,
    ),
    JSON.stringify(
      execution,
      null,
      2,
    ),
    "utf8",
  );
}

function totals(
  packages:
    AutonomousPromotionPackageResult[],
) {
  return {
    eligible:
      packages.length,

    promoted:
      packages.filter(
        (item) =>
          item.disposition ===
          "promoted",
      ).length,

    alreadyCanonical:
      packages.filter(
        (item) =>
          item.disposition ===
          "already_canonical",
      ).length,

    failed:
      packages.filter(
        (item) =>
          item.disposition ===
          "failed",
      ).length,

    exceptions:
      packages.filter(
        (item) =>
          item.disposition ===
          "exception",
      ).length,
  };
}

export class AutonomousGovernedCanonicalPromotionExecutor {
  constructor(
    private readonly packageService =
      new KnowledgePackageService(),

    private readonly manufacturingRunService =
      new KnowledgeManufacturingRunService(),

    private readonly promotionService:
      GovernedCanonicalPromotionPort =
        new GovernedCanonicalPromotionService(
          packageService,
          new CanonicalKnowledgeStore(),
          manufacturingRunService,
        ),
  ) {}

  execute(
    input:
      AutonomousGovernedCanonicalPromotionInput,
  ):
    AutonomousGovernedCanonicalPromotionResult {
    const policyId =
      required(
        input.policyId,
        "policy_id",
      );

    const policyVersion =
      required(
        input.policyVersion,
        "policy_version",
      );

    const actorId =
      required(
        input.actorId,
        "actor_id",
      );

    const executedAt =
      input.executedAt ??
      Date.now();

    const policy =
      loadCanonicalReviewPolicy(
        policyId,
        policyVersion,
      );

    if (!policy) {
      throw new Error(
        `autonomous_canonical_promotion_policy_not_found:${policyId}@${policyVersion}`,
      );
    }

    if (
      policy.status !==
      "active"
    ) {
      throw new Error(
        `autonomous_canonical_promotion_policy_not_active:${policy.status}`,
      );
    }

    const candidates =
      this.packageService
        .list()
        .filter(
          (knowledgePackage) =>
            hasExactPolicyExecutionApproval(
              knowledgePackage,
              policyId,
              policyVersion,
            ),
        )
        .sort(
          (left, right) =>
            candidateIdentity(
              left,
            ).localeCompare(
              candidateIdentity(
                right,
              ),
            ),
        );

    const executionId =
      executionIdentity(
        policyId,
        policyVersion,
        candidates,
      );

    const previous =
      loadExecution(
        executionId,
      );

    const execution:
      AutonomousPromotionExecutionRecord = {
        id:
          executionId,

        policyId,
        policyVersion,

        candidateIdentities:
          candidates.map(
            candidateIdentity,
          ),

        createdAt:
          previous
            ?.createdAt ??
          executedAt,

        updatedAt:
          executedAt,

        attempts: [
          ...(
            previous
              ?.attempts ??
            []
          ),
          {
            actorId,
            attemptedAt:
              executedAt,
            packages:
              [],
            totals: {
              eligible:
                candidates.length,
              promoted:
                0,
              alreadyCanonical:
                0,
              failed:
                0,
              exceptions:
                0,
            },
          },
        ],
      };

    saveExecution(
      execution,
    );

    const currentAttempt =
      execution
        .attempts[
          execution
            .attempts
            .length -
          1
        ];

    const record = (
      result:
        AutonomousPromotionPackageResult,
    ) => {
      currentAttempt
        .packages
        .push(
          result,
        );

      currentAttempt.totals =
        totals(
          currentAttempt
            .packages,
        );

      execution.updatedAt =
        Date.now();

      saveExecution(
        execution,
      );
    };

    for (
      const knowledgePackage
      of candidates
    ) {
      const base = {
        packageId:
          knowledgePackage.id,

        packageVersion:
          knowledgePackage.version,

        policyId,
        policyVersion,
        actorId,
      };

      if (
        !knowledgePackage
          .version
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "package_version_missing",
        });

        continue;
      }

      if (
        !exactPolicyReference(
          knowledgePackage,
          policyId,
          policyVersion,
        )
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "policy_reference_mismatch",
        });

        continue;
      }

      if (
        knowledgePackage
          .authority ===
          "constitutional"
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "constitutional_authority_requires_individual_review",
        });

        continue;
      }

      if (
        !hasGovernanceIdentity(
          knowledgePackage,
        )
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "complete_governance_identity_required",
        });

        continue;
      }

      if (
        !hasProvenance(
          knowledgePackage,
        )
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "provenance_required",
        });

        continue;
      }

      if (
        policy.authority !==
          knowledgePackage
            .authority
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "authority_mismatch",
        });

        continue;
      }

      if (
        policy.scope !==
          knowledgePackage
            .scope
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "scope_mismatch",
        });

        continue;
      }

      if (
        policy.rules
          .excludedAuthorities
          .includes(
            knowledgePackage
              .authority ??
              "",
          )
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "authority_excluded",
        });

        continue;
      }

      if (
        policy.rules
          .requireCompleteGovernanceIdentity &&
        !hasGovernanceIdentity(
          knowledgePackage,
        )
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "complete_governance_identity_required",
        });

        continue;
      }

      if (
        policy.rules
          .requireProvenance &&
        !hasProvenance(
          knowledgePackage,
        )
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "provenance_required",
        });

        continue;
      }

      if (
        policy.rules
          .requireValidationPassed &&
        !validationPassed(
          knowledgePackage,
        )
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "validation_pass_required",
        });

        continue;
      }

      if (
        knowledgePackage
          .remediation
          .required ||
        knowledgePackage
          .validationResults
          .some(
            (result) =>
              result.blocked,
          )
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "package_blocked_or_requires_remediation",
        });

        continue;
      }

      const approvalProblem =
        validateApprovalProof(
          knowledgePackage,
          policyId,
          policyVersion,
        );

      if (
        approvalProblem
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            approvalProblem,
        });

        continue;
      }

      if (
        knowledgePackage
          .state ===
          "canonical"
      ) {
        record({
          ...base,
          disposition:
            "already_canonical",
          canonicalKnowledgeIds:
            canonicalKnowledgeIds(
              knowledgePackage,
            ),
          reason:
            "package_already_canonical",
        });

        continue;
      }

      if (
        knowledgePackage
          .state !==
          "approved" ||
        knowledgePackage
          .approvalState !==
          "approved"
      ) {
        record({
          ...base,
          disposition:
            "exception",
          canonicalKnowledgeIds:
            [],
          reason:
            "knowledge_package_not_approved",
        });

        continue;
      }

      try {
        const promoted =
          this.promotionService
            .promoteApprovedPackage(
              knowledgePackage.id,
            );

        record({
          ...base,
          disposition:
            "promoted",
          canonicalKnowledgeIds:
            promoted
              .canonicalItems
              .map(
                (item) =>
                  item.id,
              ),
        });
      } catch (error) {
        record({
          ...base,
          disposition:
            "failed",
          canonicalKnowledgeIds:
            [],
          error:
            error instanceof
              Error
              ? error.message
              : String(
                  error,
                ),
        });
      }
    }

    const summary =
      totals(
        currentAttempt
          .packages,
      );

    return {
      executionId,
      policyId,
      policyVersion,
      actorId,
      executedAt,

      ...summary,

      packages:
        currentAttempt
          .packages,
    };
  }
}

export function loadAutonomousPromotionExecution(
  executionId:
    string,
):
  AutonomousPromotionExecutionRecord |
  null {
  return loadExecution(
    executionId,
  );
}
