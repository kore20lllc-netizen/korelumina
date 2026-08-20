import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisHistoricalCorrelationState,
} from "../GenesisHistoricalCorrelation.js";

import type {
  GenesisReplayInventory,
} from "../GenesisReplayInventoryService.js";

import {
  buildGenesisOperationalProjection,
} from "../GenesisOperationalProjection.js";

const replayId =
  `genesis-replay:${"a".repeat(
    64,
  )}` as const;

function inventory():
  GenesisReplayInventory {
  return {
    total:
      1,

    replayIds: [
      replayId,
    ],

    replays: [
      {
        replayId,

        found:
          true,

        manifestPresent:
          true,

        executionPresent:
          true,

        manifestId:
          "genesis-manifest:fixture",

        manifestReadiness:
          "READY",

        manifestErrors:
          0,

        totalManifestSources:
          0,

        executionStatus:
          "completed",

        corpusStatus:
          "COMPLETE",

        currentManifestIndex:
          null,

        currentHistoricalSourceId:
          null,

        lastCompletedManifestIndex:
          null,

        progress:
          null,

        checkpoint:
          null,

        runnerOutcome:
          "COMPLETED",

        runnerFailure:
          null,

        recovery: {
          eligible:
            false,

          reason:
            "ALREADY_COMPLETED",
        },

        admittedEvidenceIds:
          [],

        admissionLinks:
          [],

        allAdmittedEvidenceLinked:
          true,
      },
    ],
  };
}

function correlation():
  GenesisHistoricalCorrelationState {
  return {
    sourceReferences:
      [],

    events:
      [],

    relationships:
      [],

    episodes:
      [],
  };
}

function build() {
  return buildGenesisOperationalProjection({
    replayId,

    replayInventory:
      inventory(),

    correlation:
      correlation(),

    manifestEntries:
      [],

    manufacturingRuns:
      [],

    organizationalMemory:
      [],

    readinessPolicy: {
      policyId:
        "genesis-operational:test",

      requiredSourceClasses: [
        "architecture-document",
        "commit",
        "conversation",
      ],
    },
  });
}

test(
  "operational projection preserves requested replay identity",
  () => {
    assert.equal(
      build().replayId,
      replayId,
    );
  },
);

test(
  "operational projection composes certified Corpus",
  () => {
    assert.match(
      build().corpus.projectionId,
      /^genesis-corpus-projection:/,
    );
  },
);

test(
  "operational projection composes certified chronology",
  () => {
    assert.match(
      build().chronology.projectionId,
      /^genesis-chronology:/,
    );
  },
);

test(
  "operational projection composes documentation governance",
  () => {
    assert.match(
      build()
        .documentationGovernance
        .projectionId,
      /^genesis-document-governance:/,
    );
  },
);

test(
  "operational projection composes Knowledge lifecycle correlation",
  () => {
    assert.match(
      build()
        .knowledgeLifecycle
        .projectionId,
      /^genesis-knowledge-lifecycle:/,
    );
  },
);

test(
  "operational projection composes readiness",
  () => {
    assert.match(
      build().readiness.projectionId,
      /^genesis-readiness:/,
    );
  },
);

test(
  "operational projection preserves certified conversation blocker",
  () => {
    assert.equal(
      build()
        .conversationSource
        .classification,
      "SOURCE ACCESS BLOCKED",
    );
  },
);

test(
  "conversation blocker does not block repository replay",
  () => {
    assert.equal(
      build()
        .conversationSource
        .repositoryReplayBlocked,
      false,
    );
  },
);

test(
  "operational projection does not infer educational readiness",
  () => {
    assert.equal(
      build()
        .readiness
        .education
        .state,
      "not-evaluated",
    );
  },
);

test(
  "operational projection remains incomplete while conversation is required",
  () => {
    const projection =
      build();

    assert.equal(
      projection.readiness.overall,
      "incomplete",
    );

    assert.ok(
      projection.readiness
        .sources
        .missingRequiredSourceClasses
        .includes(
          "conversation",
        ),
    );
  },
);

test(
  "operational projection identity is deterministic",
  () => {
    assert.equal(
      build().projectionId,
      build().projectionId,
    );
  },
);

test(
  "replay scope mismatch fails closed",
  () => {
    const bad =
      inventory();

    assert.throws(
      () =>
        buildGenesisOperationalProjection({
          replayId,

          replayInventory: {
            ...bad,

            total:
              0,

            replayIds:
              [],

            replays:
              [],
          },

          correlation:
            correlation(),

          manifestEntries:
            [],

          manufacturingRuns:
            [],

          organizationalMemory:
            [],

          readinessPolicy: {
            policyId:
              "genesis-operational:test",

            requiredSourceClasses:
              [],
          },
        }),
      /genesis_operational_projection_replay_scope_mismatch/,
    );
  },
);

test(
  "material child projection change changes operational projection identity",
  () => {
    const first =
      build();

    const second =
      buildGenesisOperationalProjection({
        replayId,

        replayInventory:
          inventory(),

        correlation: {
          ...correlation(),

          episodes: [
            {
              episodeId:
                `genesis-episode:${"b".repeat(
                  64,
                )}`,

              revisionId:
                `genesis-episode-revision:${"c".repeat(
                  64,
                )}`,

              episodeKey:
                "operational-projection-identity",

              title:
                "Changed historical episode",

              lifecycle:
                "incomplete",

              sourceReferenceIds:
                [],

              eventIds:
                [],

              relationshipIds:
                [],

              externalContext:
                "pending",

              temporalAuthority: {
                historical: {
                  status:
                    "historically-observed",
                },

                current: {
                  status:
                    "unknown",
                },
              },

              lineage: {
                mergedFrom:
                  [],

                supersedes:
                  [],
              },

              metadata:
                {},
            },
          ],
        },

        manifestEntries:
          [],

        manufacturingRuns:
          [],

        organizationalMemory:
          [],

        readinessPolicy: {
          policyId:
            "genesis-operational:test",

          requiredSourceClasses: [
            "architecture-document",
            "commit",
            "conversation",
          ],
        },
      });

    assert.notEqual(
      first.corpus.projectionId,
      second.corpus.projectionId,
    );

    assert.notEqual(
      first.projectionId,
      second.projectionId,
    );
  },
);

test(
  "operational projection rejects inventory containing another replay",
  () => {
    const otherReplayId =
      `genesis-replay:${"b".repeat(
        64,
      )}` as const;

    const base =
      inventory();

    assert.throws(
      () =>
        buildGenesisOperationalProjection({
          replayId,

          replayInventory: {
            total:
              2,

            replayIds: [
              replayId,
              otherReplayId,
            ],

            replays: [
              ...base.replays,

              {
                ...base.replays[0],

                replayId:
                  otherReplayId,
              },
            ],
          },

          correlation:
            correlation(),

          manifestEntries:
            [],

          manufacturingRuns:
            [],

          organizationalMemory:
            [],

          readinessPolicy: {
            policyId:
              "genesis-operational:test",

            requiredSourceClasses:
              [],
          },
        }),
      /genesis_operational_projection_replay_scope_mismatch/,
    );
  },
);

test(
  "conversation source blocker survives operational composition without blocking repository replay",
  () => {
    const projection =
      build();

    assert.equal(
      projection
        .conversationSource
        .classification,
      "SOURCE ACCESS BLOCKED",
    );

    assert.equal(
      projection
        .conversationSource
        .acquisition
        .available,
      false,
    );

    assert.equal(
      projection
        .conversationSource
        .repositoryReplayBlocked,
      false,
    );

    assert.equal(
      projection
        .conversationSource
        .conversationEvidenceMayBeSubstitutedByGit,
      false,
    );

    assert.equal(
      projection
        .conversationSource
        .externalSourceMarker,
      "EXTERNAL SOURCE — NOT YET INGESTED",
    );
  },
);

test(
  "runtime readiness policy conversation requirement remains visible through operational projection",
  () => {
    const projection =
      build();

    assert.ok(
      projection
        .readiness
        .sources
        .requiredSourceClasses
        .includes(
          "conversation",
        ),
    );

    assert.ok(
      projection
        .readiness
        .sources
        .missingRequiredSourceClasses
        .includes(
          "conversation",
        ),
    );

    assert.equal(
      projection
        .readiness
        .overall,
      "incomplete",
    );
  },
);

test(
  "operational projection preserves every certified child projection identity independently",
  () => {
    const projection =
      build();

    const identities = [
      projection
        .corpus
        .projectionId,

      projection
        .chronology
        .projectionId,

      projection
        .documentationGovernance
        .projectionId,

      projection
        .knowledgeLifecycle
        .projectionId,

      projection
        .readiness
        .projectionId,

      projection
        .conversationSource
        .projectionId,
    ];

    assert.equal(
      new Set(
        identities,
      ).size,
      identities.length,
    );
  },
);
