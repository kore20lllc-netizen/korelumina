import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisCorpusReadModel,
} from "../GenesisCorpusReadModel.js";

import type {
  GenesisDocumentationGovernanceProjection,
} from "../GenesisDocumentationGovernance.js";

import type {
  GenesisKnowledgeLifecycleProjection,
} from "../GenesisKnowledgeLifecycleCorrelation.js";

import type {
  BuildGenesisReadinessInput,
} from "../GenesisReadiness.js";

import type {
  GenesisTemporalChronology,
} from "../GenesisTemporalChronology.js";

import {
  buildGenesisReadiness,
} from "../GenesisReadiness.js";

function corpus():
  GenesisCorpusReadModel {
  return {
    projectionId:
      "genesis-corpus-projection:fixture",

    sourceSummary: {
      uniqueSources:
        2,

      sourceRevisions:
        2,

      byClass: {
        "architecture-document":
          1,

        commit:
          1,
      },
    },

    evolutionSummary: {
      historicalEvents:
        2,

      relationships:
        1,

      evolutionEpisodes:
        1,

      conflictedEpisodes:
        0,

      incompleteEpisodes:
        0,

      validatedEpisodes:
        1,

      unresolvedRelationships:
        0,
    },

    knowledgeLifecycle: {
      admittedEvidence:
        1,

      manufacturingLinkedEvidence:
        1,

      ambiguousManufacturingLinks:
        0,

      packages:
        1,

      canonicalKnowledge:
        1,

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
          2,

        admittedEvidenceIds: [
          "evidence:1",
        ],

        manufacturingRunIds: [
          "manufacturing-run:1",
        ],

        packageIds: [
          "knowledge-package:1",
        ],

        canonicalKnowledgeIds: [
          "canonical:1",
        ],

        ambiguousManufacturingLinks:
          0,

        allAdmittedEvidenceLinked:
          true,
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

function chronology():
  GenesisTemporalChronology {
  return {
    projectionId:
      "genesis-chronology:fixture",

    corpusProjectionId:
      "genesis-corpus-projection:fixture",

    entries:
      [],

    authority: {
      historicallyAuthoritative:
        1,

      historicallyProposed:
        0,

      historicallyRejected:
        0,

      historicallyImplemented:
        1,

      historicallyValidated:
        0,

      historicallyObserved:
        0,

      historicalUnknown:
        0,

      currentlyAuthoritative:
        1,

      currentlyImplemented:
        1,

      currentlySuperseded:
        0,

      currentlyRetired:
        0,

      currentNotApplicable:
        0,

      currentUnknown:
        0,
    },

    coverage: {
      totalEvents:
        2,

      earliestOccurredAt:
        1,

      latestOccurredAt:
        2,

      equalTimestampGroups:
        [],

      sourceRevisionsWithoutHistoricalEvents:
        [],

      episodesWithExternalContextPending:
        [],

      conflictedEpisodes:
        [],

      unresolvedRelationshipIds:
        [],

      complete:
        true,
    },
  };
}

function governance():
  GenesisDocumentationGovernanceProjection {
  return {
    projectionId:
      "genesis-document-governance:fixture",

    documents:
      [],

    summary: {
      documents:
        1,

      governing:
        1,

      evidentiary:
        0,

      planning:
        0,

      proposals:
        0,

      historical:
        0,

      superseded:
        0,

      unresolved:
        0,

      missingScope:
        0,

      missingEffectivePeriod:
        0,
    },
  };
}

function lifecycle():
  GenesisKnowledgeLifecycleProjection {
  return {
    projectionId:
      "genesis-knowledge-lifecycle:fixture",

    corpusProjectionId:
      "genesis-corpus-projection:fixture",

    records: [
      {
        evidenceId:
          "evidence:1",

        manufacturingCorrelation:
          "correlated",

        manufacturingRunId:
          "manufacturing-run:1",

        matchingManufacturingRunIds: [
          "manufacturing-run:1",
        ],

        manufacturingStatus:
          "completed",

        currentStage:
          "Canonical Knowledge",

        knowledgeIR: {
          state:
            "completed",

          events:
            [],
        },

        validation: {
          state:
            "completed",

          events:
            [],
        },

        packageAssembly: {
          state:
            "completed",

          events:
            [],
        },

        canonicalReview: {
          state:
            "approved",

          events:
            [],
        },

        canonicalKnowledge: {
          state:
            "published",

          events:
            [],
        },

        packageId:
          "knowledge-package:1",

        canonicalKnowledgeIds: [
          "canonical:1",
        ],

        organizationalMemory: [
          {
            status:
              "correlated",

            memoryRecordIds: [
              "memory:1",
            ],

            adaptationValidated:
              true,
          },
        ],

        educationalEligibility: {
          status:
            "not-evaluated",

          eligible:
            null,
        },
      },
    ],

    summary: {
      admittedEvidence:
        1,

      manufacturingCorrelated:
        1,

      manufacturingAmbiguous:
        0,

      manufacturingUncorrelated:
        0,

      knowledgeIRReached:
        1,

      validated:
        1,

      packaged:
        1,

      awaitingCanonicalReview:
        0,

      canonical:
        1,

      memoryCorrelatedCanonicalItems:
        1,

      memoryAdaptationValidated:
        1,

      educationalEligibilityEvaluated:
        0,
    },
  };
}

function input():
  BuildGenesisReadinessInput {
  return {
    policy: {
      policyId:
        "genesis-readiness-policy:test",

      requiredSourceClasses: [
        "architecture-document",
        "commit",
      ],
    },

    corpus:
      corpus(),

    chronology:
      chronology(),

    documentationGovernance:
      governance(),

    knowledgeLifecycle:
      lifecycle(),
  };
}

test(
  "readiness does not manufacture a completion percentage",
  () => {
    assert.equal(
      buildGenesisReadiness(
        input(),
      ).completionPercentage,
      null,
    );
  },
);

test(
  "missing required source classes remain explicit",
  () => {
    const value =
      input();

    value.policy = {
      ...value.policy,

      requiredSourceClasses: [
        "architecture-document",
        "commit",
        "conversation",
      ],
    };

    const readiness =
      buildGenesisReadiness(
        value,
      );

    assert.deepEqual(
      readiness.sources
        .missingRequiredSourceClasses,
      [
        "conversation",
      ],
    );
  },
);

test(
  "required missing conversation prevents readiness",
  () => {
    const value =
      input();

    value.policy = {
      ...value.policy,

      requiredSourceClasses: [
        "architecture-document",
        "commit",
        "conversation",
      ],
    };

    const readiness =
      buildGenesisReadiness(
        value,
      );

    assert.equal(
      readiness.overall,
      "incomplete",
    );

    assert.ok(
      readiness.blockers.some(
        (
          item,
        ) =>
          item.code ===
          "external-conversation-not-ingested",
      ),
    );
  },
);

test(
  "external context pending remains explicit",
  () => {
    const value =
      input();

    value.corpus = {
      ...value.corpus,

      externalContext: {
        ...value.corpus
          .externalContext,

        pendingEpisodes:
          1,

        complete:
          false,
      },
    };

    const readiness =
      buildGenesisReadiness(
        value,
      );

    assert.equal(
      readiness.sources
        .pendingExternalContextEpisodes,
      1,
    );
  },
);

test(
  "exact replayed source count remains unavailable",
  () => {
    const readiness =
      buildGenesisReadiness(
        input(),
      );

    assert.equal(
      readiness.replay
        .sourcesReplayed,
      null,
    );

    assert.equal(
      readiness.replay
        .sourcesReplayedMeasurement,
      "unavailable",
    );
  },
);

test(
  "failed replay blocks readiness",
  () => {
    const value =
      input();

    value.corpus = {
      ...value.corpus,

      replays: [
        {
          ...value.corpus
            .replays[0],

          executionStatus:
            "failed",
        },
      ],
    };

    assert.equal(
      buildGenesisReadiness(
        value,
      ).overall,
      "blocked",
    );
  },
);

test(
  "chronology gap remains a blocker",
  () => {
    const value =
      input();

    value.chronology = {
      ...value.chronology,

      coverage: {
        ...value.chronology
          .coverage,

        sourceRevisionsWithoutHistoricalEvents: [
          "genesis-source-revision:gap",
        ],

        complete:
          false,
      },
    };

    const readiness =
      buildGenesisReadiness(
        value,
      );

    assert.ok(
      readiness.blockers.some(
        (
          item,
        ) =>
          item.code ===
          "chronology-gap",
      ),
    );
  },
);

test(
  "unresolved correlation remains explicit",
  () => {
    const value =
      input();

    value.chronology = {
      ...value.chronology,

      coverage: {
        ...value.chronology
          .coverage,

        unresolvedRelationshipIds: [
          "genesis-relationship:gap",
        ],

        complete:
          false,
      },
    };

    assert.equal(
      buildGenesisReadiness(
        value,
      ).chronology
        .unresolvedRelationships,
      1,
    );
  },
);

test(
  "documentation authority gaps remain explicit",
  () => {
    const value =
      input();

    value.documentationGovernance = {
      ...value
        .documentationGovernance,

      summary: {
        ...value
          .documentationGovernance
          .summary,

        unresolved:
          1,

        missingScope:
          1,

        missingEffectivePeriod:
          1,
      },
    };

    const readiness =
      buildGenesisReadiness(
        value,
      );

    assert.equal(
      readiness.authority.state,
      "partial",
    );
  },
);

test(
  "Evidence package canonical and memory counts remain distinct",
  () => {
    const readiness =
      buildGenesisReadiness(
        input(),
      );

    assert.equal(
      readiness.knowledge
        .evidenceAdmitted,
      1,
    );

    assert.equal(
      readiness.knowledge
        .packaged,
      1,
    );

    assert.equal(
      readiness.knowledge
        .canonical,
      1,
    );

    assert.equal(
      readiness.knowledge
        .memoryAdaptationValidated,
      1,
    );
  },
);

test(
  "pending Canonical Review remains separate from Canonical Knowledge",
  () => {
    const value =
      input();

    value.knowledgeLifecycle = {
      ...value
        .knowledgeLifecycle,

      summary: {
        ...value
          .knowledgeLifecycle
          .summary,

        awaitingCanonicalReview:
          1,

        canonical:
          0,
      },
    };

    const readiness =
      buildGenesisReadiness(
        value,
      );

    assert.equal(
      readiness.knowledge
        .awaitingCanonicalReview,
      1,
    );

    assert.equal(
      readiness.knowledge
        .canonical,
      0,
    );
  },
);

test(
  "memory adaptation does not imply educational eligibility",
  () => {
    const readiness =
      buildGenesisReadiness(
        input(),
      );

    assert.equal(
      readiness.knowledge
        .memoryAdaptationValidated,
      1,
    );

    assert.equal(
      readiness.education.state,
      "not-evaluated",
    );

    assert.equal(
      readiness.education
        .eligibleRecords,
      null,
    );
  },
);

test(
  "manufacturing ambiguity remains partial",
  () => {
    const value =
      input();

    value.knowledgeLifecycle = {
      ...value
        .knowledgeLifecycle,

      summary: {
        ...value
          .knowledgeLifecycle
          .summary,

        manufacturingCorrelated:
          0,

        manufacturingAmbiguous:
          1,
      },
    };

    assert.equal(
      buildGenesisReadiness(
        value,
      ).knowledge.state,
      "partial",
    );
  },
);

test(
  "knowledge manufacturing failure blocks readiness",
  () => {
    const value =
      input();

    value.knowledgeLifecycle = {
      ...value
        .knowledgeLifecycle,

      records: [
        {
          ...value
            .knowledgeLifecycle
            .records[0],

          manufacturingStatus:
            "failed",
        },
      ],
    };

    assert.equal(
      buildGenesisReadiness(
        value,
      ).overall,
      "blocked",
    );
  },
);

test(
  "educational eligibility prevents false readiness",
  () => {
    const readiness =
      buildGenesisReadiness(
        input(),
      );

    assert.equal(
      readiness.overall,
      "incomplete",
    );

    assert.ok(
      readiness.blockers.some(
        (
          item,
        ) =>
          item.code ===
          "educational-eligibility-not-evaluated",
      ),
    );
  },
);

test(
  "readiness projection identity is deterministic",
  () => {
    const value =
      input();

    assert.equal(
      buildGenesisReadiness(
        value,
      ).projectionId,
      buildGenesisReadiness(
        value,
      ).projectionId,
    );
  },
);

test(
  "required source policy ordering is deterministic",
  () => {
    const first =
      input();

    const second =
      input();

    second.policy = {
      ...second.policy,

      requiredSourceClasses: [
        "commit",
        "architecture-document",
      ],
    };

    const a =
      buildGenesisReadiness(
        first,
      );

    const b =
      buildGenesisReadiness(
        second,
      );

    assert.equal(
      a.projectionId,
      b.projectionId,
    );

    assert.deepEqual(
      a.sources,
      b.sources,
    );
  },
);

test(
  "material chronology change changes readiness identity",
  () => {
    const first =
      input();

    const second =
      input();

    second.chronology = {
      ...second.chronology,

      projectionId:
        "genesis-chronology:changed",

      coverage: {
        ...second.chronology
          .coverage,

        conflictedEpisodes: [
          "genesis-episode:conflict",
        ],

        complete:
          false,
      },
    };

    assert.notEqual(
      buildGenesisReadiness(
        first,
      ).projectionId,
      buildGenesisReadiness(
        second,
      ).projectionId,
    );
  },
);

test(
  "adding a required source class changes readiness without changing source history",
  () => {
    const first =
      input();

    const originalCorpus =
      first.corpus;

    const before =
      buildGenesisReadiness(
        first,
      );

    const second =
      input();

    second.policy = {
      ...second.policy,

      requiredSourceClasses: [
        ...second.policy
          .requiredSourceClasses,

        "conversation",
      ],
    };

    const after =
      buildGenesisReadiness(
        second,
      );

    assert.equal(
      before.sources
        .discoveredSourceRevisions,
      after.sources
        .discoveredSourceRevisions,
    );

    assert.deepEqual(
      second.corpus,
      originalCorpus,
    );

    assert.deepEqual(
      after.sources
        .missingRequiredSourceClasses,
      [
        "conversation",
      ],
    );

    assert.notEqual(
      before.projectionId,
      after.projectionId,
    );
  },
);

test(
  "clearing a chronology blocker changes readiness deterministically",
  () => {
    const blockedInput =
      input();

    blockedInput.chronology = {
      ...blockedInput.chronology,

      projectionId:
        "genesis-chronology:with-gap",

      coverage: {
        ...blockedInput
          .chronology
          .coverage,

        sourceRevisionsWithoutHistoricalEvents: [
          "genesis-source-revision:gap",
        ],

        complete:
          false,
      },
    };

    const withGap =
      buildGenesisReadiness(
        blockedInput,
      );

    const clearInput =
      input();

    const cleared =
      buildGenesisReadiness(
        clearInput,
      );

    assert.ok(
      withGap.blockers.some(
        (
          blocker,
        ) =>
          blocker.code ===
          "chronology-gap",
      ),
    );

    assert.equal(
      cleared.blockers.some(
        (
          blocker,
        ) =>
          blocker.code ===
          "chronology-gap",
      ),
      false,
    );

    assert.notEqual(
      withGap.projectionId,
      cleared.projectionId,
    );

    assert.equal(
      buildGenesisReadiness(
        clearInput,
      ).projectionId,
      cleared.projectionId,
    );
  },
);

test(
  "clearing documentation authority gaps changes readiness deterministically",
  () => {
    const gapInput =
      input();

    gapInput.documentationGovernance = {
      ...gapInput
        .documentationGovernance,

      projectionId:
        "genesis-document-governance:gap",

      summary: {
        ...gapInput
          .documentationGovernance
          .summary,

        unresolved:
          1,

        missingScope:
          1,

        missingEffectivePeriod:
          1,
      },
    };

    const withGap =
      buildGenesisReadiness(
        gapInput,
      );

    const clearInput =
      input();

    const cleared =
      buildGenesisReadiness(
        clearInput,
      );

    assert.equal(
      withGap.authority.state,
      "partial",
    );

    assert.equal(
      cleared.authority.state,
      "complete",
    );

    assert.notEqual(
      withGap.projectionId,
      cleared.projectionId,
    );
  },
);

test(
  "otherwise complete repository-native reconstruction cannot report ready while education is unevaluated",
  () => {
    const readiness =
      buildGenesisReadiness(
        input(),
      );

    assert.equal(
      readiness.sources.state,
      "complete",
    );

    assert.equal(
      readiness.chronology.state,
      "complete",
    );

    assert.equal(
      readiness.authority.state,
      "complete",
    );

    assert.equal(
      readiness.knowledge.state,
      "complete",
    );

    assert.equal(
      readiness.education.state,
      "not-evaluated",
    );

    assert.equal(
      readiness.overall,
      "incomplete",
    );

    assert.ok(
      readiness.blockers.some(
        (
          blocker,
        ) =>
          blocker.code ===
          "educational-eligibility-not-evaluated",
      ),
    );
  },
);

test(
  "otherwise complete reconstruction cannot report ready while exact replay coverage is unavailable",
  () => {
    const readiness =
      buildGenesisReadiness(
        input(),
      );

    assert.equal(
      readiness.replay
        .completedReplays,
      1,
    );

    assert.equal(
      readiness.replay
        .sourcesReplayed,
      null,
    );

    assert.equal(
      readiness.replay
        .sourcesReplayedMeasurement,
      "unavailable",
    );

    assert.equal(
      readiness.overall,
      "incomplete",
    );

    assert.ok(
      readiness.blockers.some(
        (
          blocker,
        ) =>
          blocker.code ===
          "replayed-source-count-unavailable",
      ),
    );
  },
);

test(
  "policy-required conversation coverage prevents ready state even when repository-native dimensions are complete",
  () => {
    const value =
      input();

    value.policy = {
      ...value.policy,

      requiredSourceClasses: [
        ...value.policy
          .requiredSourceClasses,

        "conversation",
      ],
    };

    const readiness =
      buildGenesisReadiness(
        value,
      );

    assert.equal(
      readiness.chronology.state,
      "complete",
    );

    assert.equal(
      readiness.authority.state,
      "complete",
    );

    assert.equal(
      readiness.knowledge.state,
      "complete",
    );

    assert.equal(
      readiness.overall,
      "incomplete",
    );

    assert.ok(
      readiness.sources
        .missingRequiredSourceClasses
        .includes(
          "conversation",
        ),
    );

    assert.ok(
      readiness.blockers.some(
        (
          blocker,
        ) =>
          blocker.code ===
          "external-conversation-not-ingested",
      ),
    );
  },
);

test(
  "readiness blockers use deterministic canonical ordering",
  () => {
    const value =
      input();

    value.policy = {
      ...value.policy,

      requiredSourceClasses: [
        ...value.policy
          .requiredSourceClasses,

        "conversation",
      ],
    };

    value.chronology = {
      ...value.chronology,

      coverage: {
        ...value.chronology
          .coverage,

        unresolvedRelationshipIds: [
          "genesis-relationship:gap",
        ],

        complete:
          false,
      },
    };

    value.documentationGovernance = {
      ...value
        .documentationGovernance,

      summary: {
        ...value
          .documentationGovernance
          .summary,

        unresolved:
          1,
      },
    };

    const readiness =
      buildGenesisReadiness(
        value,
      );

    const codes =
      readiness.blockers.map(
        (
          blocker,
        ) =>
          blocker.code,
      );

    assert.deepEqual(
      codes,
      [
        ...codes,
      ].sort(),
    );
  },
);
