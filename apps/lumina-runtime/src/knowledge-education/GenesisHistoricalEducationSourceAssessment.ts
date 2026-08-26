import type {
  EducationalCorpusLearningRole,
} from "./EducationalCorpusAuthorityPolicy.js";

import {
  classifyGenesisHistoricalEducationLearningRole,
} from "./GenesisHistoricalEducationLearningRole.js";

import type {
  GenesisHistoricalEducationRecord,
} from "./GenesisHistoricalEducationProjection.js";


export const GENESIS_HISTORICAL_EDUCATION_SOURCE_ASSESSMENT_VERSION =
  "genesis-historical-education-source-assessment:v1" as const;


export type GenesisHistoricalEducationAdmissionDecision =
  | "ELIGIBLE_HISTORICAL_EVIDENCE"
  | "BLOCKED";


export interface GenesisHistoricalEducationSourceAssessment {
  policyVersion:
    typeof GENESIS_HISTORICAL_EDUCATION_SOURCE_ASSESSMENT_VERSION;

  recordId:
    GenesisHistoricalEducationRecord["recordId"];

  replayId:
    string;

  episodeId:
    string;

  decision:
    GenesisHistoricalEducationAdmissionDecision;

  learningRole:
    Extract<
      EducationalCorpusLearningRole,
      | "HISTORICAL_CONTEXT"
      | "DECISION_HISTORY"
      | "LESSON"
      | "FAILED_APPROACH"
      | "SUPERSEDED_APPROACH"
    > |
    null;

  provenance: {
    sourceReferenceIds:
      readonly string[];

    sourceRevisionIds:
      readonly string[];

    eventIds:
      readonly string[];
  };

  temporalAuthority: {
    historicalStatus:
      GenesisHistoricalEducationRecord[
        "temporalAuthority"
      ][
        "historicalStatus"
      ];

    currentStatus:
      GenesisHistoricalEducationRecord[
        "temporalAuthority"
      ][
        "currentStatus"
      ];
  };

  /*
   * Historical educational admission does not create or imply
   * current governing authority.
   */
  governingAuthority:
    false;

  reasons:
    readonly string[];
}


export function assessGenesisHistoricalEducationSource(
  record:
    GenesisHistoricalEducationRecord,
): GenesisHistoricalEducationSourceAssessment {
  const reasons:
    string[] = [];

  /*
   * Only evidence inside the governed Genesis projection may be
   * assessed here.
   *
   * Missing provenance means the record cannot safely participate in
   * education, even as historical context.
   */
  if (
    record.sourceReferences.length ===
      0 ||
    record.eventReferences.length ===
      0
  ) {
    if (
      record.sourceReferences.length ===
      0
    ) {
      reasons.push(
        "genesis-historical-education-source-provenance-missing",
      );
    }

    if (
      record.eventReferences.length ===
      0
    ) {
      reasons.push(
        "genesis-historical-education-event-provenance-missing",
      );
    }

    return {
      policyVersion:
        GENESIS_HISTORICAL_EDUCATION_SOURCE_ASSESSMENT_VERSION,

      recordId:
        record.recordId,

      replayId:
        record.replayId,

      episodeId:
        record.episodeId,

      decision:
        "BLOCKED",

      learningRole:
        null,

      provenance: {
        sourceReferenceIds:
          record.sourceReferences.map(
            source =>
              source.sourceReferenceId,
          ),

        sourceRevisionIds:
          record.sourceReferences.map(
            source =>
              source.sourceRevisionId,
          ),

        eventIds:
          record.eventReferences.map(
            event =>
              event.eventId,
          ),
      },

      temporalAuthority: {
        historicalStatus:
          record.temporalAuthority
            .historicalStatus,

        currentStatus:
          record.temporalAuthority
            .currentStatus,
      },

      governingAuthority:
        false,

      reasons,
    };
  }

  const role =
    classifyGenesisHistoricalEducationLearningRole(
      record,
    );

  reasons.push(
    "certified-genesis-historical-provenance-present",
  );

  reasons.push(
    ...role.reasons,
  );

  reasons.push(
    "historical-evidence-does-not-create-current-authority",
  );

  return {
    policyVersion:
      GENESIS_HISTORICAL_EDUCATION_SOURCE_ASSESSMENT_VERSION,

    recordId:
      record.recordId,

    replayId:
      record.replayId,

    episodeId:
      record.episodeId,

    decision:
      "ELIGIBLE_HISTORICAL_EVIDENCE",

    learningRole:
      role.learningRole,

    provenance: {
      sourceReferenceIds:
        record.sourceReferences
          .map(
            source =>
              source.sourceReferenceId,
          )
          .sort(),

      sourceRevisionIds:
        record.sourceReferences
          .map(
            source =>
              source.sourceRevisionId,
          )
          .sort(),

      eventIds:
        record.eventReferences
          .map(
            event =>
              event.eventId,
          )
          .sort(),
    },

    temporalAuthority: {
      historicalStatus:
        record.temporalAuthority
          .historicalStatus,

      currentStatus:
        record.temporalAuthority
          .currentStatus,
    },

    governingAuthority:
      false,

    reasons,
  };
}


export function assessGenesisHistoricalEducationSources(
  records:
    readonly GenesisHistoricalEducationRecord[],
): readonly GenesisHistoricalEducationSourceAssessment[] {
  return records
    .map(
      assessGenesisHistoricalEducationSource,
    )
    .sort(
      (
        left,
        right,
      ) =>
        left.recordId.localeCompare(
          right.recordId,
        ),
    );
}
