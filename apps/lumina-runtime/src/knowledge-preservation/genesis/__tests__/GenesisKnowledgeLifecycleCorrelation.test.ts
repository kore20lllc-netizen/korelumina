import assert from "node:assert/strict";
import test from "node:test";

import type {
  OrganizationalMemoryRecord,
} from "../../../knowledge/organizational-memory/OrganizationalMemoryRecord.js";

import type {
  KnowledgeManufacturingRun,
} from "../../manufacturing/index.js";

import type {
  GenesisCorpusReadModel,
} from "../GenesisCorpusReadModel.js";

import {
  buildGenesisKnowledgeLifecycleCorrelation,
} from "../GenesisKnowledgeLifecycleCorrelation.js";

function corpus(
  evidenceIds:
    readonly string[] = [
      "evidence:1",
    ],
): GenesisCorpusReadModel {
  return {
    projectionId:
      "genesis-corpus-projection:fixture",

    sourceSummary: {
      uniqueSources:
        0,

      sourceRevisions:
        0,

      byClass:
        {},
    },

    evolutionSummary: {
      historicalEvents:
        0,

      relationships:
        0,

      evolutionEpisodes:
        0,

      conflictedEpisodes:
        0,

      incompleteEpisodes:
        0,

      validatedEpisodes:
        0,

      unresolvedRelationships:
        0,
    },

    knowledgeLifecycle: {
      admittedEvidence:
        evidenceIds.length,

      manufacturingLinkedEvidence:
        0,

      ambiguousManufacturingLinks:
        0,

      packages:
        0,

      canonicalKnowledge:
        0,

      organizationalMemory: {
        status:
          "not-correlated",

        adaptedRecords:
          null,
      },

      educationalEligibility: {
        status:
          "not-correlated",

        eligibleRecords:
          null,
      },
    },

    externalContext: {
      pendingEpisodes:
        0,

      notYetIngestedConversationSources:
        0,

      externalSourceReferences:
        0,

      complete:
        true,
    },

    replays: [
      {
        replayId:
          `genesis-replay:${"a".repeat(
            64,
          )}`,

        found:
          true,

        manifestId:
          "genesis-manifest:fixture",

        manifestReadiness:
          "READY",

        executionStatus:
          "completed",

        replayCorpusStatus:
          "COMPLETE",

        totalManifestSources:
          evidenceIds.length,

        progress: {
          totalSources:
            evidenceIds.length,

          completedSources:
            evidenceIds.length,

          admittedSources:
            evidenceIds.length,

          skippedSources:
            0,

          blockedSources:
            0,
        },

        admittedEvidenceIds:
          evidenceIds,

        manufacturingRunIds:
          [],

        packageIds:
          [],

        canonicalKnowledgeIds:
          [],

        ambiguousManufacturingLinks:
          0,

        allAdmittedEvidenceLinked:
          false,
      },
    ],

    sources:
      [],

    events:
      [],

    relationships:
      [],

    episodes:
      [],
  };
}

function run(
  overrides:
    Partial<
      KnowledgeManufacturingRun
    > = {},
): KnowledgeManufacturingRun {
  return {
    id:
      "manufacturing-run:1",

    evidenceId:
      "evidence:1",

    currentStage:
      "Canonical Knowledge",

    status:
      "completed",

    packageId:
      "knowledge-package:1",

    canonicalKnowledgeIds: [
      "canonical:1",
    ],

    stageHistory: [
      {
        stage:
          "Knowledge IR",

        outcome:
          "completed",

        at:
          1,
      },

      {
        stage:
          "Validation",

        outcome:
          "completed",

        at:
          2,
      },

      {
        stage:
          "Knowledge Package Assembly",

        outcome:
          "completed",

        at:
          3,
      },

      {
        stage:
          "Canonical Review",

        outcome:
          "approved",

        at:
          4,
      },

      {
        stage:
          "Canonical Knowledge",

        outcome:
          "published",

        at:
          5,
      },
    ],

    createdAt:
      1,

    updatedAt:
      5,

    ...overrides,
  };
}

function memory(
  overrides:
    Partial<
      OrganizationalMemoryRecord
    > = {},
): OrganizationalMemoryRecord {
  return {
    id:
      "memory:1",

    organizationId:
      "korelumina",

    title:
      "Canonical memory",

    summary:
      "Governed adaptation",

    source:
      "architecture",

    references:
      [],

    governance: {
      canonicalItemId:
        "canonical:1",

      packageId:
        "knowledge-package:1",

      provenanceRefs: [
        "evidence:1",
      ],

      lineage:
        [],

      dependencies:
        [],

      supersedes:
        [],

      trust: {
        canonical:
          true,

        humanApproved:
          true,

        adaptationValidated:
          true,
      },

      privacy: {
        generalized:
          true,

        customerSpecificContentRetained:
          false,
      },
    },

    createdAt:
      "2026-08-19T00:00:00.000Z",

    ...overrides,
  };
}

test(
  "admitted Evidence correlates to exactly one manufacturing run by evidence identity",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory:
          [],
      });

    const record =
      projection.records[0];

    assert.equal(
      record
        .manufacturingCorrelation,
      "correlated",
    );

    assert.equal(
      record
        .manufacturingRunId,
      "manufacturing-run:1",
    );
  },
);

test(
  "multiple manufacturing runs for one Evidence remain ambiguous",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run({
            id:
              "manufacturing-run:a",
          }),

          run({
            id:
              "manufacturing-run:b",
          }),
        ],

        organizationalMemory:
          [],
      });

    const record =
      projection.records[0];

    assert.equal(
      record
        .manufacturingCorrelation,
      "ambiguous",
    );

    assert.equal(
      record
        .manufacturingRunId,
      null,
    );

    assert.deepEqual(
      record
        .matchingManufacturingRunIds,
      [
        "manufacturing-run:a",
        "manufacturing-run:b",
      ],
    );
  },
);

test(
  "uncorrelated admitted Evidence remains visible",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns:
          [],

        organizationalMemory:
          [],
      });

    assert.equal(
      projection.records[0]
        .manufacturingCorrelation,
      "not-correlated",
    );
  },
);

test(
  "Knowledge IR state comes from manufacturing stage history",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory:
          [],
      });

    assert.equal(
      projection.records[0]
        .knowledgeIR
        .state,
      "completed",
    );
  },
);

test(
  "Validation state remains distinct from Knowledge Package state",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory:
          [],
      });

    assert.equal(
      projection.records[0]
        .validation
        .state,
      "completed",
    );

    assert.equal(
      projection.records[0]
        .packageId,
      "knowledge-package:1",
    );
  },
);

test(
  "Canonical Review remains distinct from Canonical Knowledge",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory:
          [],
      });

    const record =
      projection.records[0];

    assert.equal(
      record
        .canonicalReview
        .state,
      "approved",
    );

    assert.equal(
      record
        .canonicalKnowledge
        .state,
      "published",
    );

    assert.deepEqual(
      record
        .canonicalKnowledgeIds,
      [
        "canonical:1",
      ],
    );
  },
);

test(
  "awaiting Canonical Review does not become Canonical Knowledge",
  () => {
    const waiting =
      run({
        currentStage:
          "Canonical Review",

        status:
          "active",

        canonicalKnowledgeIds:
          [],

        stageHistory: [
          {
            stage:
              "Knowledge IR",

            outcome:
              "completed",

            at:
              1,
          },

          {
            stage:
              "Validation",

            outcome:
              "completed",

            at:
              2,
          },

          {
            stage:
              "Knowledge Package Assembly",

            outcome:
              "completed",

            at:
              3,
          },

          {
            stage:
              "Canonical Review",

            outcome:
              "awaiting_human_review",

            at:
              4,
          },
        ],
      });

    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          waiting,
        ],

        organizationalMemory:
          [],
      });

    const record =
      projection.records[0];

    assert.equal(
      record
        .canonicalReview
        .state,
      "awaiting-human-review",
    );

    assert.equal(
      record
        .canonicalKnowledgeIds
        .length,
      0,
    );
  },
);

test(
  "Canonical Knowledge correlates to Organizational Memory by canonical item identity",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory: [
          memory(),
        ],
      });

    assert.deepEqual(
      projection.records[0]
        .organizationalMemory[0]
        .memoryRecordIds,
      [
        "memory:1",
      ],
    );

    assert.equal(
      projection.records[0]
        .organizationalMemory[0]
        .status,
      "correlated",
    );
  },
);

test(
  "Organizational Memory adaptation validation is preserved independently",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory: [
          memory({
            governance: {
              ...memory()
                .governance!,

              trust: {
                ...memory()
                  .governance!
                  .trust,

                adaptationValidated:
                  false,
              },
            },
          }),
        ],
      });

    assert.equal(
      projection.records[0]
        .organizationalMemory[0]
        .adaptationValidated,
      false,
    );
  },
);

test(
  "multiple memory records for one canonical item remain ambiguous",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory: [
          memory({
            id:
              "memory:a",
          }),

          memory({
            id:
              "memory:b",
          }),
        ],
      });

    assert.equal(
      projection.records[0]
        .organizationalMemory[0]
        .status,
      "ambiguous",
    );
  },
);

test(
  "Canonical Knowledge without memory record remains not correlated",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory:
          [],
      });

    assert.equal(
      projection.records[0]
        .organizationalMemory[0]
        .status,
      "not-correlated",
    );
  },
);

test(
  "memory correlation does not imply educational eligibility",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory: [
          memory(),
        ],
      });

    assert.deepEqual(
      projection.records[0]
        .educationalEligibility,
      {
        status:
          "not-evaluated",

        eligible:
          null,
      },
    );

    assert.equal(
      projection.summary
        .educationalEligibilityEvaluated,
      0,
    );
  },
);

test(
  "failed manufacturing state remains inspectable",
  () => {
    const failed =
      run({
        currentStage:
          "Validation",

        status:
          "failed",

        packageId:
          undefined,

        canonicalKnowledgeIds:
          [],

        stageHistory: [
          {
            stage:
              "Knowledge IR",

            outcome:
              "completed",

            at:
              1,
          },

          {
            stage:
              "Validation",

            outcome:
              "failed",

            at:
              2,
          },
        ],
      });

    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          failed,
        ],

        organizationalMemory:
          [],
      });

    assert.equal(
      projection.records[0]
        .validation
        .state,
      "failed",
    );

    assert.equal(
      projection.records[0]
        .packageId,
      null,
    );
  },
);

test(
  "projection identity is deterministic",
  () => {
    const input = {
      corpus:
        corpus(),

      manufacturingRuns: [
        run(),
      ],

      organizationalMemory: [
        memory(),
      ],
    };

    assert.equal(
      buildGenesisKnowledgeLifecycleCorrelation(
        input,
      ).projectionId,

      buildGenesisKnowledgeLifecycleCorrelation(
        input,
      ).projectionId,
    );
  },
);

test(
  "equivalent manufacturing and memory ordering does not change projection",
  () => {
    const inputCorpus =
      corpus([
        "evidence:1",
        "evidence:2",
      ]);

    const runs = [
      run(),

      run({
        id:
          "manufacturing-run:2",

        evidenceId:
          "evidence:2",

        packageId:
          "knowledge-package:2",

        canonicalKnowledgeIds: [
          "canonical:2",
        ],
      }),
    ];

    const memories = [
      memory(),

      memory({
        id:
          "memory:2",

        governance: {
          ...memory()
            .governance!,

          canonicalItemId:
            "canonical:2",

          packageId:
            "knowledge-package:2",
        },
      }),
    ];

    const first =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          inputCorpus,

        manufacturingRuns:
          runs,

        organizationalMemory:
          memories,
      });

    const second =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          inputCorpus,

        manufacturingRuns: [
          ...runs,
        ].reverse(),

        organizationalMemory: [
          ...memories,
        ].reverse(),
      });

    assert.equal(
      first.projectionId,
      second.projectionId,
    );

    assert.deepEqual(
      first.records,
      second.records,
    );
  },
);

test(
  "memory adaptation validation changes projection without changing Canonical Knowledge identity",
  () => {
    const inputCorpus =
      corpus();

    const manufacturing =
      run();

    const unvalidatedMemory =
      memory({
        governance: {
          ...memory()
            .governance!,

          trust: {
            ...memory()
              .governance!
              .trust,

            adaptationValidated:
              false,
          },
        },
      });

    const validatedMemory =
      memory({
        governance: {
          ...memory()
            .governance!,

          trust: {
            ...memory()
              .governance!
              .trust,

            adaptationValidated:
              true,
          },
        },
      });

    const first =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          inputCorpus,

        manufacturingRuns: [
          manufacturing,
        ],

        organizationalMemory: [
          unvalidatedMemory,
        ],
      });

    const second =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          inputCorpus,

        manufacturingRuns: [
          manufacturing,
        ],

        organizationalMemory: [
          validatedMemory,
        ],
      });

    assert.deepEqual(
      first.records[0]
        .canonicalKnowledgeIds,
      [
        "canonical:1",
      ],
    );

    assert.deepEqual(
      second.records[0]
        .canonicalKnowledgeIds,
      [
        "canonical:1",
      ],
    );

    assert.equal(
      first.records[0]
        .organizationalMemory[0]
        .adaptationValidated,
      false,
    );

    assert.equal(
      second.records[0]
        .organizationalMemory[0]
        .adaptationValidated,
      true,
    );

    assert.notEqual(
      first.projectionId,
      second.projectionId,
    );
  },
);

test(
  "ambiguous manufacturing correlation does not leak package canonical or lifecycle state",
  () => {
    const firstRun =
      run({
        id:
          "manufacturing-run:a",

        packageId:
          "knowledge-package:a",

        canonicalKnowledgeIds: [
          "canonical:a",
        ],
      });

    const secondRun =
      run({
        id:
          "manufacturing-run:b",

        packageId:
          "knowledge-package:b",

        canonicalKnowledgeIds: [
          "canonical:b",
        ],
      });

    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          firstRun,
          secondRun,
        ],

        organizationalMemory: [
          memory({
            id:
              "memory:a",

            governance: {
              ...memory()
                .governance!,

              canonicalItemId:
                "canonical:a",

              packageId:
                "knowledge-package:a",
            },
          }),

          memory({
            id:
              "memory:b",

            governance: {
              ...memory()
                .governance!,

              canonicalItemId:
                "canonical:b",

              packageId:
                "knowledge-package:b",
            },
          }),
        ],
      });

    const record =
      projection.records[0];

    assert.equal(
      record
        .manufacturingCorrelation,
      "ambiguous",
    );

    assert.equal(
      record
        .manufacturingRunId,
      null,
    );

    assert.equal(
      record
        .manufacturingStatus,
      null,
    );

    assert.equal(
      record
        .currentStage,
      null,
    );

    assert.equal(
      record.packageId,
      null,
    );

    assert.deepEqual(
      record
        .canonicalKnowledgeIds,
      [],
    );

    assert.equal(
      record.knowledgeIR.state,
      "not-reached",
    );

    assert.equal(
      record.validation.state,
      "not-reached",
    );

    assert.equal(
      record.packageAssembly.state,
      "not-reached",
    );

    assert.equal(
      record.canonicalReview.state,
      "not-reached",
    );

    assert.equal(
      record.canonicalKnowledge.state,
      "not-reached",
    );

    assert.deepEqual(
      record
        .organizationalMemory,
      [],
    );
  },
);

test(
  "ambiguous Organizational Memory correlation does not imply validated adaptation",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory: [
          memory({
            id:
              "memory:a",

            governance: {
              ...memory()
                .governance!,

              trust: {
                ...memory()
                  .governance!
                  .trust,

                adaptationValidated:
                  true,
              },
            },
          }),

          memory({
            id:
              "memory:b",

            governance: {
              ...memory()
                .governance!,

              trust: {
                ...memory()
                  .governance!
                  .trust,

                adaptationValidated:
                  false,
              },
            },
          }),
        ],
      });

    const correlation =
      projection.records[0]
        .organizationalMemory[0];

    assert.equal(
      correlation.status,
      "ambiguous",
    );

    assert.equal(
      correlation.adaptationValidated,
      false,
    );
  },
);

test(
  "Canonical Knowledge memory adaptation and educational eligibility remain separate states",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory: [
          memory({
            governance: {
              ...memory()
                .governance!,

              trust: {
                ...memory()
                  .governance!
                  .trust,

                adaptationValidated:
                  true,
              },
            },
          }),
        ],
      });

    const record =
      projection.records[0];

    assert.deepEqual(
      record
        .canonicalKnowledgeIds,
      [
        "canonical:1",
      ],
    );

    assert.equal(
      record
        .organizationalMemory[0]
        .status,
      "correlated",
    );

    assert.equal(
      record
        .organizationalMemory[0]
        .adaptationValidated,
      true,
    );

    assert.deepEqual(
      record
        .educationalEligibility,
      {
        status:
          "not-evaluated",

        eligible:
          null,
      },
    );
  },
);

test(
  "memory canonical identity correlation does not silently validate conflicting package identity",
  () => {
    const projection =
      buildGenesisKnowledgeLifecycleCorrelation({
        corpus:
          corpus(),

        manufacturingRuns: [
          run(),
        ],

        organizationalMemory: [
          memory({
            governance: {
              ...memory()
                .governance!,

              canonicalItemId:
                "canonical:1",

              packageId:
                "knowledge-package:conflicting",
            },
          }),
        ],
      });

    /*
     * Milestone 35 correlates Memory by canonical identity only.
     * Package consistency is not yet certified by this projection.
     * The canonical correlation remains inspectable, but no new
     * package-validity conclusion is manufactured.
     */
    assert.equal(
      projection.records[0]
        .organizationalMemory[0]
        .status,
      "correlated",
    );

    assert.equal(
      projection.records[0]
        .packageId,
      "knowledge-package:1",
    );
  },
);
