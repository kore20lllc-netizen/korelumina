import assert from "node:assert/strict";
import test from "node:test";

import {
  assessGenesisHistoricalEducationSource,
  assessGenesisHistoricalEducationSources,
} from "../GenesisHistoricalEducationSourceAssessment.js";

import type {
  GenesisHistoricalEducationRecord,
} from "../GenesisHistoricalEducationProjection.js";


function record(
  input: {
    lifecycle?:
      GenesisHistoricalEducationRecord["lifecycle"];

    eventKind?:
      GenesisHistoricalEducationRecord[
        "eventReferences"
      ][number]["kind"];

    withSource?:
      boolean;

    withEvent?:
      boolean;
  } = {},
): GenesisHistoricalEducationRecord {
  const withSource =
    input.withSource ??
    true;

  const withEvent =
    input.withEvent ??
    true;

  return {
    recordId:
      "genesis-historical-education:test",

    projectionVersion:
      "genesis-historical-education:v1",

    replayId:
      "genesis-replay:test",

    episodeId:
      "genesis-episode:test",

    episodeRevisionId:
      "genesis-episode-revision:test",

    episodeKey:
      "episode:test",

    title:
      "Historical Episode",

    lifecycle:
      input.lifecycle ??
      "validated",

    externalContext:
      "complete",

    temporalAuthority: {
      historicalStatus:
        "historically-observed",

      currentStatus:
        "not-applicable",

      historicalAuthorityClass:
        null,

      historicalApprovalState:
        null,

      currentAuthorityClass:
        null,

      currentApprovalState:
        null,

      replacedBy:
        null,
    },

    eventReferences:
      withEvent
        ? [
            {
              eventId:
                "genesis-event:test",

              kind:
                input.eventKind ??
                "implementation-committed",

              occurredAt:
                100,

              summary:
                "Historical evidence.",
            },
          ]
        : [],

    sourceReferences:
      withSource
        ? [
            {
              sourceReferenceId:
                "genesis-source-ref:test",

              sourceRevisionId:
                "genesis-source-revision:test",

              sourceIdentity:
                "historical-source:test",

              sourceClass:
                "repository",

              evidenceType:
                "document",

              acquisitionState:
                "acquired",

              provenance: {
                repository:
                  "kore20lllc-netizen/korelumina",

                externalSource:
                  false,
              },
            },
          ]
        : [],

    relationshipIds:
      [],

    lineage: {
      previousRevisionId:
        null,

      mergedFrom:
        [],

      splitFrom:
        null,

      supersedes:
        [],
    },

    governingAuthorityCreated:
      false,

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,

    chiefAgentActivationAuthorized:
      false,
  };
}


test(
  "governed Genesis evidence is eligible for historical education without creating governing authority",
  () => {
    const result =
      assessGenesisHistoricalEducationSource(
        record(),
      );

    assert.equal(
      result.decision,
      "ELIGIBLE_HISTORICAL_EVIDENCE",
    );

    assert.equal(
      result.learningRole,
      "HISTORICAL_CONTEXT",
    );

    assert.equal(
      result.governingAuthority,
      false,
    );

    assert.ok(
      result.reasons.includes(
        "historical-evidence-does-not-create-current-authority",
      ),
    );
  },
);


test(
  "historical learning-role classification is preserved by the source assessment",
  () => {
    const result =
      assessGenesisHistoricalEducationSource(
        record({
          lifecycle:
            "superseded",
        }),
      );

    assert.equal(
      result.learningRole,
      "SUPERSEDED_APPROACH",
    );

    assert.equal(
      result.decision,
      "ELIGIBLE_HISTORICAL_EVIDENCE",
    );
  },
);


test(
  "record without source provenance is blocked",
  () => {
    const result =
      assessGenesisHistoricalEducationSource(
        record({
          withSource:
            false,
        }),
      );

    assert.equal(
      result.decision,
      "BLOCKED",
    );

    assert.equal(
      result.learningRole,
      null,
    );

    assert.ok(
      result.reasons.includes(
        "genesis-historical-education-source-provenance-missing",
      ),
    );
  },
);


test(
  "record without event provenance is blocked",
  () => {
    const result =
      assessGenesisHistoricalEducationSource(
        record({
          withEvent:
            false,
        }),
      );

    assert.equal(
      result.decision,
      "BLOCKED",
    );

    assert.equal(
      result.learningRole,
      null,
    );
  },
);


test(
  "assessment collection is deterministic",
  () => {
    const a =
      record();

    const b = {
      ...record({
        eventKind:
          "lesson-recorded",
      }),

      recordId:
        "genesis-historical-education:aaa" as const,

      episodeId:
        "genesis-episode:aaa",
    };

    const first =
      assessGenesisHistoricalEducationSources([
        a,
        b,
      ]);

    const second =
      assessGenesisHistoricalEducationSources([
        b,
        a,
      ]);

    assert.deepEqual(
      first,
      second,
    );
  },
);
