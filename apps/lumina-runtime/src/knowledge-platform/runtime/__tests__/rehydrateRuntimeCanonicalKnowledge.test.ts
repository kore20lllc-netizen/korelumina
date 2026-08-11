import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgePlatform,
} from "../../KnowledgePlatform.js";

import {
  rehydrateRuntimeCanonicalKnowledge,
} from "../rehydrateRuntimeCanonicalKnowledge.js";

function createCanonicalPackage() {
  return {
    id:
      "knowledge-package:test",

    state:
      "canonical",

    sourceEvidenceRefs: [
      "evidence:test",
    ],

    items: [
      {
        id:
          "ir:test",

        type:
          "CandidateArtifact",

        title:
          "Test architecture",

        summary:
          "Canonical architecture.",

        confidence:
          1,

        evidenceRefs: [
          "evidence:test",
        ],

        relationships:
          {},

        metadata:
          {},

        compiler: {
          compilerName:
            "documentation-compiler",
        },

        createdAt:
          1,

        updatedAt:
          1,

        status:
          "validated",
      },
    ],

    createdAt:
      1,

    updatedAt:
      2,

    metadata: {
      review: {
        decision:
          "approved",

        reviewerId:
          "reviewer:test",

        reviewedAt:
          2,

        reason:
          "approved",
      },

      canonicalization: {
        canonicalizedAt:
          3,

        canonicalItemIds: [
          "canonical:ir:test",
        ],
      },
    },
  };
}

test(
  "rehydrates governed canonical knowledge from persisted canonical packages",
  () => {
    const platform =
      new KnowledgePlatform();

    const packageService = {
      list() {
        return [
          createCanonicalPackage(),
        ];
      },
    };

    const items =
      rehydrateRuntimeCanonicalKnowledge(
        platform,
        packageService as never,
      );

    assert.equal(
      items.length,
      1,
    );

    assert.equal(
      platform.store.size(),
      1,
    );

    const canonical =
      platform.store.get(
        "canonical:ir:test",
      );

    assert.ok(
      canonical,
    );

    assert.deepEqual(
      canonical.evidenceRefs,
      [
        "evidence:test",
      ],
    );

    assert.deepEqual(
      canonical.metadata
        .governance,
      {
        packageId:
          "knowledge-package:test",

        sourceEvidenceRefs: [
          "evidence:test",
        ],

        reviewDecision:
          "approved",

        reviewerId:
          "reviewer:test",

        reviewedAt:
          2,

        reviewReason:
          "approved",
      },
    );
  },
);

test(
  "ignores packages that are not canonically governed",
  () => {
    const platform =
      new KnowledgePlatform();

    const invalid =
      createCanonicalPackage();

    invalid.state =
      "approved";

    const packageService = {
      list() {
        return [
          invalid,
        ];
      },
    };

    const items =
      rehydrateRuntimeCanonicalKnowledge(
        platform,
        packageService as never,
      );

    assert.deepEqual(
      items,
      [],
    );

    assert.equal(
      platform.store.size(),
      0,
    );
  },
);
