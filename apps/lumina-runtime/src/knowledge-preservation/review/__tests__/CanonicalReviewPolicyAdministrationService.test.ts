import assert from "node:assert/strict";
import test from "node:test";

import {
  CanonicalReviewPolicyAdministrationService,
} from "../CanonicalReviewPolicyAdministrationService.js";

import {
  loadCanonicalReviewPolicy,
  removeCanonicalReviewPolicyForTest,
} from "../CanonicalReviewPolicyStore.js";

function input(
  id:
    string,

  version:
    string,
) {
  return {
    id,
    version,

    title:
      "Governed documentation review",

    authority:
      "architecture-specification",

    scope:
      "platform",

    owner:
      "Knowledge Governance",

    rules: {
      requireCompleteGovernanceIdentity:
        true,

      requireProvenance:
        true,

      requireValidationPassed:
        true,

      excludedAuthorities: [
        "constitutional",
      ],
    },
  };
}

test(
  "new policy is always persisted as draft",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService();

    const id =
      `POLICY-ADMIN-${Date.now()}-A`;

    try {
      const policy =
        service.createDraft(
          input(
            id,
            "1.0.0",
          ),
        );

      assert.equal(
        policy.status,
        "draft",
      );

      assert.equal(
        policy.authorizedBy,
        "",
      );

      assert.equal(
        policy.authorizedAt,
        0,
      );
    } finally {
      removeCanonicalReviewPolicyForTest(
        id,
        "1.0.0",
      );
    }
  },
);

test(
  "draft requires explicit human activation",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService();

    const id =
      `POLICY-ADMIN-${Date.now()}-B`;

    try {
      service.createDraft(
        input(
          id,
          "1.0.0",
        ),
      );

      const activated =
        service.activate(
          id,
          "1.0.0",
          {
            actorId:
              "human:knowledge-governance",

            timestamp:
              1000,
          },
        );

      assert.equal(
        activated.status,
        "active",
      );

      assert.equal(
        activated.authorizedBy,
        "human:knowledge-governance",
      );

      assert.equal(
        activated.authorizedAt,
        1000,
      );
    } finally {
      removeCanonicalReviewPolicyForTest(
        id,
        "1.0.0",
      );
    }
  },
);

test(
  "only active policy may be revoked",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService();

    const id =
      `POLICY-ADMIN-${Date.now()}-C`;

    try {
      service.createDraft(
        input(
          id,
          "1.0.0",
        ),
      );

      assert.throws(
        () =>
          service.revoke(
            id,
            "1.0.0",
            {
              actorId:
                "human:knowledge-governance",
            },
          ),
        /cannot_revoke:draft/,
      );

      service.activate(
        id,
        "1.0.0",
        {
          actorId:
            "human:knowledge-governance",
        },
      );

      const revoked =
        service.revoke(
          id,
          "1.0.0",
          {
            actorId:
              "human:knowledge-governance",
          },
        );

      assert.equal(
        revoked.status,
        "revoked",
      );
    } finally {
      removeCanonicalReviewPolicyForTest(
        id,
        "1.0.0",
      );
    }
  },
);

test(
  "supersession preserves both policy versions and lineage",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService();

    const id =
      `POLICY-ADMIN-${Date.now()}-D`;

    try {
      service.createDraft(
        input(
          id,
          "1.0.0",
        ),
      );

      service.activate(
        id,
        "1.0.0",
        {
          actorId:
            "human:knowledge-governance",
        },
      );

      const result =
        service.supersede(
          id,
          "1.0.0",
          input(
            id,
            "2.0.0",
          ),
          {
            actorId:
              "human:knowledge-governance",

            timestamp:
              2000,
          },
        );

      assert.equal(
        result.previous.status,
        "superseded",
      );

      assert.equal(
        result.previous.supersededBy,
        `${id}@2.0.0`,
      );

      assert.equal(
        result.replacement.status,
        "active",
      );

      assert.deepEqual(
        result.replacement.supersedes,
        [
          `${id}@1.0.0`,
        ],
      );

      assert.equal(
        loadCanonicalReviewPolicy(
          id,
          "1.0.0",
        )?.status,
        "superseded",
      );

      assert.equal(
        loadCanonicalReviewPolicy(
          id,
          "2.0.0",
        )?.status,
        "active",
      );
    } finally {
      removeCanonicalReviewPolicyForTest(
        id,
        "1.0.0",
      );

      removeCanonicalReviewPolicyForTest(
        id,
        "2.0.0",
      );
    }
  },
);
