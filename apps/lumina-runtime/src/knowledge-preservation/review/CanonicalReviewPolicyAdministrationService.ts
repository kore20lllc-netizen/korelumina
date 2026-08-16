import {
  loadCanonicalReviewPolicy,
  saveCanonicalReviewPolicy,
} from "./CanonicalReviewPolicyStore.js";

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
