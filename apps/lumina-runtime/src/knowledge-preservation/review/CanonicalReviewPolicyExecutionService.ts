import type {
  KnowledgePackage,
} from "../package/index.js";

import {
  KnowledgePackageService,
  saveKnowledgePackage,
} from "../package/index.js";

import {
  loadCanonicalReviewPolicy,
} from "./CanonicalReviewPolicyStore.js";

import type {
  CanonicalReviewPolicyAuthority,
} from "./CanonicalReviewPolicyStore.js";

import {
  CanonicalReviewService,
} from "./CanonicalReviewService.js";

export interface CanonicalReviewPolicyRuleEvaluation {
  completeGovernanceIdentity:
    boolean;

  provenance:
    boolean;

  validationPassed:
    boolean;

  authorityCompatible:
    boolean;

  scopeCompatible:
    boolean;

  authorityExcluded:
    boolean;
}

export interface CanonicalReviewPolicyPackageEvaluation {
  packageId:
    string;

  eligible:
    boolean;

  compliant:
    boolean;

  blocked:
    boolean;

  exceptions:
    string[];

  rules:
    CanonicalReviewPolicyRuleEvaluation;
}

export interface CanonicalReviewPolicyExecutionRecord {
  policyId:
    string;

  policyVersion:
    string;

  executedBy:
    string;

  executedAt:
    number;

  packageIds:
    string[];

  evaluations:
    CanonicalReviewPolicyPackageEvaluation[];

  decision:
    "approved";
}

export interface ExecuteCanonicalReviewPolicyInput {
  policyId:
    string;

  policyVersion:
    string;

  actorId:
    string;

  executedAt?:
    number;
}

export interface CanonicalReviewPolicyExecutionResult {
  policy: {
    id:
      string;

    version:
      string;

    status:
      string;
  };

  executedBy:
    string;

  executedAt:
    number;

  eligiblePackages:
    number;

  compliantPackages:
    number;

  exceptions:
    number;

  blocked:
    number;

  decisions: Array<{
    packageId:
      string;

    decision:
      "approved";

    review:
      unknown;
  }>;

  evaluations:
    CanonicalReviewPolicyPackageEvaluation[];

  promotion:
    null;
}

interface CanonicalReviewPolicyMetadataReference {
  policyId?:
    unknown;

  policyVersion?:
    unknown;
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
      `canonical_review_policy_execution_${field}_required`,
    );
  }

  return normalized;
}

function readPolicyReference(
  knowledgePackage:
    KnowledgePackage,
): {
  policyId:
    string;

  policyVersion:
    string;
} | null {
  const raw =
    knowledgePackage
      .metadata
      .canonicalReviewPolicy;

  if (
    typeof raw !==
      "object" ||
    raw ===
      null
  ) {
    return null;
  }

  const reference =
    raw as
      CanonicalReviewPolicyMetadataReference;

  if (
    typeof reference.policyId !==
      "string" ||
    typeof reference.policyVersion !==
      "string"
  ) {
    return null;
  }

  const policyId =
    reference.policyId.trim();

  const policyVersion =
    reference.policyVersion.trim();

  if (
    !policyId ||
    !policyVersion
  ) {
    return null;
  }

  return {
    policyId,
    policyVersion,
  };
}

function hasGovernanceIdentity(
  knowledgePackage:
    KnowledgePackage,
): boolean {
  return Boolean(
    knowledgePackage.authority &&
    knowledgePackage.owner &&
    knowledgePackage.scope,
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
  if (
    knowledgePackage
      .remediation
      .required
  ) {
    return false;
  }

  if (
    knowledgePackage
      .validationResults
      .length ===
    0
  ) {
    return false;
  }

  return knowledgePackage
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
    );
}

function existingExecutionHistory(
  knowledgePackage:
    KnowledgePackage,
): CanonicalReviewPolicyExecutionRecord[] {
  const value =
    knowledgePackage
      .metadata
      .policyExecutionHistory;

  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value.filter(
    (
      record,
    ): record is
      CanonicalReviewPolicyExecutionRecord =>
      typeof record ===
        "object" &&
      record !==
        null,
  );
}

export class CanonicalReviewPolicyExecutionService {
  constructor(
    private readonly packageService =
      new KnowledgePackageService(),

    private readonly reviewService =
      new CanonicalReviewService(
        packageService,
      ),
  ) {}

  evaluate(
    policyId:
      string,

    policyVersion:
      string,
  ): {
    policy:
      CanonicalReviewPolicyAuthority;

    evaluations:
      CanonicalReviewPolicyPackageEvaluation[];
  } {
    const id =
      required(
        policyId,
        "policy_id",
      );

    const version =
      required(
        policyVersion,
        "policy_version",
      );

    const policy =
      loadCanonicalReviewPolicy(
        id,
        version,
      );

    if (!policy) {
      throw new Error(
        `canonical_review_policy_execution_policy_not_found:${id}@${version}`,
      );
    }

    if (
      policy.status !==
      "active"
    ) {
      throw new Error(
        `canonical_review_policy_execution_policy_not_active:${policy.status}`,
      );
    }

    const evaluations =
      this.packageService
        .list()
        .map(
          (
            knowledgePackage,
          ) =>
            this.evaluatePackage(
              policy,
              knowledgePackage,
            ),
        )
        .filter(
          (evaluation) =>
            evaluation.eligible,
        );

    return {
      policy,
      evaluations,
    };
  }

  execute(
    input:
      ExecuteCanonicalReviewPolicyInput,
  ):
    CanonicalReviewPolicyExecutionResult {
    const actorId =
      required(
        input.actorId,
        "executing_human",
      );

    const executedAt =
      input.executedAt ??
      Date.now();

    const {
      policy,
      evaluations,
    } =
      this.evaluate(
        input.policyId,
        input.policyVersion,
      );

    const compliant =
      evaluations.filter(
        (evaluation) =>
          evaluation.compliant,
      );

    const decisions:
      CanonicalReviewPolicyExecutionResult[
        "decisions"
      ] = [];

    for (
      const evaluation
      of compliant
    ) {
      const reviewResult =
        this.reviewService
          .review({
            packageId:
              evaluation.packageId,

            decision:
              "approved",

            reviewerId:
              actorId,

            reviewedAt:
              executedAt,

            reason:
              `governed-policy-execution:${policy.id}@${policy.version}`,
          });

      const executionRecord:
        CanonicalReviewPolicyExecutionRecord = {
        policyId:
          policy.id,

        policyVersion:
          policy.version,

        executedBy:
          actorId,

        executedAt,

        packageIds:
          compliant.map(
            (item) =>
              item.packageId,
          ),

        evaluations,

        decision:
          "approved",
      };

      const updated:
        KnowledgePackage = {
        ...reviewResult
          .knowledgePackage,

        metadata: {
          ...reviewResult
            .knowledgePackage
            .metadata,

          policyExecution: {
            policyId:
              policy.id,

            policyVersion:
              policy.version,

            executedBy:
              actorId,

            executedAt,

            decision:
              "approved",
          },

          policyExecutionHistory: [
            ...existingExecutionHistory(
              reviewResult
                .knowledgePackage,
            ),

            executionRecord,
          ],
        },

        updatedAt:
          executedAt,
      };

      this.packageService
        .registry
        .register(
          updated,
        );

      saveKnowledgePackage(
        updated,
      );

      decisions.push({
        packageId:
          updated.id,

        decision:
          "approved",

        review:
          reviewResult.review,
      });
    }

    return {
      policy: {
        id:
          policy.id,

        version:
          policy.version,

        status:
          policy.status,
      },

      executedBy:
        actorId,

      executedAt,

      eligiblePackages:
        evaluations.length,

      compliantPackages:
        compliant.length,

      exceptions:
        evaluations.filter(
          (evaluation) =>
            evaluation
              .exceptions
              .length >
            0,
        ).length,

      blocked:
        evaluations.filter(
          (evaluation) =>
            evaluation.blocked,
        ).length,

      decisions,

      evaluations,

      /*
       * Constitutional invariant:
       *
       * Policy execution records Canonical Review decisions only.
       * Canonical promotion remains an independent governed action.
       */
      promotion:
        null,
    };
  }

  private evaluatePackage(
    policy:
      CanonicalReviewPolicyAuthority,

    knowledgePackage:
      KnowledgePackage,
  ):
    CanonicalReviewPolicyPackageEvaluation {
    const reference =
      readPolicyReference(
        knowledgePackage,
      );

    const eligible =
      reference?.policyId ===
        policy.id &&
      reference
        .policyVersion ===
        policy.version &&
      knowledgePackage.state ===
        "awaiting_review" &&
      knowledgePackage
        .approvalState ===
        "pending_review";

    const governanceIdentity =
      hasGovernanceIdentity(
        knowledgePackage,
      );

    const provenance =
      hasProvenance(
        knowledgePackage,
      );

    const validation =
      validationPassed(
        knowledgePackage,
      );

    const authorityCompatible =
      policy.authority ===
      knowledgePackage.authority;

    const scopeCompatible =
      policy.scope ===
      knowledgePackage.scope;

    const authorityExcluded =
      policy.rules
        .excludedAuthorities
        .includes(
          knowledgePackage
            .authority ??
            "",
        );

    const exceptions:
      string[] = [];

    if (
      policy.rules
        .requireCompleteGovernanceIdentity &&
      !governanceIdentity
    ) {
      exceptions.push(
        "complete_governance_identity_required",
      );
    }

    if (
      policy.rules
        .requireProvenance &&
      !provenance
    ) {
      exceptions.push(
        "provenance_required",
      );
    }

    if (
      policy.rules
        .requireValidationPassed &&
      !validation
    ) {
      exceptions.push(
        "validation_pass_required",
      );
    }

    if (
      !authorityCompatible
    ) {
      exceptions.push(
        "authority_mismatch",
      );
    }

    if (
      !scopeCompatible
    ) {
      exceptions.push(
        "scope_mismatch",
      );
    }

    if (
      authorityExcluded
    ) {
      exceptions.push(
        "authority_excluded",
      );
    }

    const blocked =
      knowledgePackage
        .remediation
        .required ||
      knowledgePackage
        .validationResults
        .some(
          (result) =>
            result.blocked,
        );

    return {
      packageId:
        knowledgePackage.id,

      eligible,

      compliant:
        eligible &&
        !blocked &&
        exceptions.length ===
          0,

      blocked,

      exceptions,

      rules: {
        completeGovernanceIdentity:
          governanceIdentity,

        provenance,

        validationPassed:
          validation,

        authorityCompatible,

        scopeCompatible,

        authorityExcluded,
      },
    };
  }
}
