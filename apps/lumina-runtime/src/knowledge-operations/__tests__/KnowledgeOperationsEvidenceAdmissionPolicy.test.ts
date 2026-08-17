import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKnowledgeOperationsEvidenceAdmission,
} from "../KnowledgeOperationsEvidenceAdmissionPolicy.js";

function basePackage(
  overrides:
    Record<string, unknown> = {},
) {
  return {
    id:
      "KP-production",

    provenance: {
      sourceLocations: [
        "package.json",
      ],

      contentRefs:
        [],

      sources: [
        "repository",
      ],
    },

    items: [
      {
        id:
          "IR-production",

        title:
          "Production source",

        evidenceRefs: [
          "evidence:production",
        ],

        compiler: {
          evidenceSourceType:
            "document",
        },

        metadata: {
          sourceLocation:
            "package.json",

          source:
            "repository",
        },
      },
    ],

    ...overrides,
  } as any;
}

test(
  "admits production evidence with valid provenance",
  () => {
    const result =
      evaluateKnowledgeOperationsEvidenceAdmission({
        evidenceId:
          "evidence:production",

        run:
          undefined,

        knowledgePackage:
          basePackage(),

        repositoryRoot:
          process.cwd(),
      });

    assert.equal(
      result.admitted,
      true,
    );

    assert.deepEqual(
      result.reasons,
      [],
    );
  },
);

test(
  "rejects explicit test evidence",
  () => {
    const knowledgePackage =
      basePackage();

    knowledgePackage
      .provenance
      .sourceLocations = [
        "docs/test.md",
      ];

    knowledgePackage
      .items[0]
      .metadata
      .sourceLocation =
        "docs/test.md";

    const result =
      evaluateKnowledgeOperationsEvidenceAdmission({
        evidenceId:
          "evidence:test",

        run:
          undefined,

        knowledgePackage,

        repositoryRoot:
          process.cwd(),
      });

    assert.equal(
      result.admitted,
      false,
    );

    assert.ok(
      result.reasons.includes(
        "non_production_marker",
      ),
    );
  },
);

test(
  "rejects evidence without provenance",
  () => {
    const knowledgePackage =
      basePackage();

    knowledgePackage.provenance = {
      sourceLocations: [],
      contentRefs: [],
      sources: [],
    };

    knowledgePackage
      .items[0]
      .metadata = {};

    const result =
      evaluateKnowledgeOperationsEvidenceAdmission({
        evidenceId:
          "evidence:missing-provenance",

        run:
          undefined,

        knowledgePackage,

        repositoryRoot:
          process.cwd(),
      });

    assert.equal(
      result.admitted,
      false,
    );

    assert.ok(
      result.reasons.includes(
        "provenance_missing",
      ),
    );
  },
);
