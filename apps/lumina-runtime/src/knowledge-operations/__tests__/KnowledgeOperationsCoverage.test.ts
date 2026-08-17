import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgeOperationsService,
} from "../KnowledgeOperationsService.js";

import type {
  KnowledgeOperationsRuntimeTruth,
} from "../KnowledgeOperationsService.js";

function item(
  input: {
    id:
      string;

    evidenceId:
      string;

    evidenceSourceType:
      "document"
      | "commit"
      | "conversation";
  },
) {
  return {
    id:
      input.id,

    title:
      input.id,

    evidenceRefs: [
      input.evidenceId,
    ],

    compiler: {
      evidenceSourceType:
        input.evidenceSourceType,
    },

    metadata: {
      source:
        "repository",

      sourceLocation:
        "package.json",

      contentRef:
        "package.json",
    },
  };
}

function knowledgePackage(
  input: {
    id:
      string;

    evidenceIds:
      string[];

    items:
      ReturnType<
        typeof item
      >[];
  },
) {
  return {
    id:
      input.id,

    sourceEvidenceRefs:
      input.evidenceIds,

    knowledgeItemIds:
      input.items.map(
        (candidate) =>
          candidate.id,
      ),

    items:
      input.items,

    provenance: {
      evidenceIds:
        input.evidenceIds,

      sourceLocations: [
        "package.json",
      ],

      contentRefs: [
        "package.json",
      ],

      sources: [
        "repository",
      ],
    },
  };
}

function runtimeTruth():
KnowledgeOperationsRuntimeTruth {
  const packages =
    [
      knowledgePackage({
        id:
          "KP-1",

        evidenceIds: [
          "E-doc",
          "E-commit",
          "E-conversation",
        ],

        items: [
          item({
            id:
              "IR-doc",

            evidenceId:
              "E-doc",

            evidenceSourceType:
              "document",
          }),

          item({
            id:
              "IR-commit",

            evidenceId:
              "E-commit",

            evidenceSourceType:
              "commit",
          }),

          item({
            id:
              "IR-conversation",

            evidenceId:
              "E-conversation",

            evidenceSourceType:
              "conversation",
          }),
        ],
      }),

      /*
       * The same evidence may legitimately generate more than
       * one Knowledge IR item. Coverage counts Evidence identity,
       * never the number of derived IR rows.
       */
      knowledgePackage({
        id:
          "KP-2",

        evidenceIds: [
          "E-doc",
        ],

        items: [
          item({
            id:
              "IR-doc-2",

            evidenceId:
              "E-doc",

            evidenceSourceType:
              "document",
          }),
        ],
      }),
    ];

  const manufacturingRuns =
    [
      {
        evidenceId:
          "E-doc",

        status:
          "completed",
      },

      {
        evidenceId:
          "E-commit",

        status:
          "completed",
      },

      {
        evidenceId:
          "E-conversation",

        status:
          "completed",
      },

      /*
       * This historical failed intake has no valid package/provenance.
       * Production admission must exclude it from operational truth.
       */
      {
        evidenceId:
          "E-failed",

        status:
          "failed",
      },
    ];

  return {
    packageService: {
      list:
        () =>
          packages,
    },

    manufacturingRunService: {
      list:
        () =>
          manufacturingRuns,
    },

    canonicalStore: {
      list:
        () =>
          [],
    },
  } as unknown as
    KnowledgeOperationsRuntimeTruth;
}

test(
  "source coverage is derived from unique production-admitted Evidence identities",
  () => {
    const snapshot =
      new KnowledgeOperationsService(
        runtimeTruth(),
      )
        .getSnapshot();

    /*
     * E-failed is intentionally excluded by the production
     * admission policy because it has no package/provenance.
     */
    assert.equal(
      snapshot.evidence.total,
      3,
    );

    assert.deepEqual(
      snapshot.evidence.byType,
      {
        document:
          1,

        commit:
          1,

        conversation:
          1,
      },
    );

    assert.equal(
      snapshot.coverage.documentation,
      1 / 3,
    );

    assert.equal(
      snapshot.coverage.git,
      1 / 3,
    );

    assert.equal(
      snapshot.coverage.conversations,
      1 / 3,
    );

    assert.equal(
      snapshot.coverage.runtime,
      0,
    );

    assert.equal(
      snapshot.coverage.issues,
      0,
    );

    assert.equal(
      snapshot.coverage.pullRequests,
      0,
    );
  },
);

test(
  "duplicate IR output cannot inflate production Evidence coverage",
  () => {
    const snapshot =
      new KnowledgeOperationsService(
        runtimeTruth(),
      )
        .getSnapshot();

    assert.equal(
      snapshot.evidence.byType
        .document,
      1,
    );

    assert.equal(
      snapshot.evidence.total,
      3,
    );
  },
);

test(
  "failed unpackaged Evidence cannot enter operational coverage denominator",
  () => {
    const snapshot =
      new KnowledgeOperationsService(
        runtimeTruth(),
      )
        .getSnapshot();

    assert.equal(
      snapshot.evidence.total,
      3,
    );

    assert.equal(
      Object.values(
        snapshot.evidence.byType,
      )
        .reduce(
          (
            total,
            value,
          ) =>
            total +
            value,
          0,
        ),
      3,
    );
  },
);
