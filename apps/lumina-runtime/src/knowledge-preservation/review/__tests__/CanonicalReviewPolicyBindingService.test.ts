import assert from "node:assert/strict";
import test from "node:test";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import {
  KnowledgePackageService,
  saveKnowledgePackage,
} from "../../package/index.js";

import type {
  CanonicalReviewPolicyAuthority,
} from "../CanonicalReviewPolicyStore.js";

import {
  saveCanonicalReviewPolicy,
} from "../CanonicalReviewPolicyStore.js";

import {
  CanonicalReviewPolicyBindingService,
} from "../CanonicalReviewPolicyBindingService.js";

const suffix =
  `${Date.now()}-${process.pid}`;

function policy(
  id:
    string,

  overrides:
    Partial<
      CanonicalReviewPolicyAuthority
    > = {},
):
  CanonicalReviewPolicyAuthority {
  return {
    id,

    version:
      "1.0.0",

    status:
      "active",

    title:
      "Vision 2050 governed review policy",

    authority:
      "architecture",

    scope:
      "platform",

    owner:
      "Knowledge Governance",

    authorizedBy:
      "human:founder",

    authorizedAt:
      1000,

    createdAt:
      1000,

    updatedAt:
      1000,

    supersedes:
      [],

    supersededBy:
      null,

    rules: {
      requireCompleteGovernanceIdentity:
        true,

      requireProvenance:
        true,

      requireValidationPassed:
        true,

      excludedAuthorities:
        [],
    },

    ...overrides,
  };
}

function knowledgePackage(
  id:
    string,

  overrides:
    Partial<
      KnowledgePackage
    > = {},
):
  KnowledgePackage {
  return {
    id,

    state:
      "awaiting_review",

    sourceEvidenceRefs: [
      `evidence:${id}`,
    ],

    knowledgeItemIds: [
      `item:${id}`,
    ],

    items:
      [],

    provenance: {
      evidenceIds: [
        `evidence:${id}`,
      ],

      sourceLocations: [
        `docs/${id}.md`,
      ],

      contentRefs: [
        `content:${id}`,
      ],

      sources: [
        "repository",
      ],
    },

    authority:
      "architecture",

    approvalState:
      "pending_review",

    owner:
      "Knowledge Governance",

    scope:
      "platform",

    version:
      "1.0.0",

    confidence:
      1,

    dependencies:
      [],

    lineage:
      [],

    supersession: {
      supersedes:
        [],

      supersededBy:
        [],
    },

    destination:
      null,

    validationResults: [
      {
        itemId:
          `item:${id}`,

        status:
          "approved",

        confidence:
          1,

        blocked:
          false,

        details:
          {},
      },
    ],

    compilerHistory:
      [],

    lifecycleHistory: [
      {
        state:
          "awaiting_review",

        at:
          1000,
      },
    ],

    remediation: {
      required:
        false,

      status:
        "not_required",

      blockedItemIds:
        [],

      updatedAt:
        1000,
    },

    createdAt:
      1000,

    updatedAt:
      1000,

    metadata:
      {},

    ...overrides,
  };
}

function bind(
  knowledgePackage:
    KnowledgePackage,

  governedPolicy:
    CanonicalReviewPolicyAuthority,
) {
  saveCanonicalReviewPolicy(
    governedPolicy,
  );

  saveKnowledgePackage(
    knowledgePackage,
  );

  return new CanonicalReviewPolicyBindingService(
    new KnowledgePackageService(),
  ).bind({
    packageId:
      knowledgePackage.id,

    policyId:
      governedPolicy.id,

    policyVersion:
      governedPolicy.version,

    boundBy:
      "runtime:policy-binding",

    boundAt:
      2000,
  });
}

test(
  "qualifying package binds exact active policy and becomes policy candidate without approval",
  () => {
    const governedPolicy =
      policy(
        `POLICY-BIND-${suffix}`,
      );

    const packageRecord =
      knowledgePackage(
        `PKG-BIND-${suffix}`,
      );

    const result =
      bind(
        packageRecord,
        governedPolicy,
      );

    assert.equal(
      result.disposition,
      "bound",
    );

    assert.equal(
      result.classification.mode,
      "policy_candidate",
    );

    assert.equal(
      result.classification.policyId,
      governedPolicy.id,
    );

    assert.equal(
      result.knowledgePackage.state,
      "awaiting_review",
    );

    assert.equal(
      result.knowledgePackage
        .approvalState,
      "pending_review",
    );

    assert.deepEqual(
      result.binding,
      {
        policyId:
          governedPolicy.id,

        policyVersion:
          "1.0.0",

        authorizedBy:
          "human:founder",

        authorizedAt:
          1000,

        boundBy:
          "runtime:policy-binding",

        boundAt:
          2000,
      },
    );
  },
);

test(
  "exact rebinding is idempotent",
  () => {
    const governedPolicy =
      policy(
        `POLICY-IDEMPOTENT-${suffix}`,
      );

    const packageRecord =
      knowledgePackage(
        `PKG-IDEMPOTENT-${suffix}`,
      );

    const first =
      bind(
        packageRecord,
        governedPolicy,
      );

    const second =
      new CanonicalReviewPolicyBindingService(
        new KnowledgePackageService(),
      ).bind({
        packageId:
          packageRecord.id,

        policyId:
          governedPolicy.id,

        policyVersion:
          governedPolicy.version,

        boundBy:
          "runtime:second-attempt",

        boundAt:
          3000,
      });

    assert.equal(
      first.disposition,
      "bound",
    );

    assert.equal(
      second.disposition,
      "already_bound",
    );

    assert.deepEqual(
      second.binding,
      first.binding,
    );
  },
);

test(
  "conflicting existing policy binding is rejected",
  () => {
    const governedPolicy =
      policy(
        `POLICY-CONFLICT-NEW-${suffix}`,
      );

    saveCanonicalReviewPolicy(
      governedPolicy,
    );

    const packageRecord =
      knowledgePackage(
        `PKG-CONFLICT-${suffix}`,
        {
          metadata: {
            canonicalReviewPolicy: {
              policyId:
                `POLICY-CONFLICT-OLD-${suffix}`,

              policyVersion:
                "1.0.0",

              authorizedBy:
                "human:previous",

              authorizedAt:
                500,

              boundBy:
                "runtime:previous",

              boundAt:
                600,
            },
          },
        },
      );

    saveKnowledgePackage(
      packageRecord,
    );

    assert.throws(
      () =>
        new CanonicalReviewPolicyBindingService(
          new KnowledgePackageService(),
        ).bind({
          packageId:
            packageRecord.id,

          policyId:
            governedPolicy.id,

          policyVersion:
            governedPolicy.version,

          boundBy:
            "runtime:test",
        }),
      /canonical_review_policy_binding_conflict:/,
    );
  },
);

test(
  "draft revoked and superseded policies cannot bind",
  () => {
    for (
      const status
      of [
        "draft",
        "revoked",
        "superseded",
      ] as const
    ) {
      const governedPolicy =
        policy(
          `POLICY-INACTIVE-${status}-${suffix}`,
          {
            status,

            authorizedBy:
              status ===
                "draft"
                ? ""
                : "human:founder",

            authorizedAt:
              status ===
                "draft"
                ? 0
                : 1000,
          },
        );

      const packageRecord =
        knowledgePackage(
          `PKG-INACTIVE-${status}-${suffix}`,
        );

      assert.throws(
        () =>
          bind(
            packageRecord,
            governedPolicy,
          ),
        new RegExp(
          `canonical_review_policy_binding_policy_not_active:${status}`,
        ),
      );
    }
  },
);

test(
  "authority and scope mismatch cannot bind",
  () => {
    const authorityPolicy =
      policy(
        `POLICY-AUTH-MISMATCH-${suffix}`,
        {
          authority:
            "operations",
        },
      );

    assert.throws(
      () =>
        bind(
          knowledgePackage(
            `PKG-AUTH-MISMATCH-${suffix}`,
          ),
          authorityPolicy,
        ),
      /canonical_review_policy_binding_authority_mismatch/,
    );

    const scopePolicy =
      policy(
        `POLICY-SCOPE-MISMATCH-${suffix}`,
        {
          scope:
            "workspace",
        },
      );

    assert.throws(
      () =>
        bind(
          knowledgePackage(
            `PKG-SCOPE-MISMATCH-${suffix}`,
          ),
          scopePolicy,
        ),
      /canonical_review_policy_binding_scope_mismatch/,
    );
  },
);

test(
  "constitutional authority cannot enter policy-governed binding",
  () => {
    const governedPolicy =
      policy(
        `POLICY-CONSTITUTIONAL-${suffix}`,
        {
          authority:
            "constitutional",
        },
      );

    assert.throws(
      () =>
        bind(
          knowledgePackage(
            `PKG-CONSTITUTIONAL-${suffix}`,
            {
              authority:
                "constitutional",
            },
          ),
          governedPolicy,
        ),
      /constitutional_authority_requires_individual_review/,
    );
  },
);

test(
  "incomplete governance identity cannot bind",
  () => {
    const governedPolicy =
      policy(
        `POLICY-GOVERNANCE-${suffix}`,
      );

    for (
      const overrides
      of [
        {
          authority:
            null,
        },
        {
          owner:
            null,
        },
        {
          scope:
            null,
        },
        {
          version:
            null,
        },
      ]
    ) {
      assert.throws(
        () =>
          bind(
            knowledgePackage(
              `PKG-GOVERNANCE-${Math.random()}-${suffix}`,
              overrides,
            ),
            governedPolicy,
          ),
        /canonical_review_policy_binding_governance_identity_incomplete/,
      );
    }
  },
);

test(
  "missing provenance cannot bind",
  () => {
    const governedPolicy =
      policy(
        `POLICY-PROVENANCE-${suffix}`,
      );

    const packageRecord =
      knowledgePackage(
        `PKG-PROVENANCE-${suffix}`,
        {
          sourceEvidenceRefs:
            [],

          provenance: {
            evidenceIds:
              [],

            sourceLocations:
              [],

            contentRefs:
              [],

            sources:
              [],
          },
        },
      );

    assert.throws(
      () =>
        bind(
          packageRecord,
          governedPolicy,
        ),
      /canonical_review_policy_binding_provenance_incomplete/,
    );
  },
);

test(
  "unresolved validation or remediation cannot bind",
  () => {
    const governedPolicy =
      policy(
        `POLICY-VALIDATION-${suffix}`,
      );

    const packageRecord =
      knowledgePackage(
        `PKG-VALIDATION-${suffix}`,
        {
          remediation: {
            required:
              true,

            status:
              "required",

            blockedItemIds: [
              "item:blocked",
            ],

            updatedAt:
              1000,
          },
        },
      );

    assert.throws(
      () =>
        bind(
          packageRecord,
          governedPolicy,
        ),
      /canonical_review_policy_binding_validation_not_passed/,
    );
  },
);

test(
  "excluded authority cannot bind",
  () => {
    const governedPolicy =
      policy(
        `POLICY-EXCLUDED-${suffix}`,
        {
          rules: {
            requireCompleteGovernanceIdentity:
              true,

            requireProvenance:
              true,

            requireValidationPassed:
              true,

            excludedAuthorities: [
              "architecture",
            ],
          },
        },
      );

    assert.throws(
      () =>
        bind(
          knowledgePackage(
            `PKG-EXCLUDED-${suffix}`,
          ),
          governedPolicy,
        ),
      /canonical_review_policy_binding_authority_excluded/,
    );
  },
);

test(
  "approved canonical rejected and remediation states cannot be newly bound",
  () => {
    const governedPolicy =
      policy(
        `POLICY-STATE-${suffix}`,
      );

    for (
      const [
        state,
        approvalState,
      ]
      of [
        [
          "approved",
          "approved",
        ],
        [
          "canonical",
          "approved",
        ],
        [
          "rejected",
          "rejected",
        ],
        [
          "validated",
          "remediation_required",
        ],
      ] as const
    ) {
      assert.throws(
        () =>
          bind(
            knowledgePackage(
              `PKG-STATE-${state}-${suffix}`,
              {
                state,
                approvalState,
              },
            ),
            governedPolicy,
          ),
        /canonical_review_policy_binding_package_not_awaiting_review/,
      );
    }
  },
);
