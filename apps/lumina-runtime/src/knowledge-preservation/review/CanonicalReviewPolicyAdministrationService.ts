import {
  deleteCanonicalReviewPolicy,
  listCanonicalReviewPolicies,
  loadCanonicalReviewPolicy,
  saveCanonicalReviewPolicy,
} from "./CanonicalReviewPolicyStore.js";

import {
  listKnowledgePackages,
} from "../package/KnowledgePackageStore.js";

import type {
  CanonicalReviewPolicyAuthority,
} from "./CanonicalReviewPolicyStore.js";

export interface CreateCanonicalReviewPolicyInput {
  id:
    string;

  version:
    string;

  title:
    string;

  authority:
    string;

  scope:
    string;

  owner:
    string;

  rules:
    CanonicalReviewPolicyAuthority["rules"];
}

export interface PolicyAuthorityDecision {
  actorId:
    string;

  timestamp?:
    number;
}

interface CanonicalReviewPolicyReferencePackage {
  metadata:
    Record<string, unknown>;
}

interface CanonicalReviewPolicyPackageReader {
  list():
    CanonicalReviewPolicyReferencePackage[];
}

const persistedKnowledgePackageReader:
  CanonicalReviewPolicyPackageReader = {
    list:
      () =>
        listKnowledgePackages(),
  };

function required(
  value:
    string,

  field:
    string,
): string {
  const normalized =
    value.trim();

  if (
    !normalized
  ) {
    throw new Error(
      `canonical_review_policy_${field}_required`,
    );
  }

  return normalized;
}

function now(
  timestamp?:
    number,
): number {
  return timestamp ??
    Date.now();
}

export class CanonicalReviewPolicyAdministrationService {
  constructor(
    private readonly packageReader:
      CanonicalReviewPolicyPackageReader =
        persistedKnowledgePackageReader,
  ) {}

  createDraft(
    input:
      CreateCanonicalReviewPolicyInput,
  ):
    CanonicalReviewPolicyAuthority {
    const id =
      required(
        input.id,
        "id",
      );

    const version =
      required(
        input.version,
        "version",
      );

    if (
      loadCanonicalReviewPolicy(
        id,
        version,
      )
    ) {
      throw new Error(
        `canonical_review_policy_already_exists:${id}@${version}`,
      );
    }

    const timestamp =
      Date.now();

    const policy:
      CanonicalReviewPolicyAuthority = {
        id,

        version,

        status:
          "draft",

        title:
          required(
            input.title,
            "title",
          ),

        authority:
          required(
            input.authority,
            "authority",
          ),

        scope:
          required(
            input.scope,
            "scope",
          ),

        owner:
          required(
            input.owner,
            "owner",
          ),

        authorizedBy:
          "",

        authorizedAt:
          0,

        createdAt:
          timestamp,

        updatedAt:
          timestamp,

        supersedes:
          [],

        supersededBy:
          null,

        rules:
          input.rules,
      };

    saveCanonicalReviewPolicy(
      policy,
    );

    return policy;
  }

  deleteDraft(
    id:
      string,

    version:
      string,

    decision:
      PolicyAuthorityDecision,
  ): {
    id:
      string;

    version:
      string;
  } {
    const policy =
      this.requirePolicy(
        id,
        version,
      );

    required(
      decision.actorId,
      "deleting_human",
    );

    if (
      policy.status !==
      "draft"
    ) {
      throw new Error(
        `canonical_review_policy_cannot_delete:${policy.status}`,
      );
    }

    if (
      policy.authorizedBy
        .trim() ||
      policy.authorizedAt !==
        0
    ) {
      throw new Error(
        "canonical_review_policy_cannot_delete:authorized",
      );
    }

    if (
      policy.supersedes.length >
        0 ||
      policy.supersededBy !==
        null
    ) {
      throw new Error(
        "canonical_review_policy_cannot_delete:supersession_lineage",
      );
    }

    const policyKey =
      `${policy.id}@${policy.version}`;

    const externallyLinked =
      listCanonicalReviewPolicies()
        .some(
          (candidate) =>
            (
              candidate.id !==
                policy.id ||
              candidate.version !==
                policy.version
            ) &&
            (
              candidate.supersededBy ===
                policyKey ||
              candidate.supersedes
                .includes(
                  policyKey,
                )
            ),
        );

    if (
      externallyLinked
    ) {
      throw new Error(
        "canonical_review_policy_cannot_delete:supersession_lineage",
      );
    }

    const referenced =
      this.packageReader
        .list()
        .some(
          (
            knowledgePackage,
          ) => {
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
              return false;
            }

            const reference =
              raw as Record<
                string,
                unknown
              >;

            return (
              reference.policyId ===
                policy.id &&
              reference.policyVersion ===
                policy.version
            );
          },
        );

    if (
      referenced
    ) {
      throw new Error(
        `canonical_review_policy_cannot_delete:package_reference:${policyKey}`,
      );
    }

    deleteCanonicalReviewPolicy(
      policy.id,
      policy.version,
    );

    return {
      id:
        policy.id,

      version:
        policy.version,
    };
  }

  activate(
    id:
      string,

    version:
      string,

    decision:
      PolicyAuthorityDecision,
  ):
    CanonicalReviewPolicyAuthority {
    const policy =
      this.requirePolicy(
        id,
        version,
      );

    if (
      policy.status !==
      "draft"
    ) {
      throw new Error(
        `canonical_review_policy_cannot_activate:${policy.status}`,
      );
    }

    const timestamp =
      now(
        decision.timestamp,
      );

    const activated = {
      ...policy,

      status:
        "active" as const,

      authorizedBy:
        required(
          decision.actorId,
          "authorizer",
        ),

      authorizedAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    saveCanonicalReviewPolicy(
      activated,
    );

    return activated;
  }

  revoke(
    id:
      string,

    version:
      string,

    decision:
      PolicyAuthorityDecision,
  ):
    CanonicalReviewPolicyAuthority {
    const policy =
      this.requirePolicy(
        id,
        version,
      );

    if (
      policy.status !==
      "active"
    ) {
      throw new Error(
        `canonical_review_policy_cannot_revoke:${policy.status}`,
      );
    }

    required(
      decision.actorId,
      "revoker",
    );

    const revoked = {
      ...policy,

      status:
        "revoked" as const,

      updatedAt:
        now(
          decision.timestamp,
        ),
    };

    saveCanonicalReviewPolicy(
      revoked,
    );

    return revoked;
  }

  supersede(
    id:
      string,

    version:
      string,

    replacement:
      CreateCanonicalReviewPolicyInput,

    decision:
      PolicyAuthorityDecision,
  ): {
    previous:
      CanonicalReviewPolicyAuthority;

    replacement:
      CanonicalReviewPolicyAuthority;
  } {
    const previous =
      this.requirePolicy(
        id,
        version,
      );

    if (
      previous.status !==
      "active"
    ) {
      throw new Error(
        `canonical_review_policy_cannot_supersede:${previous.status}`,
      );
    }

    if (
      replacement.id !==
      previous.id
    ) {
      throw new Error(
        "canonical_review_policy_supersession_id_mismatch",
      );
    }

    const actorId =
      required(
        decision.actorId,
        "authorizer",
      );

    const next =
      this.createDraft(
        replacement,
      );

    const timestamp =
      now(
        decision.timestamp,
      );

    const activatedReplacement = {
      ...next,

      status:
        "active" as const,

      authorizedBy:
        actorId,

      authorizedAt:
        timestamp,

      updatedAt:
        timestamp,

      supersedes: [
        ...next.supersedes,
        `${previous.id}@${previous.version}`,
      ],
    };

    const supersededPrevious = {
      ...previous,

      status:
        "superseded" as const,

      supersededBy:
        `${activatedReplacement.id}@${activatedReplacement.version}`,

      updatedAt:
        timestamp,
    };

    saveCanonicalReviewPolicy(
      activatedReplacement,
    );

    saveCanonicalReviewPolicy(
      supersededPrevious,
    );

    return {
      previous:
        supersededPrevious,

      replacement:
        activatedReplacement,
    };
  }

  private requirePolicy(
    id:
      string,

    version:
      string,
  ):
    CanonicalReviewPolicyAuthority {
    const policy =
      loadCanonicalReviewPolicy(
        id,
        version,
      );

    if (
      !policy
    ) {
      throw new Error(
        `canonical_review_policy_not_found:${id}@${version}`,
      );
    }

    return policy;
  }
}
