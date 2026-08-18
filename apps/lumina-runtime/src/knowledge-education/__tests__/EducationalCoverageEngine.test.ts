import assert from "node:assert/strict";
import test from "node:test";

import {
  measureEducationalCoverage,
} from "../measurement/index.js";

import type {
  EducationalArtifactProjection,
} from "../projection/index.js";

function artifact(
  overrides:
    Partial<EducationalArtifactProjection>,
): EducationalArtifactProjection {
  return {
    id:
      "canonical:test",

    title:
      "Test Artifact",

    kind:
      "architecture",

    category:
      "Artifact",

    authorityClass:
      "governed",

    approvalState:
      "approved",

    owner:
      "KoreLumina",

    scope:
      "platform",

    version:
      "1",

    provenance:
      "evidence:test",

    source:
      "repository",

    sourceRefs:
      [],

    lineage:
      [],

    dependencies:
      [],

    supersession:
      "",

    educationalStatus:
      "completed",

    educationalImpact:
      "",

    relatedArtifacts:
      [],

    relatedKnowledgePackages:
      [],

    relatedCanonicalKnowledge:
      [],

    relatedMemory:
      [],

    relatedMissions:
      [],

    relatedDecisions:
      [],

    authors:
      [],

    ...overrides,
  };
}

test(
  "coverage is derived from satisfied governed requirements",
  () => {
    const result =
      measureEducationalCoverage(
        [
          artifact({
            id:
              "canonical:architecture",

            title:
              "KoreLumina Master Architecture",
          }),

          artifact({
            id:
              "canonical:constitution",

            title:
              "KoreLumina Platform Constitution",

            kind:
              "constitution",
          }),
        ],

        [
          {
            id:
              "architecture",

            description:
              "Architecture",

            match: {
              kinds: [
                "architecture",
              ],
            },
          },

          {
            id:
              "constitution",

            description:
              "Constitution",

            match: {
              titleIncludes: [
                "Platform Constitution",
              ],
            },
          },

          {
            id:
              "vision",

            description:
              "Vision",

            match: {
              titleIncludes: [
                "Vision 2050",
              ],
            },
          },
        ],
      );

    assert.equal(
      result.satisfiedCount,
      2,
    );

    assert.equal(
      result.requirementCount,
      3,
    );

    assert.equal(
      result.completion,
      67,
    );

    assert.deepEqual(
      result.missing,
      [
        "vision",
      ],
    );

    assert.equal(
      result.measurementVersion,
      "education-coverage-v1",
    );
  },
);

test(
  "empty curriculum requirements never manufacture progress",
  () => {
    const result =
      measureEducationalCoverage(
        [],
        [],
      );

    assert.equal(
      result.completion,
      0,
    );

    assert.equal(
      result.satisfiedCount,
      0,
    );

    assert.equal(
      result.requirementCount,
      0,
    );
  },
);

test(
  "missing governed corpus produces zero measured coverage",
  () => {
    const result =
      measureEducationalCoverage(
        [],
        [
          {
            id:
              "required",

            description:
              "Required governed knowledge",

            match: {
              titleIncludes: [
                "Required",
              ],
            },
          },
        ],
      );

    assert.equal(
      result.completion,
      0,
    );

    assert.deepEqual(
      result.missing,
      [
        "required",
      ],
    );
  },
);

test(
  "compound requirement criteria must all match the same artifact",
  () => {
    const result =
      measureEducationalCoverage(
        [
          artifact({
            id:
              "conversation:governance",

            title:
              "Governance Decisions",

            kind:
              "conversation",
          }),

          artifact({
            id:
              "architecture:operations",

            title:
              "Architecture Operations",

            kind:
              "architecture",
          }),
        ],

        [
          {
            id:
              "conversation:architecture",

            description:
              "Architectural conversation",

            match: {
              kinds: [
                "conversation",
              ],

              titleIncludes: [
                "architecture",
              ],
            },
          },

          {
            id:
              "conversation:governance",

            description:
              "Governance conversation",

            match: {
              kinds: [
                "conversation",
              ],

              titleIncludes: [
                "governance",
              ],
            },
          },
        ],
      );

    assert.equal(
      result.completion,
      50,
    );

    assert.deepEqual(
      result.satisfied,
      [
        "conversation:governance",
      ],
    );

    assert.deepEqual(
      result.missing,
      [
        "conversation:architecture",
      ],
    );
  },
);

test(
  "governed source identity resolves independently of presentation classification",
  () => {
    const result =
      measureEducationalCoverage(
        [
          artifact({
            id:
              "canonical:master-architecture",

            title:
              "KoreLumina Master Architecture",

            kind:
              "knowledge-operations",

            category:
              "Document",

            sourceRefs: [
              "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",
            ],
          }),
        ],

        [
          {
            id:
              "constitutional:governing-architecture",

            description:
              "Master Architecture",

            match: {
              sourceRefs: [
                "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",
              ],
            },
          },
        ],
      );

    assert.equal(
      result.completion,
      100,
    );

    assert.deepEqual(
      result.satisfied,
      [
        "constitutional:governing-architecture",
      ],
    );
  },
);

test(
  "legacy artifact without sourceRefs cannot crash coverage measurement",
  () => {
    const legacy =
      artifact({
        id:
          "canonical:legacy",

        title:
          "Legacy Architecture",

        kind:
          "architecture",
      });

    delete (
      legacy as Partial<
        EducationalArtifactProjection
      >
    ).sourceRefs;

    assert.doesNotThrow(
      () =>
        measureEducationalCoverage(
          [
            legacy,
          ],

          [
            {
              id:
                "governed-source",

              description:
                "Governed source identity",

              match: {
                sourceRefs: [
                  "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",
                ],
              },
            },
          ],
        ),
    );

    const result =
      measureEducationalCoverage(
        [
          legacy,
        ],

        [
          {
            id:
              "governed-source",

            description:
              "Governed source identity",

            match: {
              sourceRefs: [
                "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",
              ],
            },
          },
        ],
      );

    assert.equal(
      result.completion,
      0,
    );

    assert.deepEqual(
      result.missing,
      [
        "governed-source",
      ],
    );
  },
);

test(
  "absolute repository source path resolves governed source identity",
  () => {
    const result =
      measureEducationalCoverage(
        [
          artifact({
            id:
              "canonical:absolute-master-architecture",

            title:
              "KoreLumina Master Architecture",

            sourceRefs: [
              "/Users/example/dev/korelumina/docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",
            ],
          }),
        ],

        [
          {
            id:
              "constitutional:governing-architecture",

            description:
              "Master Architecture",

            match: {
              sourceRefs: [
                "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",
              ],
            },
          },
        ],
      );

    assert.equal(
      result.completion,
      100,
    );
  },
);

test(
  "legacy repository basename resolves the same governed document identity",
  () => {
    const result =
      measureEducationalCoverage(
        [
          artifact({
            id:
              "canonical:legacy-master-architecture",

            title:
              "KoreLumina Master Architecture",

            sourceRefs: [
              "KORELUMINA_MASTER_ARCHITECTURE.md",
            ],
          }),
        ],

        [
          {
            id:
              "constitutional:governing-architecture",

            description:
              "Master Architecture",

            match: {
              sourceRefs: [
                "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",
              ],
            },
          },
        ],
      );

    assert.equal(
      result.completion,
      100,
    );

    assert.deepEqual(
      result.satisfied,
      [
        "constitutional:governing-architecture",
      ],
    );
  },
);

test(
  "different source basename cannot satisfy governed source identity",
  () => {
    const result =
      measureEducationalCoverage(
        [
          artifact({
            id:
              "canonical:other-architecture",

            title:
              "Another Architecture",

            sourceRefs: [
              "OTHER_ARCHITECTURE.md",
            ],
          }),
        ],

        [
          {
            id:
              "constitutional:governing-architecture",

            description:
              "Master Architecture",

            match: {
              sourceRefs: [
                "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",
              ],
            },
          },
        ],
      );

    assert.equal(
      result.completion,
      0,
    );
  },
);
