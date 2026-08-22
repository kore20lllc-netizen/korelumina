import type {
  KnowledgePackage,
} from "../package/index.js";

import {
  KnowledgePackageService,
  saveKnowledgePackage,
} from "../package/index.js";

import {
  classifyCanonicalReview,
} from "./CanonicalReviewPolicy.js";

import {
  loadCanonicalReviewPolicy,
} from "./CanonicalReviewPolicyStore.js";

export interface BindCanonicalReviewPolicyInput {
  packageId:
    string;

  policyId:
    string;

  policyVersion:
    string;

  boundBy:
    string;

  boundAt?:
    number;
}

export interface CanonicalReviewPolicyBindingRecord {
  policyId:
    string;

  policyVersion:
    string;

  authorizedBy:
    string;

  authorizedAt:
    number;

  boundBy:
    string;

  boundAt:
    number;
}

export interface BindCanonicalReviewPolicyResult {
  knowledgePackage:
    KnowledgePackage;

  binding:
    CanonicalReviewPolicyBindingRecord;

  classification:
    ReturnType<
      typeof classifyCanonicalReview
    >;

  disposition:
    "bound" |
    "already_bound";
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
      `canonical_review_policy_binding_${field}_required`,
    );
  }

  return normalized;
}

function hasGovernanceIdentity(
  knowledgePackage:
    KnowledgePackage,
): boolean {
  return Boolean(
    knowledgePackage.authority &&
    knowledgePackage.owner &&
    knowledgePackage.scope &&
    knowledgePackage.version,
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

function existingBinding(
  knowledgePackage:
    KnowledgePackage,
):
  CanonicalReviewPolicyBindingRecord |
  null {
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

  const value =
    raw as Record<
      string,
      unknown
    >;

  if (
    typeof value.policyId !==
      "string" ||
    typeof value.policyVersion !==
      "string" ||
    typeof value.authorizedBy !==
      "string" ||
    typeof value.authorizedAt !==
      "number"
  ) {
    return null;
  }

  return {
    policyId:
      value.policyId,

    policyVersion:
      value.policyVersion,

    authorizedBy:
      value.authorizedBy,

    authorizedAt:
      value.authorizedAt,

    boundBy:
      typeof value.boundBy ===
        "string"
        ? value.boundBy
        : "",

    boundAt:
      typeof value.boundAt ===
        "number"
        ? value.boundAt
        : 0,
  };
}

export class CanonicalReviewPolicyBindingService {
  constructor(
    private readonly packageService =
      new KnowledgePackageService(),
  ) {}

  bind(
    input:
      BindCanonicalReviewPolicyInput,
  ):
    BindCanonicalReviewPolicyResult {
    const packageId =
      required(
        input.packageId,
        "package_id",
      );

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

    const boundBy =
      required(
        input.boundBy,
        "actor_id",
      );

    const knowledgePackage =
      this.packageService
        .get(
          packageId,
        );

    if (!knowledgePackage) {
      throw new Error(
        "knowledge_package_not_found",
      );
    }

    const existing =
      existingBinding(
        knowledgePackage,
      );

    if (
      existing &&
      existing.policyId ===
        policyId &&
      existing.policyVersion ===
        policyVersion
    ) {
      return {
        knowledgePackage,

        binding:
          existing,

        classification:
          classifyCanonicalReview(
            knowledgePackage,
          ),

        disposition:
          "already_bound",
      };
    }

    if (existing) {
      throw new Error(
        `canonical_review_policy_binding_conflict:${existing.policyId}@${existing.policyVersion}`,
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
        "canonical_review_policy_binding_package_not_awaiting_review",
      );
    }

    if (
      knowledgePackage
        .authority ===
        "constitutional"
    ) {
      throw new Error(
        "canonical_review_policy_binding_constitutional_authority_requires_individual_review",
      );
    }

    if (
      !hasGovernanceIdentity(
        knowledgePackage,
      )
    ) {
      throw new Error(
        "canonical_review_policy_binding_governance_identity_incomplete",
      );
    }

    if (
      !hasProvenance(
        knowledgePackage,
      )
    ) {
      throw new Error(
        "canonical_review_policy_binding_provenance_incomplete",
      );
    }

    if (
      !validationPassed(
        knowledgePackage,
      )
    ) {
      throw new Error(
        "canonical_review_policy_binding_validation_not_passed",
      );
    }

    const policy =
      loadCanonicalReviewPolicy(
        policyId,
        policyVersion,
      );

    if (!policy) {
      throw new Error(
        `canonical_review_policy_binding_policy_not_found:${policyId}@${policyVersion}`,
      );
    }

    if (
      policy.status !==
        "active"
    ) {
      throw new Error(
        `canonical_review_policy_binding_policy_not_active:${policy.status}`,
      );
    }

    if (
      policy.authority !==
        knowledgePackage.authority
    ) {
      throw new Error(
        "canonical_review_policy_binding_authority_mismatch",
      );
    }

    if (
      policy.scope !==
        knowledgePackage.scope
    ) {
      throw new Error(
        "canonical_review_policy_binding_scope_mismatch",
      );
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
      throw new Error(
        "canonical_review_policy_binding_authority_excluded",
      );
    }

    if (
      policy.rules
        .requireCompleteGovernanceIdentity &&
      !hasGovernanceIdentity(
        knowledgePackage,
      )
    ) {
      throw new Error(
        "canonical_review_policy_binding_governance_identity_incomplete",
      );
    }

    if (
      policy.rules
        .requireProvenance &&
      !hasProvenance(
        knowledgePackage,
      )
    ) {
      throw new Error(
        "canonical_review_policy_binding_provenance_incomplete",
      );
    }

    if (
      policy.rules
        .requireValidationPassed &&
      !validationPassed(
        knowledgePackage,
      )
    ) {
      throw new Error(
        "canonical_review_policy_binding_validation_not_passed",
      );
    }

    const boundAt =
      input.boundAt ??
      Date.now();

    const binding:
      CanonicalReviewPolicyBindingRecord = {
      policyId:
        policy.id,

      policyVersion:
        policy.version,

      authorizedBy:
        policy.authorizedBy,

      authorizedAt:
        policy.authorizedAt,

      boundBy,

      boundAt,
    };

    const updated:
      KnowledgePackage = {
      ...knowledgePackage,

      metadata: {
        ...knowledgePackage
          .metadata,

        canonicalReviewPolicy:
          binding,
      },

      updatedAt:
        Math.max(
          knowledgePackage.updatedAt,
          boundAt,
        ),
    };

    this.packageService
      .registry
      .register(
        updated,
      );

    saveKnowledgePackage(
      updated,
    );

    const classification =
      classifyCanonicalReview(
        updated,
      );

    if (
      classification.mode !==
        "policy_candidate" ||
      classification.policyId !==
        policy.id
    ) {
      throw new Error(
        "canonical_review_policy_binding_classification_invariant_failed",
      );
    }

    return {
      knowledgePackage:
        updated,

      binding,

      classification,

      disposition:
        "bound",
    };
  }
}
