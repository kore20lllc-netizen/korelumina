import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenesisHistoricalKnowledgeLineage,
} from "../GenesisHistoricalKnowledgeLineage.js";

import type {
  GenesisCorpusReadModel,
} from "../GenesisCorpusReadModel.js";

import type {
  GenesisReplayCheckpointDisposition,
} from "../GenesisReplayCheckpoint.js";

test(
  "preserves exact persisted historical source to evidence lineage",
  () => {
    const historicalSourceId =
      "genesis-source:source-file:source-a" as const;

    const corpus = {
      projectionId:
        "genesis-corpus-projection:test",

      sources: [
        {
          sourceReferenceId:
            "genesis-source-ref:source-a",

          sourceRevisionId:
            "genesis-source-revision:source-a",

          eventIds: [
            "genesis-event:event-a",
          ],

          episodeIds: [
            "genesis-episode:episode-a",
          ],

          metadata: {
            historicalSourceId,
          },
        },
      ],

      replays:
        [],
      events:
        [],
      relationships:
        [],
      episodes:
        [],
    } as unknown as GenesisCorpusReadModel;

    const dispositions:
      readonly GenesisReplayCheckpointDisposition[] = [
        {
          historicalSourceId,

          disposition:
            "ADMITTED",

          evidenceId:
            "evidence-a",
        },
      ];

    const projection =
      buildGenesisHistoricalKnowledgeLineage({
        corpus,
        dispositions,
      });

    assert.deepEqual(
      projection.records,
      [
        {
          historicalSourceId,
          evidenceId:
            "evidence-a",
          status:
            "correlated",
          sourceReferenceIds: [
            "genesis-source-ref:source-a",
          ],
          eventIds: [
            "genesis-event:event-a",
          ],
          episodeIds: [
            "genesis-episode:episode-a",
          ],
        },
      ],
    );

    assert.deepEqual(
      projection.summary,
      {
        admittedEvidence:
          1,
        correlated:
          1,
        sourceReferenceMissing:
          0,
        ambiguousSourceReference:
          0,
      },
    );
  },
);

test(
  "does not fabricate correlation when the source reference is absent",
  () => {
    const historicalSourceId =
      "genesis-source:source-file:missing" as const;

    const corpus = {
      projectionId:
        "genesis-corpus-projection:test",
      sources:
        [],
      replays:
        [],
      events:
        [],
      relationships:
        [],
      episodes:
        [],
    } as unknown as GenesisCorpusReadModel;

    const projection =
      buildGenesisHistoricalKnowledgeLineage({
        corpus,

        dispositions: [
          {
            historicalSourceId,
            disposition:
              "ADMITTED",
            evidenceId:
              "evidence-missing",
          },
        ],
      });

    assert.deepEqual(
      projection.records[0],
      {
        historicalSourceId,
        evidenceId:
          "evidence-missing",
        status:
          "source-reference-missing",
        sourceReferenceIds:
          [],
        eventIds:
          [],
        episodeIds:
          [],
      },
    );
  },
);

test(
  "ignores skipped and blocked replay dispositions",
  () => {
    const corpus = {
      projectionId:
        "genesis-corpus-projection:test",
      sources:
        [],
      replays:
        [],
      events:
        [],
      relationships:
        [],
      episodes:
        [],
    } as unknown as GenesisCorpusReadModel;

    const projection =
      buildGenesisHistoricalKnowledgeLineage({
        corpus,

        dispositions: [
          {
            historicalSourceId:
              "genesis-source:source-file:skipped",
            disposition:
              "SKIPPED",
            reason:
              "not admitted",
          },
          {
            historicalSourceId:
              "genesis-source:source-file:blocked",
            disposition:
              "BLOCKED",
            reason:
              "blocked",
          },
        ],
      });

    assert.deepEqual(
      projection.records,
      [],
    );
  },
);
