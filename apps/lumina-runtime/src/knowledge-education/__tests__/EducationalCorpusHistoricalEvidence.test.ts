import assert from "node:assert/strict";
import test from "node:test";

import {
  assembleEducationalCorpusHistoricalEvidence,
} from "../EducationalCorpusHistoricalEvidence.js";

import {
  assessGenesisHistoricalEducationSources,
} from "../GenesisHistoricalEducationSourceAssessment.js";

import type {
  GenesisHistoricalEducationRecord,
} from "../GenesisHistoricalEducationProjection.js";


function record(
  input: {
    recordId:
      GenesisHistoricalEducationRecord["recordId"];

    episodeId:
      string;

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
  },
): GenesisHistoricalEducationRecord {
  const withSource =
    input.withSource ??
    true;

  const withEvent =
    input.withEvent ??
    true;

  return {
    recordId:
      input.recordId,

    projectionVersion:
      "genesis-historical-education:v1",

    replayId:
      "genesis-replay:test",

    episodeId:
      input.episodeId,

    episodeRevisionId:
      `revision:${input.episodeId}`,

    episodeKey:
      `episode-key:${input.episodeId}`,

    title:
      `Historical ${input.episodeId}`,

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
        "historical",

      historicalApprovalState:
        "observed",

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
                `event:${input.episodeId}`,

              kind:
                input.eventKind ??
                "implementation-committed",

              occurredAt:
                100,

              summary:
                `Event for ${input.episodeId}`,
            },
          ]
        : [],

    sourceReferences:
      withSource
        ? [
            {
              sourceReferenceId:
                `source:${input.episodeId}`,

              sourceRevisionId:
                `source-revision:${input.episodeId}`,

              sourceIdentity:
                `identity:${input.episodeId}`,

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

    relationshipIds: [
      `relationship:${input.episodeId}`,
    ],

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


function records() {
  return [
    record({
      recordId:
        "genesis-historical-education:context",

      episodeId:
        "context",
    }),

    record({
      recordId:
        "genesis-historical-education:lesson",

      episodeId:
        "lesson",

      eventKind:
        "lesson-recorded",
    }),

    record({
      recordId:
        "genesis-historical-education:superseded",

      episodeId:
        "superseded",

      lifecycle:
        "superseded",
    }),

    record({
      recordId:
        "genesis-historical-education:blocked",

      episodeId:
        "blocked",

      withSource:
        false,
    }),
  ] as const;
}


test(
  "assembles only eligible governed historical evidence",
  () => {
    const projected =
      records();

    const result =
      assembleEducationalCorpusHistoricalEvidence({
        records:
          projected,

        assessments:
          assessGenesisHistoricalEducationSources(
            projected,
          ),
      });

    assert.equal(
      result.records.length,
      3,
    );

    assert.equal(
      result.summary
        .eligibleRecords,
      3,
    );

    assert.equal(
      result.summary
        .blockedRecords,
      1,
    );

    assert.equal(
      result.records.some(
        item =>
          item.recordId ===
          "genesis-historical-education:blocked",
      ),
      false,
    );
  },
);


test(
  "preserves explicit historical learning roles and reconstructed evidence",
  () => {
    const projected =
      records();

    const result =
      assembleEducationalCorpusHistoricalEvidence({
        records:
          projected,

        assessments:
          assessGenesisHistoricalEducationSources(
            projected,
          ),
      });

    const lesson =
      result.records.find(
        item =>
          item.recordId ===
          "genesis-historical-education:lesson",
      );

    assert.ok(
      lesson,
    );

    assert.equal(
      lesson.learningRole,
      "LESSON",
    );

    assert.equal(
      lesson.title,
      "Historical lesson",
    );

    assert.equal(
      lesson.eventReferences[0]
        ?.summary,
      "Event for lesson",
    );

    assert.equal(
      lesson.sourceReferences[0]
        ?.sourceIdentity,
      "identity:lesson",
    );

    assert.deepEqual(
      lesson.relationshipIds,
      [
        "relationship:lesson",
      ],
    );
  },
);


test(
  "historical evidence cannot create current governing authority competency or activation",
  () => {
    const projected =
      records();

    const result =
      assembleEducationalCorpusHistoricalEvidence({
        records:
          projected,

        assessments:
          assessGenesisHistoricalEducationSources(
            projected,
          ),
      });

    assert.equal(
      result.governingAuthority,
      false,
    );

    assert.equal(
      result.educationalCorpusCertified,
      false,
    );

    assert.equal(
      result.initialCompetencyCertified,
      false,
    );

    assert.equal(
      result.chiefAgentActivationAuthorized,
      false,
    );

    for (
      const item
      of result.records
    ) {
      assert.equal(
        item.governingAuthority,
        false,
      );

      assert.equal(
        item.educationalCorpusCertified,
        false,
      );

      assert.equal(
        item.initialCompetencyCertified,
        false,
      );

      assert.equal(
        item.chiefAgentActivationAuthorized,
        false,
      );
    }
  },
);


test(
  "assembly is deterministic independent of record and assessment ordering",
  () => {
    const projected =
      records();

    const assessments =
      assessGenesisHistoricalEducationSources(
        projected,
      );

    const first =
      assembleEducationalCorpusHistoricalEvidence({
        records:
          projected,

        assessments,
      });

    const second =
      assembleEducationalCorpusHistoricalEvidence({
        records: [
          ...projected,
        ].reverse(),

        assessments: [
          ...assessments,
        ].reverse(),
      });

    assert.equal(
      first.historicalEvidenceId,
      second.historicalEvidenceId,
    );

    assert.deepEqual(
      first,
      second,
    );
  },
);


test(
  "assembly fails closed when a historical record has no governed assessment",
  () => {
    const projected =
      records();

    const assessments =
      assessGenesisHistoricalEducationSources(
        projected,
      );

    assert.throws(
      () =>
        assembleEducationalCorpusHistoricalEvidence({
          records:
            projected,

          assessments:
            assessments.slice(
              1,
            ),
        }),
      /assessment_missing/,
    );
  },
);


test(
  "assembly fails closed when an assessment has no projected record",
  () => {
    const projected =
      records();

    const assessments =
      assessGenesisHistoricalEducationSources(
        projected,
      );

    assert.throws(
      () =>
        assembleEducationalCorpusHistoricalEvidence({
          records:
            projected.slice(
              1,
            ),

          assessments,
        }),
      /record_missing/,
    );
  },
);


test(
  "assembly fails closed when assessment identity does not match the projected episode",
  () => {
    const projected =
      records();

    const assessments =
      assessGenesisHistoricalEducationSources(
        projected,
      );

    const corrupted =
      assessments.map(
        assessment =>
          assessment.recordId ===
          "genesis-historical-education:context"
            ? {
                ...assessment,

                episodeId:
                  "different-episode",
              }
            : assessment,
      );

    assert.throws(
      () =>
        assembleEducationalCorpusHistoricalEvidence({
          records:
            projected,

          assessments:
            corrupted,
        }),
      /identity_mismatch/,
    );
  },
);


test(
  "assembly rejects duplicate historical record identities",
  () => {
    const projected =
      records();

    const duplicated = [
      ...projected,
      projected[0],
    ];

    assert.throws(
      () =>
        assembleEducationalCorpusHistoricalEvidence({
          records:
            duplicated,

          assessments:
            assessGenesisHistoricalEducationSources(
              projected,
            ),
        }),
      /duplicate_record_id/,
    );
  },
);
