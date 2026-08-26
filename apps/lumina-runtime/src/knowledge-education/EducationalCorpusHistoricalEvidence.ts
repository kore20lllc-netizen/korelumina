import {
  createHash,
} from "node:crypto";

import type {
  EducationalCorpusLearningRole,
} from "./EducationalCorpusAuthorityPolicy.js";

import type {
  GenesisHistoricalEducationRecord,
} from "./GenesisHistoricalEducationProjection.js";

import type {
  GenesisHistoricalEducationSourceAssessment,
} from "./GenesisHistoricalEducationSourceAssessment.js";


export const EDUCATIONAL_CORPUS_HISTORICAL_EVIDENCE_VERSION =
  "educational-corpus-historical-evidence:v1" as const;


export type EducationalCorpusHistoricalEvidenceId =
  `educational-corpus-historical-evidence:${string}`;


export type EducationalCorpusHistoricalEvidenceRecordId =
  `educational-corpus-historical-evidence-record:${string}`;


export type HistoricalEducationalLearningRole =
  Extract<
    EducationalCorpusLearningRole,
    | "HISTORICAL_CONTEXT"
    | "DECISION_HISTORY"
    | "LESSON"
    | "FAILED_APPROACH"
    | "SUPERSEDED_APPROACH"
  >;


export interface EducationalCorpusHistoricalEvidenceRecord {
  evidenceRecordId:
    EducationalCorpusHistoricalEvidenceRecordId;

  recordId:
    GenesisHistoricalEducationRecord["recordId"];

  replayId:
    string;

  episodeId:
    string;

  episodeRevisionId:
    string;

  episodeKey:
    string;

  title:
    string;

  lifecycle:
    GenesisHistoricalEducationRecord["lifecycle"];

  externalContext:
    GenesisHistoricalEducationRecord["externalContext"];

  learningRole:
    HistoricalEducationalLearningRole;

  temporalAuthority:
    GenesisHistoricalEducationRecord["temporalAuthority"];

  eventReferences:
    GenesisHistoricalEducationRecord["eventReferences"];

  sourceReferences:
    GenesisHistoricalEducationRecord["sourceReferences"];

  relationshipIds:
    readonly string[];

  lineage:
    GenesisHistoricalEducationRecord["lineage"];

  assessment: {
    policyVersion:
      GenesisHistoricalEducationSourceAssessment["policyVersion"];

    decision:
      "ELIGIBLE_HISTORICAL_EVIDENCE";

    reasons:
      readonly string[];
  };

  governingAuthority:
    false;

  educationalCorpusCertified:
    false;

  initialCompetencyCertified:
    false;

  chiefAgentActivationAuthorized:
    false;
}


export interface EducationalCorpusHistoricalEvidence {
  historicalEvidenceId:
    EducationalCorpusHistoricalEvidenceId;

  version:
    typeof EDUCATIONAL_CORPUS_HISTORICAL_EVIDENCE_VERSION;

  records:
    readonly EducationalCorpusHistoricalEvidenceRecord[];

  summary: {
    assessedRecords:
      number;

    eligibleRecords:
      number;

    blockedRecords:
      number;

    byLearningRole:
      Readonly<
        Partial<
          Record<
            HistoricalEducationalLearningRole,
            number
          >
        >
      >;
  };

  governingAuthority:
    false;

  educationalCorpusCertified:
    false;

  initialCompetencyCertified:
    false;

  chiefAgentActivationAuthorized:
    false;
}


function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          key => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}


function hash(
  value:
    unknown,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        stableNormalize(
          value,
        ),
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}


function sortedUnique(
  values:
    readonly string[],
): readonly string[] {
  return [
    ...new Set(
      values,
    ),
  ].sort();
}


export function assembleEducationalCorpusHistoricalEvidence(
  input: {
    records:
      readonly GenesisHistoricalEducationRecord[];

    assessments:
      readonly GenesisHistoricalEducationSourceAssessment[];
  },
): EducationalCorpusHistoricalEvidence {
  const recordsById =
    new Map(
      input.records.map(
        record => [
          record.recordId,
          record,
        ],
      ),
    );

  if (
    recordsById.size !==
    input.records.length
  ) {
    throw new Error(
      "educational_corpus_historical_evidence_duplicate_record_id",
    );
  }

  const assessmentsByRecordId =
    new Map(
      input.assessments.map(
        assessment => [
          assessment.recordId,
          assessment,
        ],
      ),
    );

  if (
    assessmentsByRecordId.size !==
    input.assessments.length
  ) {
    throw new Error(
      "educational_corpus_historical_evidence_duplicate_assessment_record_id",
    );
  }

  /*
   * Historical education is fail-closed.
   *
   * Every projected record must have exactly one governed assessment,
   * and every assessment must resolve back to its projected record.
   */
  for (
    const record
    of input.records
  ) {
    if (
      !assessmentsByRecordId.has(
        record.recordId,
      )
    ) {
      throw new Error(
        `educational_corpus_historical_evidence_assessment_missing:${record.recordId}`,
      );
    }
  }

  for (
    const assessment
    of input.assessments
  ) {
    const record =
      recordsById.get(
        assessment.recordId,
      );

    if (
      !record
    ) {
      throw new Error(
        `educational_corpus_historical_evidence_record_missing:${assessment.recordId}`,
      );
    }

    if (
      record.replayId !==
        assessment.replayId ||
      record.episodeId !==
        assessment.episodeId
    ) {
      throw new Error(
        `educational_corpus_historical_evidence_identity_mismatch:${assessment.recordId}`,
      );
    }
  }

  const evidenceRecords:
    EducationalCorpusHistoricalEvidenceRecord[] =
      [];

  const sortedAssessments =
    [
      ...input.assessments,
    ].sort(
      (
        left,
        right,
      ) =>
        left.recordId.localeCompare(
          right.recordId,
        ),
    );

  for (
    const assessment
    of sortedAssessments
  ) {
    if (
      assessment.decision ===
        "BLOCKED"
    ) {
      continue;
    }

    if (
      assessment.learningRole ===
        null
    ) {
      throw new Error(
        `educational_corpus_historical_evidence_learning_role_missing:${assessment.recordId}`,
      );
    }

    if (
      assessment.governingAuthority !==
        false
    ) {
      throw new Error(
        `educational_corpus_historical_evidence_governing_authority_invalid:${assessment.recordId}`,
      );
    }

    const record =
      recordsById.get(
        assessment.recordId,
      );

    if (
      !record
    ) {
      throw new Error(
        `educational_corpus_historical_evidence_record_missing:${assessment.recordId}`,
      );
    }

    const sourceReferences =
      [
        ...record.sourceReferences,
      ].sort(
        (
          left,
          right,
        ) =>
          left.sourceReferenceId.localeCompare(
            right.sourceReferenceId,
          ),
      );

    const eventReferences =
      [
        ...record.eventReferences,
      ].sort(
        (
          left,
          right,
        ) =>
          left.occurredAt -
            right.occurredAt ||
          left.eventId.localeCompare(
            right.eventId,
          ),
      );

    const relationshipIds =
      sortedUnique(
        record.relationshipIds,
      );

    const lineage = {
      previousRevisionId:
        record.lineage
          .previousRevisionId,

      mergedFrom:
        sortedUnique(
          record.lineage
            .mergedFrom,
        ),

      splitFrom:
        record.lineage
          .splitFrom,

      supersedes:
        sortedUnique(
          record.lineage
            .supersedes,
        ),
    };

    const reasons =
      sortedUnique(
        assessment.reasons,
      );

    const identity = {
      recordId:
        record.recordId,

      replayId:
        record.replayId,

      episodeId:
        record.episodeId,

      episodeRevisionId:
        record.episodeRevisionId,

      learningRole:
        assessment.learningRole,

      policyVersion:
        assessment.policyVersion,

      sourceReferences,

      eventReferences,

      temporalAuthority:
        record.temporalAuthority,

      lineage,

      relationshipIds,

      reasons,
    };

    evidenceRecords.push({
      evidenceRecordId:
        `educational-corpus-historical-evidence-record:${hash(
          identity,
        )}` as EducationalCorpusHistoricalEvidenceRecordId,

      recordId:
        record.recordId,

      replayId:
        record.replayId,

      episodeId:
        record.episodeId,

      episodeRevisionId:
        record.episodeRevisionId,

      episodeKey:
        record.episodeKey,

      title:
        record.title,

      lifecycle:
        record.lifecycle,

      externalContext:
        record.externalContext,

      learningRole:
        assessment.learningRole,

      temporalAuthority: {
        ...record.temporalAuthority,
      },

      eventReferences,

      sourceReferences,

      relationshipIds,

      lineage,

      assessment: {
        policyVersion:
          assessment.policyVersion,

        decision:
          "ELIGIBLE_HISTORICAL_EVIDENCE",

        reasons,
      },

      governingAuthority:
        false,

      educationalCorpusCertified:
        false,

      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    });
  }

  evidenceRecords.sort(
    (
      left,
      right,
    ) =>
      left.learningRole.localeCompare(
        right.learningRole,
      ) ||
      left.recordId.localeCompare(
        right.recordId,
      ),
  );

  const byLearningRole:
    Partial<
      Record<
        HistoricalEducationalLearningRole,
        number
      >
    > = {};

  for (
    const record
    of evidenceRecords
  ) {
    byLearningRole[
      record.learningRole
    ] =
      (
        byLearningRole[
          record.learningRole
        ] ??
        0
      ) +
      1;
  }

  const blockedRecords =
    input.assessments.filter(
      assessment =>
        assessment.decision ===
        "BLOCKED",
    ).length;

  const summary = {
    assessedRecords:
      input.assessments.length,

    eligibleRecords:
      evidenceRecords.length,

    blockedRecords,

    byLearningRole,
  };

  const historicalEvidenceId =
    `educational-corpus-historical-evidence:${hash({
      version:
        EDUCATIONAL_CORPUS_HISTORICAL_EVIDENCE_VERSION,

      records:
        evidenceRecords,

      summary,
    })}` as EducationalCorpusHistoricalEvidenceId;

  return {
    historicalEvidenceId,

    version:
      EDUCATIONAL_CORPUS_HISTORICAL_EVIDENCE_VERSION,

    records:
      evidenceRecords,

    summary,

    governingAuthority:
      false,

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,

    chiefAgentActivationAuthorized:
      false,
  };
}
