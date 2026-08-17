import assert from "node:assert/strict";
import test from "node:test";

import {
  CanonicalReviewPolicyAdministrationService,
} from "../CanonicalReviewPolicyAdministrationService.js";

import {
  loadCanonicalReviewPolicy,
  removeCanonicalReviewPolicyForTest,
  saveCanonicalReviewPolicy,
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


test(
  "unused never-authorized draft can be permanently deleted",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService({
        list:
          () => [],
      });

    const id =
      `POLICY-DELETE-${Date.now()}-A`;

    try {
      service.createDraft(
        input(
          id,
          "1.0.0",
        ),
      );

      const deleted =
        service.deleteDraft(
          id,
          "1.0.0",
          {
            actorId:
              "human:knowledge-governance",
          },
        );

      assert.deepEqual(
        deleted,
        {
          id,
          version:
            "1.0.0",
        },
      );

      assert.equal(
        loadCanonicalReviewPolicy(
          id,
          "1.0.0",
        ),
        null,
      );

      assert.equal(
        "packageDecision" in
          deleted,
        false,
      );

      assert.equal(
        "promotion" in
          deleted,
        false,
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
  "active policy cannot be deleted",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService({
        list:
          () => [],
      });

    const id =
      `POLICY-DELETE-${Date.now()}-B`;

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

      assert.throws(
        () =>
          service.deleteDraft(
            id,
            "1.0.0",
            {
              actorId:
                "human:knowledge-governance",
            },
          ),
        /cannot_delete:active/,
      );

      assert.equal(
        loadCanonicalReviewPolicy(
          id,
          "1.0.0",
        )?.status,
        "active",
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
  "revoked policy cannot be deleted",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService({
        list:
          () => [],
      });

    const id =
      `POLICY-DELETE-${Date.now()}-C`;

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

      service.revoke(
        id,
        "1.0.0",
        {
          actorId:
            "human:knowledge-governance",
        },
      );

      assert.throws(
        () =>
          service.deleteDraft(
            id,
            "1.0.0",
            {
              actorId:
                "human:knowledge-governance",
            },
          ),
        /cannot_delete:revoked/,
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
  "superseded policy cannot be deleted",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService({
        list:
          () => [],
      });

    const id =
      `POLICY-DELETE-${Date.now()}-D`;

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
        },
      );

      assert.throws(
        () =>
          service.deleteDraft(
            id,
            "1.0.0",
            {
              actorId:
                "human:knowledge-governance",
            },
          ),
        /cannot_delete:superseded/,
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

test(
  "authorized draft cannot be deleted",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService({
        list:
          () => [],
      });

    const id =
      `POLICY-DELETE-${Date.now()}-E`;

    try {
      const draft =
        service.createDraft(
          input(
            id,
            "1.0.0",
          ),
        );

      saveCanonicalReviewPolicy({
        ...draft,

        authorizedBy:
          "human:historical-authorizer",

        authorizedAt:
          1000,
      });

      assert.throws(
        () =>
          service.deleteDraft(
            id,
            "1.0.0",
            {
              actorId:
                "human:knowledge-governance",
            },
          ),
        /cannot_delete:authorized/,
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
  "policy referenced by a Knowledge Package cannot be deleted",
  () => {
    const id =
      `POLICY-DELETE-${Date.now()}-F`;

    const service =
      new CanonicalReviewPolicyAdministrationService({
        list:
          () => [
            {
              metadata: {
                canonicalReviewPolicy: {
                  policyId:
                    id,

                  policyVersion:
                    "1.0.0",
                },
              },
            },
          ],
      });

    try {
      service.createDraft(
        input(
          id,
          "1.0.0",
        ),
      );

      assert.throws(
        () =>
          service.deleteDraft(
            id,
            "1.0.0",
            {
              actorId:
                "human:knowledge-governance",
            },
          ),
        /cannot_delete:package_reference/,
      );

      assert.notEqual(
        loadCanonicalReviewPolicy(
          id,
          "1.0.0",
        ),
        null,
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
  "deleting one version does not delete another version",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService({
        list:
          () => [],
      });

    const id =
      `POLICY-DELETE-${Date.now()}-G`;

    try {
      service.createDraft(
        input(
          id,
          "1.0.0",
        ),
      );

      service.createDraft(
        input(
          id,
          "2.0.0",
        ),
      );

      service.deleteDraft(
        id,
        "1.0.0",
        {
          actorId:
            "human:knowledge-governance",
        },
      );

      assert.equal(
        loadCanonicalReviewPolicy(
          id,
          "1.0.0",
        ),
        null,
      );

      assert.equal(
        loadCanonicalReviewPolicy(
          id,
          "2.0.0",
        )?.status,
        "draft",
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

test(
  "draft participating in supersession lineage cannot be deleted",
  () => {
    const service =
      new CanonicalReviewPolicyAdministrationService({
        list:
          () => [],
      });

    const id =
      `POLICY-DELETE-${Date.now()}-H`;

    try {
      const draft =
        service.createDraft(
          input(
            id,
            "2.0.0",
          ),
        );

      saveCanonicalReviewPolicy({
        ...draft,

        supersedes: [
          `${id}@1.0.0`,
        ],
      });

      assert.throws(
        () =>
          service.deleteDraft(
            id,
            "2.0.0",
            {
              actorId:
                "human:knowledge-governance",
            },
          ),
        /cannot_delete:supersession_lineage/,
      );
    } finally {
      removeCanonicalReviewPolicyForTest(
        id,
        "2.0.0",
      );
    }
  },
);
