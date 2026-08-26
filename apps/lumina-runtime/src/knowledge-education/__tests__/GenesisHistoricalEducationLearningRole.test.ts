import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyGenesisHistoricalEducationLearningRole,
} from "../GenesisHistoricalEducationLearningRole.js";

import type {
  GenesisHistoricalEducationRecord,
} from "../GenesisHistoricalEducationProjection.js";


function record(
  input: {
    lifecycle?:
      GenesisHistoricalEducationRecord["lifecycle"];

    eventKinds?:
      GenesisHistoricalEducationRecord["eventReferences"][number]["kind"][];
  } = {},
): GenesisHistoricalEducationRecord {
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
      (
        input.eventKinds ??
        []
      ).map(
        (
          kind,
          index,
        ) => ({
          eventId:
            `genesis-event:${index}`,

          kind,

          occurredAt:
            index,

          summary:
            null,
        }),
      ),

    sourceReferences:
      [],

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
  "superseded Genesis episode becomes SUPERSEDED_APPROACH",
  () => {
    const result =
      classifyGenesisHistoricalEducationLearningRole(
        record({
          lifecycle:
            "superseded",

          eventKinds: [
            "test-failed",
          ],
        }),
      );

    assert.equal(
      result.learningRole,
      "SUPERSEDED_APPROACH",
    );
  },
);


test(
  "explicit lesson event becomes LESSON",
  () => {
    const result =
      classifyGenesisHistoricalEducationLearningRole(
        record({
          eventKinds: [
            "lesson-recorded",
          ],
        }),
      );

    assert.equal(
      result.learningRole,
      "LESSON",
    );
  },
);


test(
  "explicit failed validation becomes FAILED_APPROACH",
  () => {
    const result =
      classifyGenesisHistoricalEducationLearningRole(
        record({
          eventKinds: [
            "visual-validation-failed",
          ],
        }),
      );

    assert.equal(
      result.learningRole,
      "FAILED_APPROACH",
    );
  },
);


test(
  "approved decision becomes DECISION_HISTORY",
  () => {
    const result =
      classifyGenesisHistoricalEducationLearningRole(
        record({
          eventKinds: [
            "decision-approved",
          ],
        }),
      );

    assert.equal(
      result.learningRole,
      "DECISION_HISTORY",
    );
  },
);


test(
  "unclassified governed episode remains HISTORICAL_CONTEXT",
  () => {
    const result =
      classifyGenesisHistoricalEducationLearningRole(
        record({
          eventKinds: [
            "implementation-committed",
          ],
        }),
      );

    assert.equal(
      result.learningRole,
      "HISTORICAL_CONTEXT",
    );
  },
);
