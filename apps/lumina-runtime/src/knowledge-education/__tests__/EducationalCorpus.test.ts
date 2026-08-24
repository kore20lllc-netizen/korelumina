import assert from "node:assert/strict";
import test from "node:test";

import {
  assembleEducationalCorpus,
} from "../EducationalCorpus.js";

import type {
  EducationalArtifactProjection,
} from "../projection/index.js";

import type {
  EducationalCorpusSourceContract,
} from "../EducationalCorpusSourceContract.js";


function artifact(
  input: {
    id:
      string;

    kind:
      EducationalArtifactProjection[
        "kind"
      ];
  },
): EducationalArtifactProjection {
  return {
    id:
      input.id,

    title:
      input.id,

    kind:
      input.kind,

    category:
      "test-category",

    authorityClass:
      "governed-authority",

    approvalState:
      "approved",

    owner:
      "governance",

    scope:
      "platform",

    version:
      "1",

    provenance:
      `evidence:${input.id}`,

    source:
      "canonical-knowledge",

    sourceRefs: [
      `docs/${input.id}.md`,
    ],

    lineage:
      [],

    dependencies:
      [],

    supersession:
      "",

    educationalStatus:
      "completed",

    educationalImpact:
      `Learn ${input.id}`,

    relatedArtifacts:
      [],

    relatedKnowledgePackages:
      [],

    relatedCanonicalKnowledge: [
      input.id,
    ],

    relatedMemory:
      [],

    relatedMissions:
      [],

    relatedDecisions:
      [],

    authors:
      [],
  };
}


function sourceContract():
  EducationalCorpusSourceContract {
  return {
    contractId:
      "educational-corpus-source-contract:test",

    dayZeroCertificationId:
      "genesis-day-zero-certification:test",

    dayZeroCandidateId:
      "genesis-day-zero-certification-candidate:test",

    assessments: [
      {
        policyVersion:
          "educational-corpus-authority:v1",

        artifactId:
          "constitution",

        decision:
          "ELIGIBLE",

        learningRole:
          "CONSTITUTIONAL_CURRICULUM",

        dayZeroCertificationId:
          "genesis-day-zero-certification:test",

        authority: {
          authorityClass:
            "constitutional",

          approvalState:
            "approved",

          owner:
            "Constitutional Office",

          scope:
            "platform",

          version:
            "1",
        },

        reasons: [
          "educational-source-authority-complete",
        ],
      },

      {
        policyVersion:
          "educational-corpus-authority:v1",

        artifactId:
          "architecture",

        decision:
          "ELIGIBLE",

        learningRole:
          "GOVERNING_ARCHITECTURE",

        dayZeroCertificationId:
          "genesis-day-zero-certification:test",

        authority: {
          authorityClass:
            "governing-architecture",

          approvalState:
            "approved",

          owner:
            "Architecture",

          scope:
            "platform",

          version:
            "2",
        },

        reasons: [
          "educational-source-authority-complete",
        ],
      },

      {
        policyVersion:
          "educational-corpus-authority:v1",

        artifactId:
          "conversation",

        decision:
          "REQUIRES_AUTHORITY_REVIEW",

        learningRole:
          null,

        dayZeroCertificationId:
          "genesis-day-zero-certification:test",

        authority: {
          authorityClass:
            "conversation-evidence",

          approvalState:
            "approved",

          owner:
            "governance",

          scope:
            "platform",

          version:
            "1",
        },

        reasons: [
          "educational-learning-role-not-explicitly-resolved",
        ],
      },
    ],

    summary: {
      artifacts:
        3,

      eligible:
        2,

      requiresAuthorityReview:
        1,

      excluded:
        0,

      blocked:
        0,
    },

    unresolvedArtifactIds: [
      "conversation",
    ],

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,
  };
}


test(
  "assembles only explicitly eligible Educational Corpus items",
  () => {
    const corpus =
      assembleEducationalCorpus({
        artifacts: [
          artifact({
            id:
              "constitution",

            kind:
              "constitution",
          }),

          artifact({
            id:
              "architecture",

            kind:
              "architecture",
          }),

          artifact({
            id:
              "conversation",

            kind:
              "conversation",
          }),
        ],

        sourceContract:
          sourceContract(),
      });

    assert.equal(
      corpus.state,
      "ASSEMBLED",
    );

    assert.equal(
      corpus.items.length,
      2,
    );

    assert.equal(
      corpus.excluded.length,
      1,
    );

    assert.deepEqual(
      corpus.items.map(
        item =>
          item.learningRole,
      ),
      [
        "CONSTITUTIONAL_CURRICULUM",
        "GOVERNING_ARCHITECTURE",
      ],
    );
  },
);


test(
  "unresolved historical material remains visible and is not silently discarded",
  () => {
    const corpus =
      assembleEducationalCorpus({
        artifacts: [
          artifact({
            id:
              "constitution",

            kind:
              "constitution",
          }),

          artifact({
            id:
              "architecture",

            kind:
              "architecture",
          }),

          artifact({
            id:
              "conversation",

            kind:
              "conversation",
          }),
        ],

        sourceContract:
          sourceContract(),
      });

    assert.deepEqual(
      corpus.excluded,
      [
        {
          artifactId:
            "conversation",

          decision:
            "REQUIRES_AUTHORITY_REVIEW",

          reasons: [
            "educational-learning-role-not-explicitly-resolved",
          ],
        },
      ],
    );

    assert.equal(
      corpus.summary
        .unresolvedItems,
      1,
    );
  },
);


test(
  "assembly preserves source authority and provenance",
  () => {
    const corpus =
      assembleEducationalCorpus({
        artifacts: [
          artifact({
            id:
              "constitution",

            kind:
              "constitution",
          }),

          artifact({
            id:
              "architecture",

            kind:
              "architecture",
          }),

          artifact({
            id:
              "conversation",

            kind:
              "conversation",
          }),
        ],

        sourceContract:
          sourceContract(),
      });

    const constitutional =
      corpus.items.find(
        item =>
          item.artifactId ===
          "constitution",
      );

    assert.ok(
      constitutional,
    );

    assert.equal(
      constitutional.authority
        .authorityClass,
      "constitutional",
    );

    assert.deepEqual(
      constitutional.provenance
        .sourceRefs,
      [
        "docs/constitution.md",
      ],
    );
  },
);


test(
  "assembly is deterministic independent of artifact input ordering",
  () => {
    const artifacts = [
      artifact({
        id:
          "constitution",

        kind:
          "constitution",
      }),

      artifact({
        id:
          "architecture",

        kind:
          "architecture",
      }),

      artifact({
        id:
          "conversation",

        kind:
          "conversation",
      }),
    ];

    const first =
      assembleEducationalCorpus({
        artifacts,

        sourceContract:
          sourceContract(),
      });

    const second =
      assembleEducationalCorpus({
        artifacts: [
          ...artifacts,
        ].reverse(),

        sourceContract:
          sourceContract(),
      });

    assert.equal(
      first.corpusId,
      second.corpusId,
    );

    assert.deepEqual(
      first,
      second,
    );
  },
);


test(
  "assembly rejects duplicate artifact identities",
  () => {
    assert.throws(
      () =>
        assembleEducationalCorpus({
          artifacts: [
            artifact({
              id:
                "constitution",

              kind:
                "constitution",
            }),

            artifact({
              id:
                "constitution",

              kind:
                "constitution",
            }),

            artifact({
              id:
                "architecture",

              kind:
                "architecture",
            }),

            artifact({
              id:
                "conversation",

              kind:
                "conversation",
            }),
          ],

          sourceContract:
            sourceContract(),
        }),
      /duplicate_artifact_id/,
    );
  },
);


test(
  "assembly fails closed when source contract references a missing artifact",
  () => {
    assert.throws(
      () =>
        assembleEducationalCorpus({
          artifacts: [
            artifact({
              id:
                "constitution",

              kind:
                "constitution",
            }),

            artifact({
              id:
                "architecture",

              kind:
                "architecture",
            }),
          ],

          sourceContract:
            sourceContract(),
        }),
      /assessed_artifact_missing:conversation/,
    );
  },
);


test(
  "assembled corpus does not certify education competency or activation",
  () => {
    const corpus =
      assembleEducationalCorpus({
        artifacts: [
          artifact({
            id:
              "constitution",

            kind:
              "constitution",
          }),

          artifact({
            id:
              "architecture",

            kind:
              "architecture",
          }),

          artifact({
            id:
              "conversation",

            kind:
              "conversation",
          }),
        ],

        sourceContract:
          sourceContract(),
      });

    assert.equal(
      corpus.educationalCorpusCertified,
      false,
    );

    assert.equal(
      corpus.initialCompetencyCertified,
      false,
    );

    assert.equal(
      corpus.chiefAgentActivationAuthorized,
      false,
    );
  },
);
