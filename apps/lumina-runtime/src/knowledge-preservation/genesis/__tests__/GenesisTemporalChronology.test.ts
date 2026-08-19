import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisCorpusReadModel,
} from "../GenesisCorpusReadModel.js";

import {
  buildGenesisTemporalChronology,
} from "../GenesisTemporalChronology.js";

import {
  createEvolutionEpisode,
  createHistoricalEvent,
  createHistoricalRelationship,
  createHistoricalSourceReference,
} from "../GenesisHistoricalCorrelation.js";

const authorityCurrent = {
  historical: {
    status:
      "historically-authoritative" as const,

    authorityClass:
      "architecture",

    approvalState:
      "approved",
  },

  current: {
    status:
      "currently-authoritative" as const,
  },
};

const authoritySuperseded = {
  historical: {
    status:
      "historically-authoritative" as const,

    authorityClass:
      "architecture",

    approvalState:
      "approved",
  },

  current: {
    status:
      "currently-superseded" as const,

    replacedBy:
      "architecture:v2",
  },
};

function source(
  key:
    string,
) {
  return createHistoricalSourceReference({
    sourceIdentity:
      `document:${key}`,

    sourceClass:
      "architecture-document",

    evidenceType:
      "document",

    sourceRevision:
      `${key}:v1`,

    provenance: {
      locator:
        `docs/${key}.md`,

      nativeId:
        key,

      repository:
        "kore20lllc-netizen/korelumina",

      externalSource:
        false,
    },

    integrity: {
      checksum:
        `${key}-checksum`,

      acquisitionState:
        "available",
    },

    metadata: {},
  });
}

function corpusFixture():
  GenesisCorpusReadModel {
  const sourceA =
    source(
      "architecture-v1",
    );

  const sourceB =
    source(
      "architecture-v2",
    );

  const sourceWithoutEvent =
    source(
      "unprojected-source",
    );

  const proposed =
    createHistoricalEvent({
      kind:
        "architecture-proposed",

      observationKey:
        "architecture:v1:proposed",

      occurredAt:
        1_000,

      sourceReferenceIds: [
        sourceA.sourceReferenceId,
      ],

      sourceRevisionIds: [
        sourceA.sourceRevisionId,
      ],

      summary:
        "Architecture V1 proposed",

      temporalAuthority:
        authoritySuperseded,

      metadata: {},
    });

  const approved =
    createHistoricalEvent({
      kind:
        "decision-approved",

      observationKey:
        "architecture:v1:approved",

      occurredAt:
        2_000,

      sourceReferenceIds: [
        sourceA.sourceReferenceId,
      ],

      sourceRevisionIds: [
        sourceA.sourceRevisionId,
      ],

      summary:
        "Architecture V1 approved",

      temporalAuthority:
        authoritySuperseded,

      metadata: {},
    });

  const replacement =
    createHistoricalEvent({
      kind:
        "replacement-implemented",

      observationKey:
        "architecture:v2:implemented",

      occurredAt:
        2_000,

      sourceReferenceIds: [
        sourceB.sourceReferenceId,
      ],

      sourceRevisionIds: [
        sourceB.sourceRevisionId,
      ],

      summary:
        "Architecture V2 replaced V1",

      temporalAuthority:
        authorityCurrent,

      metadata: {},
    });

  const chronological =
    createHistoricalRelationship({
      from: {
        kind:
          "event",

        id:
          proposed.eventId,
      },

      to: {
        kind:
          "event",

        id:
          approved.eventId,
      },

      type:
        "occurred_before",

      causal:
        false,

      confidence:
        "explicit",

      evidence: {
        mode:
          "temporal-order",

        confidence:
          "explicit",

        sourceReferenceIds: [
          sourceA.sourceReferenceId,
        ],

        assertions: [
          "proposal timestamp precedes approval timestamp",
        ],
      },
    });

  const supersession =
    createHistoricalRelationship({
      from: {
        kind:
          "event",

        id:
          approved.eventId,
      },

      to: {
        kind:
          "event",

        id:
          replacement.eventId,
      },

      type:
        "superseded_by",

      causal:
        false,

      confidence:
        "explicit",

      evidence: {
        mode:
          "governance-reference",

        confidence:
          "explicit",

        sourceReferenceIds: [
          sourceA.sourceReferenceId,
          sourceB.sourceReferenceId,
        ],

        assertions: [
          "Architecture V2 explicitly supersedes V1",
        ],
      },
    });

  const episode =
    createEvolutionEpisode({
      episodeKey:
        "architecture-evolution",

      title:
        "Architecture Evolution",

      lifecycle:
        "validated",

      eventIds: [
        proposed.eventId,
        approved.eventId,
        replacement.eventId,
      ],

      relationshipIds: [
        chronological.relationshipId,
        supersession.relationshipId,
      ],

      sourceReferenceIds: [
        sourceA.sourceReferenceId,
        sourceB.sourceReferenceId,
      ],

      externalContext:
        "not-required",

      temporalAuthority:
        authorityCurrent,

      lineage: {
        mergedFrom:
          [],

        supersedes:
          [],
      },

      metadata: {},
    });

  return {
    projectionId:
      "genesis-corpus-projection:fixture",

    sourceSummary: {
      uniqueSources:
        3,

      sourceRevisions:
        3,

      byClass: {
        "architecture-document":
          3,
      },
    },

    evolutionSummary: {
      historicalEvents:
        3,

      relationships:
        2,

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
        0,

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

    replays:
      [],

    sources: [
      {
        sourceReferenceId:
          sourceA.sourceReferenceId,

        sourceRevisionId:
          sourceA.sourceRevisionId,

        sourceIdentity:
          sourceA.sourceIdentity,

        sourceClass:
          sourceA.sourceClass,

        evidenceType:
          sourceA.evidenceType,

        externalSource:
          false,

        acquisitionState:
          "available",

        provenance:
          sourceA.provenance,

        eventIds: [
          proposed.eventId,
          approved.eventId,
        ],

        episodeIds: [
          episode.episodeId,
        ],

        metadata: {},
      },

      {
        sourceReferenceId:
          sourceB.sourceReferenceId,

        sourceRevisionId:
          sourceB.sourceRevisionId,

        sourceIdentity:
          sourceB.sourceIdentity,

        sourceClass:
          sourceB.sourceClass,

        evidenceType:
          sourceB.evidenceType,

        externalSource:
          false,

        acquisitionState:
          "available",

        provenance:
          sourceB.provenance,

        eventIds: [
          replacement.eventId,
        ],

        episodeIds: [
          episode.episodeId,
        ],

        metadata: {},
      },

      {
        sourceReferenceId:
          sourceWithoutEvent
            .sourceReferenceId,

        sourceRevisionId:
          sourceWithoutEvent
            .sourceRevisionId,

        sourceIdentity:
          sourceWithoutEvent
            .sourceIdentity,

        sourceClass:
          sourceWithoutEvent
            .sourceClass,

        evidenceType:
          sourceWithoutEvent
            .evidenceType,

        externalSource:
          false,

        acquisitionState:
          "available",

        provenance:
          sourceWithoutEvent
            .provenance,

        eventIds:
          [],

        episodeIds:
          [],

        metadata: {},
      },
    ],

    events: [
      replacement,
      proposed,
      approved,
    ],

    relationships: [
      supersession,
      chronological,
    ],

    episodes: [
      episode,
    ],
  };
}

test(
  "chronology orders events by occurredAt",
  () => {
    const chronology =
      buildGenesisTemporalChronology(
        corpusFixture(),
      );

    assert.equal(
      chronology.entries[0]
        .occurredAt,
      1_000,
    );

    assert.equal(
      chronology.entries[1]
        .occurredAt,
      2_000,
    );

    assert.equal(
      chronology.entries[2]
        .occurredAt,
      2_000,
    );
  },
);

test(
  "equal timestamps use deterministic event identity ordering",
  () => {
    const chronology =
      buildGenesisTemporalChronology(
        corpusFixture(),
      );

    const equal =
      chronology.entries
        .filter(
          (
            entry,
          ) =>
            entry.occurredAt ===
            2_000,
        );

    const expected =
      [
        ...equal,
      ]
        .map(
          (
            entry,
          ) =>
            entry.eventId,
        )
        .sort();

    assert.deepEqual(
      equal.map(
        (
          entry,
        ) =>
          entry.eventId,
      ),
      expected,
    );

    assert.equal(
      chronology
        .coverage
        .equalTimestampGroups
        .length,
      1,
    );
  },
);

test(
  "equal timestamp deterministic ordering does not imply causality",
  () => {
    const chronology =
      buildGenesisTemporalChronology(
        corpusFixture(),
      );

    const equal =
      chronology.entries
        .filter(
          (
            entry,
          ) =>
            entry.occurredAt ===
            2_000,
        );

    const relationshipIds =
      new Set(
        [
          ...equal[0]
            .outgoingRelationshipIds,

          ...equal[0]
            .incomingRelationshipIds,
        ],
      );

    const corpus =
      corpusFixture();

    const causalBetweenEqual =
      corpus.relationships
        .filter(
          (
            relationship,
          ) =>
            relationshipIds.has(
              relationship
                .relationshipId,
            ),
        )
        .some(
          (
            relationship,
          ) =>
            relationship.causal,
        );

    assert.equal(
      causalBetweenEqual,
      false,
    );
  },
);

test(
  "chronology preserves historical authority separately from current authority",
  () => {
    const chronology =
      buildGenesisTemporalChronology(
        corpusFixture(),
      );

    const superseded =
      chronology.entries.find(
        (
          entry,
        ) =>
          entry.summary ===
          "Architecture V1 approved",
      );

    assert.ok(
      superseded,
    );

    assert.equal(
      superseded
        .temporalAuthority
        .historical
        .status,
      "historically-authoritative",
    );

    assert.equal(
      superseded
        .temporalAuthority
        .current
        .status,
      "currently-superseded",
    );
  },
);

test(
  "superseded historical events remain inspectable",
  () => {
    const chronology =
      buildGenesisTemporalChronology(
        corpusFixture(),
      );

    assert.ok(
      chronology.entries.some(
        (
          entry,
        ) =>
          entry
            .temporalAuthority
            .current
            .status ===
          "currently-superseded",
      ),
    );

    assert.equal(
      chronology
        .authority
        .currentlySuperseded,
      2,
    );
  },
);

test(
  "chronology exposes source and Episode provenance",
  () => {
    const chronology =
      buildGenesisTemporalChronology(
        corpusFixture(),
      );

    for (
      const entry
      of chronology.entries
    ) {
      assert.ok(
        entry
          .sourceReferenceIds
          .length >
        0,
      );

      assert.ok(
        entry
          .sourceRevisionIds
          .length >
        0,
      );

      assert.equal(
        entry
          .episodeIds
          .length,
        1,
      );
    }
  },
);

test(
  "chronology only exposes explicit occurred_before neighbors",
  () => {
    const corpus =
      corpusFixture();

    const chronology =
      buildGenesisTemporalChronology(
        corpus,
      );

    const proposed =
      chronology.entries.find(
        (
          entry,
        ) =>
          entry.summary ===
          "Architecture V1 proposed",
      );

    const approved =
      chronology.entries.find(
        (
          entry,
        ) =>
          entry.summary ===
          "Architecture V1 approved",
      );

    assert.ok(
      proposed,
    );

    assert.ok(
      approved,
    );

    assert.deepEqual(
      proposed
        .chronologicalSuccessorEventIds,
      [
        approved.eventId,
      ],
    );

    assert.deepEqual(
      approved
        .chronologicalPredecessorEventIds,
      [
        proposed.eventId,
      ],
    );
  },
);

test(
  "non-chronological supersession relationship is preserved but not converted into chronological neighbor",
  () => {
    const chronology =
      buildGenesisTemporalChronology(
        corpusFixture(),
      );

    const approved =
      chronology.entries.find(
        (
          entry,
        ) =>
          entry.summary ===
          "Architecture V1 approved",
      );

    assert.ok(
      approved,
    );

    assert.equal(
      approved
        .chronologicalSuccessorEventIds
        .length,
      0,
    );

    assert.ok(
      approved
        .outgoingRelationshipIds
        .length >
      0,
    );
  },
);

test(
  "chronology reports source revisions with no Historical Event",
  () => {
    const chronology =
      buildGenesisTemporalChronology(
        corpusFixture(),
      );

    assert.equal(
      chronology
        .coverage
        .sourceRevisionsWithoutHistoricalEvents
        .length,
      1,
    );

    assert.equal(
      chronology
        .coverage
        .complete,
      false,
    );
  },
);

test(
  "external-context-pending Episode makes chronology coverage incomplete without blocking chronology",
  () => {
    const corpus =
      corpusFixture();

    const episode =
      corpus.episodes[0];

    const pendingEpisode = {
      ...episode,

      externalContext:
        "pending" as const,
    };

    const chronology =
      buildGenesisTemporalChronology({
        ...corpus,

        episodes: [
          pendingEpisode,
        ],
      });

    assert.equal(
      chronology.entries.length,
      3,
    );

    assert.deepEqual(
      chronology
        .coverage
        .episodesWithExternalContextPending,
      [
        episode.episodeId,
      ],
    );

    assert.equal(
      chronology
        .coverage
        .complete,
      false,
    );
  },
);

test(
  "conflicted Episode remains visible as chronology coverage gap",
  () => {
    const corpus =
      corpusFixture();

    const conflicted = {
      ...corpus.episodes[0],

      lifecycle:
        "conflicted" as const,
    };

    const chronology =
      buildGenesisTemporalChronology({
        ...corpus,

        episodes: [
          conflicted,
        ],
      });

    assert.deepEqual(
      chronology
        .coverage
        .conflictedEpisodes,
      [
        conflicted.episodeId,
      ],
    );
  },
);

test(
  "unresolved relationship remains visible as chronology coverage gap",
  () => {
    const corpus =
      corpusFixture();

    const relationship =
      corpus.relationships[0];

    const unresolved = {
      ...relationship,

      confidence:
        "unresolved" as const,

      evidence: {
        ...relationship.evidence,

        mode:
          "unresolved" as const,

        confidence:
          "unresolved" as const,
      },
    };

    const chronology =
      buildGenesisTemporalChronology({
        ...corpus,

        relationships: [
          unresolved,
          ...corpus.relationships.slice(
            1,
          ),
        ],
      });

    assert.deepEqual(
      chronology
        .coverage
        .unresolvedRelationshipIds,
      [
        unresolved
          .relationshipId,
      ],
    );

    assert.equal(
      chronology
        .coverage
        .complete,
      false,
    );
  },
);

test(
  "chronology projection identity is deterministic",
  () => {
    const corpus =
      corpusFixture();

    const first =
      buildGenesisTemporalChronology(
        corpus,
      );

    const second =
      buildGenesisTemporalChronology(
        corpus,
      );

    assert.equal(
      first.projectionId,
      second.projectionId,
    );
  },
);

test(
  "equivalent Corpus event and relationship ordering does not change chronology",
  () => {
    const corpus =
      corpusFixture();

    const first =
      buildGenesisTemporalChronology(
        corpus,
      );

    const second =
      buildGenesisTemporalChronology({
        ...corpus,

        events: [
          ...corpus.events,
        ].reverse(),

        relationships: [
          ...corpus.relationships,
        ].reverse(),

        episodes: [
          ...corpus.episodes,
        ].reverse(),

        sources: [
          ...corpus.sources,
        ].reverse(),
      });

    assert.equal(
      first.projectionId,
      second.projectionId,
    );

    assert.deepEqual(
      first.entries,
      second.entries,
    );
  },
);

test(
  "material event temporal authority change changes chronology projection identity",
  () => {
    const corpus =
      corpusFixture();

    const first =
      buildGenesisTemporalChronology(
        corpus,
      );

    const changedEvent = {
      ...corpus.events[0],

      temporalAuthority: {
        ...corpus.events[0]
          .temporalAuthority,

        current: {
          status:
            "currently-retired" as const,
        },
      },
    };

    const second =
      buildGenesisTemporalChronology({
        ...corpus,

        events: [
          changedEvent,
          ...corpus.events.slice(
            1,
          ),
        ],
      });

    assert.notEqual(
      first.projectionId,
      second.projectionId,
    );
  },
);

test(
  "chronology coverage is not Genesis completion or educational readiness",
  () => {
    const corpus =
      corpusFixture();

    const withoutGap = {
      ...corpus,

      sources:
        corpus.sources.filter(
          (
            sourceRecord,
          ) =>
            sourceRecord
              .eventIds
              .length >
            0,
        ),
    };

    const chronology =
      buildGenesisTemporalChronology(
        withoutGap,
      );

    assert.equal(
      chronology
        .coverage
        .complete,
      true,
    );

    assert.equal(
      corpus
        .knowledgeLifecycle
        .educationalEligibility
        .status,
      "not-correlated",
    );
  },
);

test(
  "current authority change does not move historical event position",
  () => {
    const corpus =
      corpusFixture();

    const first =
      buildGenesisTemporalChronology(
        corpus,
      );

    const target =
      corpus.events.find(
        (
          event,
        ) =>
          event.summary ===
          "Architecture V1 approved",
      );

    assert.ok(
      target,
    );

    const originalEntry =
      first.entries.find(
        (
          entry,
        ) =>
          entry.eventId ===
          target.eventId,
      );

    assert.ok(
      originalEntry,
    );

    const changedEvent = {
      ...target,

      temporalAuthority: {
        ...target
          .temporalAuthority,

        current: {
          status:
            "currently-retired" as const,
        },
      },
    };

    const second =
      buildGenesisTemporalChronology({
        ...corpus,

        events:
          corpus.events.map(
            (
              event,
            ) =>
              event.eventId ===
              target.eventId
                ? changedEvent
                : event,
          ),
      });

    const changedEntry =
      second.entries.find(
        (
          entry,
        ) =>
          entry.eventId ===
          target.eventId,
      );

    assert.ok(
      changedEntry,
    );

    assert.equal(
      changedEntry.position,
      originalEntry.position,
    );

    assert.equal(
      changedEntry.occurredAt,
      originalEntry.occurredAt,
    );

    assert.equal(
      changedEntry.eventId,
      originalEntry.eventId,
    );

    assert.notEqual(
      second.projectionId,
      first.projectionId,
    );
  },
);

test(
  "equivalent collection reordering preserves chronology positions and projection identity",
  () => {
    const corpus =
      corpusFixture();

    const first =
      buildGenesisTemporalChronology(
        corpus,
      );

    const reordered: GenesisCorpusReadModel = {
      ...corpus,

      replays: [
        ...corpus.replays,
      ].reverse(),

      sources: [
        ...corpus.sources,
      ].reverse(),

      events: [
        ...corpus.events,
      ].reverse(),

      relationships: [
        ...corpus.relationships,
      ].reverse(),

      episodes: [
        ...corpus.episodes,
      ].reverse(),
    };

    const second =
      buildGenesisTemporalChronology(
        reordered,
      );

    assert.equal(
      second.projectionId,
      first.projectionId,
    );

    assert.deepEqual(
      second.entries.map(
        (
          entry,
        ) => ({
          position:
            entry.position,

          eventId:
            entry.eventId,

          occurredAt:
            entry.occurredAt,
        }),
      ),
      first.entries.map(
        (
          entry,
        ) => ({
          position:
            entry.position,

          eventId:
            entry.eventId,

          occurredAt:
            entry.occurredAt,
        }),
      ),
    );

    assert.deepEqual(
      second.coverage,
      first.coverage,
    );

    assert.deepEqual(
      second.authority,
      first.authority,
    );
  },
);

test(
  "superseded event retains original chronology position after later authoritative replacement",
  () => {
    const chronology =
      buildGenesisTemporalChronology(
        corpusFixture(),
      );

    const oldEvent =
      chronology.entries.find(
        (
          entry,
        ) =>
          entry.summary ===
          "Architecture V1 approved",
      );

    const replacement =
      chronology.entries.find(
        (
          entry,
        ) =>
          entry.summary ===
          "Architecture V2 replaced V1",
      );

    assert.ok(
      oldEvent,
    );

    assert.ok(
      replacement,
    );

    assert.equal(
      oldEvent
        .temporalAuthority
        .current
        .status,
      "currently-superseded",
    );

    assert.equal(
      replacement
        .temporalAuthority
        .current
        .status,
      "currently-authoritative",
    );

    /*
     * They intentionally share the same occurredAt in this fixture.
     * Position is therefore determined only by stable Event identity,
     * not by present-day authority.
     */
    assert.equal(
      oldEvent.occurredAt,
      replacement.occurredAt,
    );

    const ids =
      [
        oldEvent.eventId,
        replacement.eventId,
      ].sort();

    const orderedIds =
      [
        oldEvent,
        replacement,
      ]
        .sort(
          (
            left,
            right,
          ) =>
            left.position -
            right.position,
        )
        .map(
          (
            entry,
          ) =>
            entry.eventId,
        );

    assert.deepEqual(
      orderedIds,
      ids,
    );
  },
);
