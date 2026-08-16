import type {
  KnowledgePackage,
} from "../package/index.js";

export type CanonicalReviewRisk =
  | "blocked"
  | "critical"
  | "standard"
  | "low";

export type CanonicalReviewMode =
  | "blocked"
  | "individual"
  | "batch_candidate"
  | "policy_candidate";

export interface CanonicalReviewPolicyMetadata {
  policyId:
    string;

  policyVersion?:
    string;

  authorizedBy?:
    string;

  authorizedAt?:
    number;
}

export interface CanonicalReviewClassification {
  packageId:
    string;

  risk:
    CanonicalReviewRisk;

  mode:
    CanonicalReviewMode;

  reasons:
    string[];

  policyId?:
    string;
}

interface ReviewPolicyMetadataContainer {
  canonicalReviewPolicy?:
    unknown;
}

function stringValue(
  value:
    unknown,
): string | undefined {
  if (
    typeof value !==
      "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized ||
    undefined;
}

function readPolicyMetadata(
  knowledgePackage:
    KnowledgePackage,
): CanonicalReviewPolicyMetadata | undefined {
  const container =
    knowledgePackage.metadata as
      ReviewPolicyMetadataContainer;

  const raw =
    container
      .canonicalReviewPolicy;

  if (
    typeof raw !==
      "object" ||
    raw ===
      null
  ) {
    return undefined;
  }

  const value =
    raw as Record<
      string,
      unknown
    >;

  const policyId =
    stringValue(
      value.policyId,
    );

  if (
    !policyId
  ) {
    return undefined;
  }

  return {
    policyId,

    policyVersion:
      stringValue(
        value.policyVersion,
      ),

    authorizedBy:
      stringValue(
        value.authorizedBy,
      ),

    authorizedAt:
      typeof value.authorizedAt ===
        "number"
        ? value.authorizedAt
        : undefined,
  };
}

function hasBlockedValidation(
  knowledgePackage:
    KnowledgePackage,
): boolean {
  return knowledgePackage
    .validationResults
    .some(
      (result) =>
        result.blocked,
    );
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

export function classifyCanonicalReview(
  knowledgePackage:
    KnowledgePackage,
): CanonicalReviewClassification {
  const reasons:
    string[] = [];

  if (
    knowledgePackage
      .remediation
      .required ||
    hasBlockedValidation(
      knowledgePackage,
    )
  ) {
    reasons.push(
      "Package contains unresolved validation or remediation requirements.",
    );

    return {
      packageId:
        knowledgePackage.id,

      risk:
        "blocked",

      mode:
        "blocked",

      reasons,
    };
  }

  if (
    knowledgePackage.state !==
      "awaiting_review" ||
    knowledgePackage
      .approvalState !==
      "pending_review"
  ) {
    reasons.push(
      "Package is not currently awaiting a Canonical Review decision.",
    );

    return {
      packageId:
        knowledgePackage.id,

      risk:
        "blocked",

      mode:
        "blocked",

      reasons,
    };
  }

  if (
    knowledgePackage
      .authority ===
      "constitutional"
  ) {
    reasons.push(
      "Constitutional authority requires individual human review.",
    );

    return {
      packageId:
        knowledgePackage.id,

      risk:
        "critical",

      mode:
        "individual",

      reasons,
    };
  }

  if (
    !hasGovernanceIdentity(
      knowledgePackage,
    )
  ) {
    reasons.push(
      "Authority, owner, or scope is incomplete.",
    );

    return {
      packageId:
        knowledgePackage.id,

      risk:
        "critical",

      mode:
        "individual",

      reasons,
    };
  }

  if (
    !hasProvenance(
      knowledgePackage,
    )
  ) {
    reasons.push(
      "Persisted provenance is incomplete.",
    );

    return {
      packageId:
        knowledgePackage.id,

      risk:
        "critical",

      mode:
        "individual",

      reasons,
    };
  }

  const policy =
    readPolicyMetadata(
      knowledgePackage,
    );

  if (
    policy
  ) {
    reasons.push(
      `Package is explicitly associated with pre-authorized review policy ${policy.policyId}.`,
    );

    reasons.push(
      "Policy eligibility does not itself constitute approval.",
    );

    return {
      packageId:
        knowledgePackage.id,

      risk:
        "low",

      mode:
        "policy_candidate",

      reasons,

      policyId:
        policy.policyId,
    };
  }

  reasons.push(
    "Package has complete governance identity and provenance.",
  );

  reasons.push(
    "No explicit policy authorization is attached.",
  );

  return {
    packageId:
      knowledgePackage.id,

    risk:
      "standard",

    mode:
      "batch_candidate",

    reasons,
  };
}
