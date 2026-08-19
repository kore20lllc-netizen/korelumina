import assert from "node:assert/strict";
import test from "node:test";

import {
  existsSync,
  mkdtempSync,
  rmSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import type {
  GenesisReplayId,
} from "../GenesisReplayIdentity.js";

import {
  EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
  createChronologicalRelationship,
  createEvolutionEpisode,
  createHistoricalEvent,
  createHistoricalRelationship,
  createHistoricalSourceReference,
  mergeGenesisHistoricalCorrelationState,
  reviseEvolutionEpisode,
} from "../GenesisHistoricalCorrelation.js";

import {
  FileGenesisHistoricalCorrelationPersistenceStore,
} from "../GenesisHistoricalCorrelationPersistence.js";

const REPLAY_ID =
  `genesis-replay:${"a".repeat(
    64,
  )}` as GenesisReplayId;

const authority = {
  historical: {
    status:
      "historically-implemented" as const,

    authorityClass:
      "implementation",

    approvalState:
      "observed",
  },

  current: {
    status:
      "currently-implemented" as const,
  },
};

const supersededAuthority = {
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

function commitSource() {
  return createHistoricalSourceReference({
    sourceIdentity:
      "git-commit:abc123",

    sourceClass:
      "commit",

    evidenceType:
      "commit",

    sourceRevision:
      "abc123",

    provenance: {
      locator:
        "git:abc123",

      nativeId:
        "abc123",

      repository:
        "kore20lllc-netizen/korelumina",

      ref:
        "feature/genesis-historical-replay",

      externalSource:
        false,
    },

    integrity: {
      checksum:
        "commit-checksum",

      acquisitionState:
        "available",
    },

    metadata: {
      files: [
        "apps/lumina-builder/src/example.tsx",
      ],
    },
  });
}

function conversationSource() {
  return createHistoricalSourceReference({
    sourceIdentity:
      "conversation:C-123",

    sourceClass:
      "conversation",

    evidenceType:
      "conversation",

    sourceRevision:
      "message:M-456",

    provenance: {
      locator:
        "chatgpt://conversation/C-123/message/M-456",

      nativeId:
        "C-123:M-456",

      sourceReference:
        "EXTERNAL SOURCE — NOT YET INGESTED",

      externalSource:
        true,
    },

    integrity: {
      acquisitionState:
        "not-yet-ingested",
    },

    metadata: {
      speakerRole:
        "human",

      projectAssociation:
        "KoreLumina",
    },
  });
}

function buildSource() {
  return createHistoricalSourceReference({
    sourceIdentity:
      "build:B-456",

    sourceClass:
      "build-output",

    evidenceType:
      "build-output",

    sourceRevision:
      "B-456",

    provenance: {
      locator:
        "build:B-456",

      nativeId:
        "B-456",

      repository:
        "kore20lllc-netizen/korelumina",

      externalSource:
        false,
    },

    integrity: {
      checksum:
        "build-checksum",

      acquisitionState:
        "available",
    },

    metadata: {},
  });
}

function certificationSource() {
  return createHistoricalSourceReference({
    sourceIdentity:
      "certification:CERT-789",

    sourceClass:
      "milestone",

    evidenceType:
      "milestone",

    sourceRevision:
      "CERT-789",

    provenance: {
      locator:
        "certification:CERT-789",

      nativeId:
        "CERT-789",

      repository:
        "kore20lllc-netizen/korelumina",

      externalSource:
        false,
    },

    integrity: {
      checksum:
        "cert-checksum",

      acquisitionState:
        "available",
    },

    metadata: {
      result:
        "green",
    },
  });
}

function event(
  source:
    ReturnType<
      typeof commitSource
    >,

  observationKey =
    "implementation:abc123",
) {
  return createHistoricalEvent({
    kind:
      "implementation-committed",

    observationKey,

    occurredAt:
      1_000,

    sourceReferenceIds: [
      source.sourceReferenceId,
    ],

    sourceRevisionIds: [
      source.sourceRevisionId,
    ],

    summary:
      "Implementation committed",

    temporalAuthority:
      authority,

    metadata: {},
  });
}

test(
  "source evidence retains independent identity",
  () => {
    const conversation =
      conversationSource();

    const commit =
      commitSource();

    assert.notEqual(
      conversation
        .sourceReferenceId,
      commit
        .sourceReferenceId,
    );

    assert.notEqual(
      conversation
        .sourceRevisionId,
      commit
        .sourceRevisionId,
    );
  },
);

test(
  "historical event identity is deterministic",
  () => {
    const source =
      commitSource();

    assert.equal(
      event(
        source,
      ).eventId,
      event(
        source,
      ).eventId,
    );
  },
);

test(
  "episode identity is deterministic",
  () => {
    const source =
      commitSource();

    const implementation =
      event(
        source,
      );

    const create =
      () =>
        createEvolutionEpisode({
          episodeKey:
            "production-workspace-surface-normalization",

          title:
            "Production Workspace Surface Normalization",

          lifecycle:
            "correlated",

          eventIds: [
            implementation
              .eventId,
          ],

          relationshipIds:
            [],

          sourceReferenceIds: [
            source
              .sourceReferenceId,
          ],

          externalContext:
            "pending",

          temporalAuthority:
            authority,

          lineage: {
            mergedFrom:
              [],

            supersedes:
              [],
          },

          metadata: {},
        });

    assert.equal(
      create().episodeId,
      create().episodeId,
    );

    assert.equal(
      create().revisionId,
      create().revisionId,
    );
  },
);

test(
  "replay does not duplicate events",
  () => {
    const source =
      commitSource();

    const implementation =
      event(
        source,
      );

    const incoming = {
      ...EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,

      sourceReferences: [
        source,
      ],

      events: [
        implementation,
      ],
    };

    const once =
      mergeGenesisHistoricalCorrelationState(
        EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
        incoming,
      );

    const twice =
      mergeGenesisHistoricalCorrelationState(
        once,
        incoming,
      );

    assert.equal(
      twice.events.length,
      1,
    );
  },
);

test(
  "replay does not duplicate episodes",
  () => {
    const source =
      commitSource();

    const implementation =
      event(
        source,
      );

    const episode =
      createEvolutionEpisode({
        episodeKey:
          "episode:idempotency",

        title:
          "Idempotency",

        lifecycle:
          "correlated",

        eventIds: [
          implementation
            .eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          source
            .sourceReferenceId,
        ],

        externalContext:
          "not-required",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {},
      });

    const incoming = {
      ...EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,

      episodes: [
        episode,
      ],
    };

    const twice =
      mergeGenesisHistoricalCorrelationState(
        mergeGenesisHistoricalCorrelationState(
          EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
          incoming,
        ),
        incoming,
      );

    assert.equal(
      twice.episodes.length,
      1,
    );
  },
);

test(
  "one episode may contain multiple source types",
  () => {
    const conversation =
      conversationSource();

    const commit =
      commitSource();

    const requested =
      createHistoricalEvent({
        kind:
          "requirement-stated",

        observationKey:
          "request:surface-normalization",

        occurredAt:
          900,

        sourceReferenceIds: [
          conversation
            .sourceReferenceId,
        ],

        sourceRevisionIds: [
          conversation
            .sourceRevisionId,
        ],

        temporalAuthority:
          authority,

        metadata: {},
      });

    const implemented =
      event(
        commit,
      );

    const episode =
      createEvolutionEpisode({
        episodeKey:
          "surface-normalization",

        title:
          "Surface normalization",

        lifecycle:
          "correlated",

        eventIds: [
          requested.eventId,
          implemented.eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          conversation
            .sourceReferenceId,

          commit
            .sourceReferenceId,
        ],

        externalContext:
          "complete",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {},
      });

    assert.equal(
      episode
        .sourceReferenceIds
        .length,
      2,
    );
  },
);

test(
  "correlation preserves source provenance",
  () => {
    const conversation =
      conversationSource();

    assert.equal(
      conversation
        .provenance
        .nativeId,
      "C-123:M-456",
    );

    assert.equal(
      conversation
        .provenance
        .externalSource,
      true,
    );
  },
);

test(
  "chronology does not automatically create causality",
  () => {
    const source =
      commitSource();

    const first =
      event(
        source,
        "first",
      );

    const second =
      createHistoricalEvent({
        kind:
          first.kind,

        observationKey:
          "second",

        occurredAt:
          2_000,

        sourceReferenceIds:
          first.sourceReferenceIds,

        sourceRevisionIds:
          first.sourceRevisionIds,

        summary:
          first.summary,

        temporalAuthority:
          first.temporalAuthority,

        metadata:
          first.metadata,
      });

    const relation =
      createChronologicalRelationship({
        fromEventId:
          first.eventId,

        toEventId:
          second.eventId,

        sourceReferenceIds: [
          source
            .sourceReferenceId,
        ],

        assertion:
          "first occurred before second",
      });

    assert.equal(
      relation.type,
      "occurred_before",
    );

    assert.equal(
      relation.causal,
      false,
    );
  },
);

test(
  "explicit correlation is distinguishable from inferred correlation",
  () => {
    const conversation =
      conversationSource();

    const commit =
      commitSource();

    const explicit =
      createHistoricalRelationship({
        from: {
          kind:
            "source",

          id:
            conversation
              .sourceReferenceId,
        },

        to: {
          kind:
            "source",

          id:
            commit
              .sourceReferenceId,
        },

        type:
          "implemented_by",

        causal:
          false,

        confidence:
          "explicit",

        evidence: {
          mode:
            "explicit-reference",

          confidence:
            "explicit",

          sourceReferenceIds: [
            conversation
              .sourceReferenceId,

            commit
              .sourceReferenceId,
          ],

          assertions: [
            "task explicitly names commit abc123",
          ],
        },
      });

    const inferred =
      createHistoricalRelationship({
        from:
          explicit.from,

        to:
          explicit.to,

        type:
          "related_to",

        causal:
          false,

        confidence:
          "probable",

        evidence: {
          mode:
            "structural-inference",

          confidence:
            "probable",

          sourceReferenceIds: [
            conversation
              .sourceReferenceId,

            commit
              .sourceReferenceId,
          ],

          assertions: [
            "scope and changed files align",
          ],
        },
      });

    assert.notEqual(
      explicit.confidence,
      inferred.confidence,
    );

    assert.notEqual(
      explicit.evidence.mode,
      inferred.evidence.mode,
    );
  },
);

test(
  "failed implementation remains in history after replacement",
  () => {
    const commit =
      commitSource();

    const failure =
      createHistoricalEvent({
        kind:
          "visual-validation-failed",

        observationKey:
          "validation:red",

        occurredAt:
          2_000,

        sourceReferenceIds: [
          commit
            .sourceReferenceId,
        ],

        sourceRevisionIds: [
          commit
            .sourceRevisionId,
        ],

        temporalAuthority:
          authority,

        metadata: {
          result:
            "red",
        },
      });

    const replacement =
      createHistoricalEvent({
        kind:
          "replacement-implemented",

        observationKey:
          "replacement:B",

        occurredAt:
          3_000,

        sourceReferenceIds: [
          commit
            .sourceReferenceId,
        ],

        sourceRevisionIds: [
          commit
            .sourceRevisionId,
        ],

        temporalAuthority:
          authority,

        metadata: {},
      });

    const relation =
      createHistoricalRelationship({
        from: {
          kind:
            "event",

          id:
            failure.eventId,
        },

        to: {
          kind:
            "event",

          id:
            replacement
              .eventId,
        },

        type:
          "replaced_by",

        causal:
          false,

        confidence:
          "explicit",

        evidence: {
          mode:
            "human-validation",

          confidence:
            "explicit",

          sourceReferenceIds: [
            commit
              .sourceReferenceId,
          ],

          assertions: [
            "failed validation was followed by explicit replacement",
          ],
        },
      });

    const state =
      mergeGenesisHistoricalCorrelationState(
        EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
        {
          ...EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,

          events: [
            failure,
            replacement,
          ],

          relationships: [
            relation,
          ],
        },
      );

    assert.equal(
      state.events.length,
      2,
    );

    assert.ok(
      state.events.some(
        (
          item,
        ) =>
          item.eventId ===
          failure.eventId,
      ),
    );
  },
);

test(
  "superseded evidence remains inspectable",
  () => {
    const source =
      commitSource();

    const oldEvent =
      createHistoricalEvent({
        kind:
          "architecture-proposed",

        observationKey:
          "architecture:v1",

        occurredAt:
          1_000,

        sourceReferenceIds: [
          source
            .sourceReferenceId,
        ],

        sourceRevisionIds: [
          source
            .sourceRevisionId,
        ],

        temporalAuthority:
          supersededAuthority,

        metadata: {},
      });

    assert.equal(
      oldEvent
        .temporalAuthority
        .historical
        .status,
      "historically-authoritative",
    );

    assert.equal(
      oldEvent
        .temporalAuthority
        .current
        .status,
      "currently-superseded",
    );
  },
);

test(
  "current authority differs from historical authority",
  () => {
    assert.notEqual(
      supersededAuthority
        .historical
        .status,
      supersededAuthority
        .current
        .status,
    );
  },
);

test(
  "unresolved correlation remains unresolved",
  () => {
    const conversation =
      conversationSource();

    const commit =
      commitSource();

    const relation =
      createHistoricalRelationship({
        from: {
          kind:
            "source",

          id:
            conversation
              .sourceReferenceId,
        },

        to: {
          kind:
            "source",

          id:
            commit
              .sourceReferenceId,
        },

        type:
          "related_to",

        causal:
          false,

        confidence:
          "unresolved",

        evidence: {
          mode:
            "unresolved",

          confidence:
            "unresolved",

          sourceReferenceIds: [
            conversation
              .sourceReferenceId,

            commit
              .sourceReferenceId,
          ],

          assertions: [
            "conflicting historical evidence prevents reliable correlation",
          ],
        },
      });

    assert.equal(
      relation.confidence,
      "unresolved",
    );
  },
);

test(
  "external conversation source can be represented without repository path",
  () => {
    const conversation =
      conversationSource();

    assert.equal(
      conversation
        .provenance
        .externalSource,
      true,
    );

    assert.equal(
      conversation
        .provenance
        .repository,
      undefined,
    );

    assert.equal(
      conversation
        .integrity
        .acquisitionState,
      "not-yet-ingested",
    );
  },
);

test(
  "external-context-pending does not block repository replay correlation",
  () => {
    const commit =
      commitSource();

    const implementation =
      event(
        commit,
      );

    const episode =
      createEvolutionEpisode({
        episodeKey:
          "repository-native-with-external-context-pending",

        title:
          "Repository-native episode",

        lifecycle:
          "correlated",

        eventIds: [
          implementation
            .eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          commit
            .sourceReferenceId,
        ],

        externalContext:
          "pending",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {
          externalContextLabel:
            "EXTERNAL CONTEXT PENDING",
        },
      });

    assert.equal(
      episode.lifecycle,
      "correlated",
    );

    assert.equal(
      episode
        .externalContext,
      "pending",
    );
  },
);

test(
  "test persistence cannot contaminate production Genesis data",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-genesis-correlation-",
        ),
      );

    try {
      const store =
        new FileGenesisHistoricalCorrelationPersistenceStore({
          storageRoot:
            root,
        });

      const commit =
        commitSource();

      const implementation =
        event(
          commit,
        );

      const state = {
        ...EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,

        sourceReferences: [
          commit,
        ],

        events: [
          implementation,
        ],
      };

      store.save(
        REPLAY_ID,
        state,
      );

      const paths =
        store.pathsFor(
          REPLAY_ID,
        );

      assert.ok(
        paths.correlationFile
          .startsWith(
            root,
          ),
      );

      assert.equal(
        existsSync(
          paths.correlationFile,
        ),
        true,
      );

      const loaded =
        store.load(
          REPLAY_ID,
        );

      assert.deepEqual(
        loaded,
        state,
      );
    } finally {
      rmSync(
        root,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);

test(
  "conversation enrichment preserves episode identity while producing a new revision",
  () => {
    const commit =
      commitSource();

    const implementation =
      event(
        commit,
      );

    const original =
      createEvolutionEpisode({
        episodeKey:
          "workspace-surface-normalization",

        title:
          "Workspace Surface Normalization",

        lifecycle:
          "correlated",

        eventIds: [
          implementation.eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          commit.sourceReferenceId,
        ],

        externalContext:
          "pending",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {
          externalContextLabel:
            "EXTERNAL CONTEXT PENDING",
        },
      });

    const conversation =
      conversationSource();

    const request =
      createHistoricalEvent({
        kind:
          "requirement-stated",

        observationKey:
          "conversation:C-123:request",

        occurredAt:
          900,

        sourceReferenceIds: [
          conversation.sourceReferenceId,
        ],

        sourceRevisionIds: [
          conversation.sourceRevisionId,
        ],

        temporalAuthority:
          authority,

        metadata: {},
      });

    const enriched =
      reviseEvolutionEpisode(
        original,
        {
          title:
            original.title,

          lifecycle:
            "correlated",

          eventIds: [
            ...original.eventIds,
            request.eventId,
          ],

          relationshipIds:
            original.relationshipIds,

          sourceReferenceIds: [
            ...original.sourceReferenceIds,
            conversation.sourceReferenceId,
          ],

          externalContext:
            "complete",

          temporalAuthority:
            original.temporalAuthority,

          metadata: {
            enrichedWithConversation:
              true,
          },
        },
      );

    assert.equal(
      enriched.episodeId,
      original.episodeId,
    );

    assert.notEqual(
      enriched.revisionId,
      original.revisionId,
    );

    assert.equal(
      enriched
        .lineage
        .previousRevisionId,
      original.revisionId,
    );

    assert.ok(
      enriched
        .sourceReferenceIds
        .includes(
          conversation
            .sourceReferenceId,
        ),
    );
  },
);

test(
  "replaying the same enriched episode revision does not duplicate it",
  () => {
    const commit =
      commitSource();

    const implementation =
      event(
        commit,
      );

    const original =
      createEvolutionEpisode({
        episodeKey:
          "revision-idempotency",

        title:
          "Revision Idempotency",

        lifecycle:
          "correlated",

        eventIds: [
          implementation.eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          commit.sourceReferenceId,
        ],

        externalContext:
          "pending",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {},
      });

    const enriched =
      reviseEvolutionEpisode(
        original,
        {
          title:
            original.title,

          lifecycle:
            "validated",

          eventIds:
            original.eventIds,

          relationshipIds:
            original.relationshipIds,

          sourceReferenceIds:
            original.sourceReferenceIds,

          externalContext:
            "complete",

          temporalAuthority:
            original.temporalAuthority,

          metadata: {
            certified:
              true,
          },
        },
      );

    const incoming = {
      ...EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,

      episodes: [
        original,
        enriched,
      ],
    };

    const once =
      mergeGenesisHistoricalCorrelationState(
        EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
        incoming,
      );

    const twice =
      mergeGenesisHistoricalCorrelationState(
        once,
        {
          ...EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,

          episodes: [
            enriched,
          ],
        },
      );

    assert.equal(
      twice.episodes.length,
      2,
    );

    assert.equal(
      twice.episodes.filter(
        (
          episode,
        ) =>
          episode.revisionId ===
          enriched.revisionId,
      ).length,
      1,
    );
  },
);

test(
  "episode merge creates a new stable episode and preserves source episode identities",
  () => {
    const commit =
      commitSource();

    const implementation =
      event(
        commit,
      );

    const first =
      createEvolutionEpisode({
        episodeKey:
          "merge:first",

        title:
          "First historical thread",

        lifecycle:
          "correlated",

        eventIds: [
          implementation.eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          commit.sourceReferenceId,
        ],

        externalContext:
          "not-required",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {},
      });

    const build =
      buildSource();

    const validation =
      createHistoricalEvent({
        kind:
          "build-executed",

        observationKey:
          "build:B-456",

        occurredAt:
          2_000,

        sourceReferenceIds: [
          build.sourceReferenceId,
        ],

        sourceRevisionIds: [
          build.sourceRevisionId,
        ],

        temporalAuthority:
          authority,

        metadata: {},
      });

    const second =
      createEvolutionEpisode({
        episodeKey:
          "merge:second",

        title:
          "Second historical thread",

        lifecycle:
          "correlated",

        eventIds: [
          validation.eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          build.sourceReferenceId,
        ],

        externalContext:
          "not-required",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {},
      });

    const merged =
      createEvolutionEpisode({
        episodeKey:
          "merge:combined",

        title:
          "Combined historical evolution",

        lifecycle:
          "correlated",

        eventIds: [
          ...first.eventIds,
          ...second.eventIds,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          ...first.sourceReferenceIds,
          ...second.sourceReferenceIds,
        ],

        externalContext:
          "not-required",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom: [
            first.episodeId,
            second.episodeId,
          ],

          supersedes:
            [],
        },

        metadata: {},
      });

    assert.notEqual(
      merged.episodeId,
      first.episodeId,
    );

    assert.notEqual(
      merged.episodeId,
      second.episodeId,
    );

    assert.deepEqual(
      new Set(
        merged.lineage.mergedFrom,
      ),
      new Set([
        first.episodeId,
        second.episodeId,
      ]),
    );
  },
);

test(
  "episode split creates distinct episode identity while retaining parent lineage",
  () => {
    const commit =
      commitSource();

    const implementation =
      event(
        commit,
      );

    const parent =
      createEvolutionEpisode({
        episodeKey:
          "split:parent",

        title:
          "Original combined episode",

        lifecycle:
          "correlated",

        eventIds: [
          implementation.eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          commit.sourceReferenceId,
        ],

        externalContext:
          "not-required",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {},
      });

    const child =
      createEvolutionEpisode({
        episodeKey:
          "split:child:implementation",

        title:
          "Implementation evolution",

        lifecycle:
          "correlated",

        eventIds:
          parent.eventIds,

        relationshipIds:
          parent.relationshipIds,

        sourceReferenceIds:
          parent.sourceReferenceIds,

        externalContext:
          "not-required",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom:
            [],

          splitFrom:
            parent.episodeId,

          supersedes:
            [],
        },

        metadata: {},
      });

    assert.notEqual(
      child.episodeId,
      parent.episodeId,
    );

    assert.equal(
      child.lineage.splitFrom,
      parent.episodeId,
    );
  },
);

test(
  "episode supersession preserves the superseded episode as inspectable history",
  () => {
    const commit =
      commitSource();

    const implementation =
      event(
        commit,
      );

    const oldEpisode =
      createEvolutionEpisode({
        episodeKey:
          "architecture:v1",

        title:
          "Architecture V1",

        lifecycle:
          "superseded",

        eventIds: [
          implementation.eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          commit.sourceReferenceId,
        ],

        externalContext:
          "not-required",

        temporalAuthority:
          supersededAuthority,

        lineage: {
          mergedFrom:
            [],

          supersedes:
            [],
        },

        metadata: {},
      });

    const replacement =
      createEvolutionEpisode({
        episodeKey:
          "architecture:v2",

        title:
          "Architecture V2",

        lifecycle:
          "validated",

        eventIds: [
          implementation.eventId,
        ],

        relationshipIds:
          [],

        sourceReferenceIds: [
          commit.sourceReferenceId,
        ],

        externalContext:
          "not-required",

        temporalAuthority:
          authority,

        lineage: {
          mergedFrom:
            [],

          supersedes: [
            oldEpisode.episodeId,
          ],
        },

        metadata: {},
      });

    const state =
      mergeGenesisHistoricalCorrelationState(
        EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,
        {
          ...EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE,

          episodes: [
            oldEpisode,
            replacement,
          ],
        },
      );

    assert.equal(
      state.episodes.length,
      2,
    );

    assert.ok(
      state.episodes.some(
        (
          episode,
        ) =>
          episode.episodeId ===
          oldEpisode.episodeId,
      ),
    );

    assert.ok(
      replacement
        .lineage
        .supersedes
        .includes(
          oldEpisode.episodeId,
        ),
    );
  },
);

test(
  "changed source revision creates a new event while preserving revision lineage",
  () => {
    const originalSource =
      commitSource();

    const originalEvent =
      event(
        originalSource,
        "source-revision:event",
      );

    const revisedSource =
      createHistoricalSourceReference({
        sourceIdentity:
          originalSource.sourceIdentity,

        sourceClass:
          originalSource.sourceClass,

        evidenceType:
          originalSource.evidenceType,

        sourceRevision:
          "abc123-revised-observation",

        provenance:
          originalSource.provenance,

        integrity: {
          checksum:
            "changed-observation-checksum",

          acquisitionState:
            "available",
        },

        metadata:
          originalSource.metadata,
      });

    assert.equal(
      revisedSource.sourceReferenceId,
      originalSource.sourceReferenceId,
    );

    assert.notEqual(
      revisedSource.sourceRevisionId,
      originalSource.sourceRevisionId,
    );

    const revisedEvent =
      createHistoricalEvent({
        kind:
          originalEvent.kind,

        observationKey:
          originalEvent.observationKey,

        occurredAt:
          originalEvent.occurredAt,

        sourceReferenceIds: [
          revisedSource.sourceReferenceId,
        ],

        sourceRevisionIds: [
          revisedSource.sourceRevisionId,
        ],

        revisesEventId:
          originalEvent.eventId,

        summary:
          originalEvent.summary,

        temporalAuthority:
          originalEvent.temporalAuthority,

        metadata:
          originalEvent.metadata,
      });

    assert.notEqual(
      revisedEvent.eventId,
      originalEvent.eventId,
    );

    assert.equal(
      revisedEvent.revisesEventId,
      originalEvent.eventId,
    );
  },
);

test(
  "relationship confidence must match correlation evidence confidence",
  () => {
    const conversation =
      conversationSource();

    const commit =
      commitSource();

    assert.throws(
      () =>
        createHistoricalRelationship({
          from: {
            kind:
              "source",

            id:
              conversation.sourceReferenceId,
          },

          to: {
            kind:
              "source",

            id:
              commit.sourceReferenceId,
          },

          type:
            "related_to",

          causal:
            false,

          confidence:
            "strong",

          evidence: {
            mode:
              "structural-inference",

            confidence:
              "probable",

            sourceReferenceIds: [
              conversation.sourceReferenceId,
              commit.sourceReferenceId,
            ],

            assertions: [
              "confidence disagreement must be rejected",
            ],
          },
        }),

      /genesis_correlation_confidence_mismatch/,
    );
  },
);

test(
  "probable temporal correlation cannot be promoted to causality",
  () => {
    const conversation =
      conversationSource();

    const commit =
      commitSource();

    assert.throws(
      () =>
        createHistoricalRelationship({
          from: {
            kind:
              "source",

            id:
              conversation.sourceReferenceId,
          },

          to: {
            kind:
              "source",

            id:
              commit.sourceReferenceId,
          },

          type:
            "caused",

          causal:
            true,

          confidence:
            "probable",

          evidence: {
            mode:
              "structural-inference",

            confidence:
              "probable",

            sourceReferenceIds: [
              conversation.sourceReferenceId,
              commit.sourceReferenceId,
            ],

            assertions: [
              "topic and chronology align but direct causal evidence is absent",
            ],
          },
        }),

      /genesis_causality_evidence_insufficient/,
    );
  },
);
