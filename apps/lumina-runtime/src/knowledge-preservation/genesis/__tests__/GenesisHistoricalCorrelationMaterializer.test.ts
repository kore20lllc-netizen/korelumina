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
