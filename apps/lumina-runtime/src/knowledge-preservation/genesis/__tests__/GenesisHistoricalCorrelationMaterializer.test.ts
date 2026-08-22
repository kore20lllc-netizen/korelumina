import assert from "node:assert/strict";
import test from "node:test";

import {
  materializeGenesisHistoricalCorrelation,
} from "../GenesisHistoricalCorrelationMaterializer.js";

import type {
  GenesisReplayExecution,
} from "../GenesisReplayExecution.js";

function fixture():
  GenesisReplayExecution {
  return {
    manifest: {
      manifestId:
        "manifest-test",

      replayContractVersion:
        "1.0",

      scope: {
        mode:
          "partial",

        repository:
          "kore20lllc-netizen/korelumina",

        includedEvidenceTypes:
          [
            "document",
            "commit",
          ],

        excludedEvidenceTypes:
          [],

        explicitlyExcludedSourceIds:
          [],

        governancePolicyVersion:
          "governance-v1",

        replayContractVersion:
          "1.0",
      },

      discoveredAt:
        3,

      entries: [
        {
          historicalSourceId:
            "genesis-source:document:a",

          sourceType:
            "document",

          evidenceType:
            "document",

          authorityClass:
            "documentation",

          provenanceLocator:
            "docs/a.md",

          sourceChecksum:
            "checksum-a",

          historicalTimestamp:
            1,

          historicalTimestampSource:
            "git",

          discoveredAt:
            3,

          discoveryMethod:
            "test",

          replayEligibility:
            "eligible",

          supersedes:
            [],

          conflictsWith:
            [],

          metadata: {
            title:
              "Architecture A",
          },
        },

        {
          historicalSourceId:
            "genesis-source:commit:b",

          sourceType:
            "commit",

          evidenceType:
            "commit",

          authorityClass:
            "implementation",

          provenanceLocator:
            "git:b",

          sourceChecksum:
            "checksum-b",

          historicalTimestamp:
            2,

          historicalTimestampSource:
            "git",

          discoveredAt:
            3,

          discoveryMethod:
            "test",

          replayEligibility:
            "eligible",

          supersedes:
            [],

          conflictsWith:
            [],

          metadata: {
            subject:
              "Implement architecture A",
          },
        },
      ],
    },

    state: {
      replayId:
        `genesis-replay:${"a".repeat(64)}`,

      status:
        "completed",

      currentManifestIndex:
        null,

      lastCompletedManifestIndex:
        1,

      dispositions: [
        {
          historicalSourceId:
            "genesis-source:document:a",

          disposition:
            "ADMITTED",

          evidenceId:
            "evidence:a",
        },

        {
          historicalSourceId:
            "genesis-source:commit:b",

          disposition:
            "ADMITTED",

          evidenceId:
            "evidence:b",
        },
      ],
    },

    plan:
      {} as GenesisReplayExecution["plan"],

    checkpoint:
      null,
  } as unknown as GenesisReplayExecution;
}

test(
  "materializes admitted sources and deterministic historical events",
  () => {
    const state =
      materializeGenesisHistoricalCorrelation(
        fixture(),
      );

    assert.equal(
      state.sourceReferences.length,
      2,
    );

    assert.equal(
      state.events.length,
      2,
    );

    assert.equal(
      state.episodes.length,
      0,
    );

    assert.equal(
      state.events[0]?.kind,
      "document-created",
    );

    assert.equal(
      state.events[1]?.kind,
      "implementation-committed",
    );
  },
);

test(
  "chronological relationships are explicitly non-causal",
  () => {
    const state =
      materializeGenesisHistoricalCorrelation(
        fixture(),
      );

    const chronology =
      state.relationships.find(
        relationship =>
          relationship.type ===
          "occurred_before",
      );

    assert.ok(
      chronology,
    );

    assert.equal(
      chronology.causal,
      false,
    );

    assert.equal(
      chronology.evidence.mode,
      "temporal-order",
    );
  },
);

test(
  "does not create an Evolution Episode from chronology alone",
  () => {
    const state =
      materializeGenesisHistoricalCorrelation(
        fixture(),
      );

    assert.equal(
      state.episodes.length,
      0,
    );
  },
);

test(
  "does not collapse distinct commits that reuse the same subject into one logical Source",
  () => {
    const execution =
      fixture();

    execution.manifest.entries = [
      {
        historicalSourceId:
          "genesis-source:commit:first",

        sourceType:
          "commit",

        evidenceType:
          "commit",

        authorityClass:
          "repository-history",

        provenanceLocator:
          "git:commit:first",

        sourceChecksum:
          "checksum-first",

        historicalTimestamp:
          10,

        historicalTimestampSource:
          "git",

        discoveredAt:
          30,

        discoveryMethod:
          "test",

        replayEligibility:
          "eligible",

        supersedes:
          [],

        conflictsWith:
          [],

        metadata: {
          subject:
            "fix(knowledge): preserve inspector close state",
        },
      },
      {
        historicalSourceId:
          "genesis-source:commit:second",

        sourceType:
          "commit",

        evidenceType:
          "commit",

        authorityClass:
          "repository-history",

        provenanceLocator:
          "git:commit:second",

        sourceChecksum:
          "checksum-second",

        historicalTimestamp:
          20,

        historicalTimestampSource:
          "git",

        discoveredAt:
          30,

        discoveryMethod:
          "test",

        replayEligibility:
          "eligible",

        supersedes:
          [],

        conflictsWith:
          [],

        metadata: {
          subject:
            "fix(knowledge): preserve inspector close state",
        },
      },
    ];

    execution.state.dispositions = [
      {
        historicalSourceId:
          "genesis-source:commit:first",

        disposition:
          "ADMITTED",

        evidenceId:
          "evidence:first",
      },
      {
        historicalSourceId:
          "genesis-source:commit:second",

        disposition:
          "ADMITTED",

        evidenceId:
          "evidence:second",
      },
    ];

    execution.state.lastCompletedManifestIndex =
      1;

    const state =
      materializeGenesisHistoricalCorrelation(
        execution,
      );

    assert.equal(
      state.sourceReferences.length,
      2,
    );

    assert.equal(
      state.events.length,
      2,
    );

    assert.equal(
      state.episodes.length,
      0,
    );

    assert.notEqual(
      state.sourceReferences[0]
        ?.sourceReferenceId,
      state.sourceReferences[1]
        ?.sourceReferenceId,
    );

    assert.deepEqual(
      state.sourceReferences
        .map(
          source =>
            source.sourceIdentity,
        )
        .sort(),
      [
        "genesis-source:commit:first",
        "genesis-source:commit:second",
      ],
    );

    for (
      const source
      of state.sourceReferences
    ) {
      const matchingEvents =
        state.events.filter(
          event =>
            event.sourceReferenceIds.includes(
              source.sourceReferenceId,
            ),
        );

      assert.equal(
        matchingEvents.length,
        1,
      );
    }

    assert.deepEqual(
      state.events
        .map(
          event =>
            event.observationKey,
        )
        .sort(),
      [
        "genesis-source:commit:first",
        "genesis-source:commit:second",
      ],
    );

    assert.equal(
      new Set(
        state.events.flatMap(
          event =>
            event.sourceReferenceIds,
        ),
      ).size,
      2,
    );
  },
);

test(
  "creates an Evolution Episode from an explicit semantic source relationship",
  () => {
    const execution =
      fixture();

    const entries =
      execution.manifest.entries;

    const second =
      entries[1];

    if (!second) {
      throw new Error(
        "fixture_second_manifest_entry_missing",
      );
    }

    execution.manifest.entries = [
      entries[0],
      {
        ...second,

        supersedes: [
          "genesis-source:document:a",
        ],
      },
    ];

    const state =
      materializeGenesisHistoricalCorrelation(
        execution,
      );

    assert.equal(
      state.episodes.length,
      1,
    );

    const episode =
      state.episodes[0];

    assert.ok(
      episode,
    );

    assert.equal(
      episode.lifecycle,
      "correlated",
    );

    assert.equal(
      episode.eventIds.length,
      2,
    );

    assert.equal(
      episode.sourceReferenceIds.length,
      2,
    );

    assert.equal(
      episode.temporalAuthority.current.status,
      "unknown",
    );

    assert.equal(
      episode.metadata.materializationMode,
      "explicit-semantic-component",
    );
  },
);
