import assert from "node:assert/strict";
import test from "node:test";

import {
  projectGenesisHistoricalEducation,
} from "../GenesisHistoricalEducationProjection.js";


function operationalFixture() {
  return {
    replayId:
      "genesis-replay:test",

    corpus: {
      sources: [
        {
          sourceReferenceId:
            "genesis-source-ref:source-1",

          sourceRevisionId:
            "genesis-source-revision:revision-1",

          sourceIdentity:
            "conversation:1",

          sourceClass:
            "conversation",

          evidenceType:
            "conversation",

          acquisitionState:
            "acquired",

          provenance: {
            nativeId:
              "conversation-1",

            externalSource:
              true,
          },

          eventIds: [
            "genesis-event:event-1",
          ],

          episodeIds: [
            "genesis-episode:episode-1",
          ],

          metadata: {},
        },
      ],

      events: [
        {
          eventId:
            "genesis-event:event-1",

          kind:
            "correction-requested",

          observationKey:
            "correction:1",

          occurredAt:
            100,

          sourceReferenceIds: [
            "genesis-source-ref:source-1",
          ],

          sourceRevisionIds: [
            "genesis-source-revision:revision-1",
          ],

          summary:
            "Historical correction requested.",

          temporalAuthority: {
            historical: {
              status:
                "historically-observed",
            },

            current: {
              status:
                "not-applicable",
            },
          },

          metadata: {},
        },
      ],

      episodes: [
        {
          episodeId:
            "genesis-episode:episode-1",

          revisionId:
            "genesis-episode-revision:revision-1",

          episodeKey:
            "episode:1",

          title:
            "Historical Architecture Correction",

          lifecycle:
            "validated",

          eventIds: [
            "genesis-event:event-1",
          ],

          relationshipIds: [],

          sourceReferenceIds: [
            "genesis-source-ref:source-1",
          ],

          externalContext:
            "complete",

          temporalAuthority: {
            historical: {
              status:
                "historically-validated",

              authorityClass:
                "historical-evidence",
            },

            current: {
              status:
                "not-applicable",
            },
          },

          lineage: {
            mergedFrom: [],
            supersedes: [],
          },

          metadata: {},
        },
      ],
    },

    dayZeroCertificationCandidate: {
      candidateId:
        "genesis-day-zero-candidate:test",
    },
  };
}


test(
  "projects governed Genesis episodes as historical educational evidence without creating authority",
  () => {
    const projection =
      projectGenesisHistoricalEducation(
        operationalFixture() as never,
      );

    assert.equal(
      projection.replayId,
      "genesis-replay:test",
    );

    assert.equal(
      projection.dayZeroCandidateId,
      "genesis-day-zero-candidate:test",
    );

    assert.equal(
      projection.records.length,
      1,
    );

    const record =
      projection.records[0];

    assert.equal(
      record?.title,
      "Historical Architecture Correction",
    );

    assert.equal(
      record?.lifecycle,
      "validated",
    );

    assert.equal(
      record?.temporalAuthority
        .historicalStatus,
      "historically-validated",
    );

    assert.equal(
      record?.eventReferences[0]
        ?.kind,
      "correction-requested",
    );

    assert.equal(
      record?.sourceReferences[0]
        ?.sourceIdentity,
      "conversation:1",
    );

    assert.equal(
      record?.governingAuthorityCreated,
      false,
    );

    assert.equal(
      record?.educationalCorpusCertified,
      false,
    );

    assert.equal(
      record?.initialCompetencyCertified,
      false,
    );

    assert.equal(
      record?.chiefAgentActivationAuthorized,
      false,
    );
  },
);


test(
  "projection identity is deterministic for the same replay and episode revision",
  () => {
    const first =
      projectGenesisHistoricalEducation(
        operationalFixture() as never,
      );

    const second =
      projectGenesisHistoricalEducation(
        operationalFixture() as never,
      );

    assert.equal(
      first.records[0]?.recordId,
      second.records[0]?.recordId,
    );
  },
);


test(
  "projection preserves Genesis lifecycle instead of inferring educational authority",
  () => {
    const input =
      operationalFixture();

    input.corpus.episodes[0]!
      .lifecycle =
        "superseded";

    const projection =
      projectGenesisHistoricalEducation(
        input as never,
      );

    assert.equal(
      projection.records[0]
        ?.lifecycle,
      "superseded",
    );

    assert.equal(
      projection
        .governingAuthorityCreated,
      false,
    );
  },
);
