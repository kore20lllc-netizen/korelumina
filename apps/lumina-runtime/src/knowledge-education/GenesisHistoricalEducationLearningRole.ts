import type {
  EducationalCorpusLearningRole,
} from "./EducationalCorpusAuthorityPolicy.js";

import type {
  GenesisHistoricalEducationRecord,
} from "./GenesisHistoricalEducationProjection.js";


export const GENESIS_HISTORICAL_EDUCATION_LEARNING_ROLE_POLICY_VERSION =
  "genesis-historical-education-learning-role:v1" as const;


export interface GenesisHistoricalEducationLearningRoleAssessment {
  policyVersion:
    typeof GENESIS_HISTORICAL_EDUCATION_LEARNING_ROLE_POLICY_VERSION;

  recordId:
    GenesisHistoricalEducationRecord["recordId"];

  learningRole:
    Extract<
      EducationalCorpusLearningRole,
      | "HISTORICAL_CONTEXT"
      | "DECISION_HISTORY"
      | "LESSON"
      | "FAILED_APPROACH"
      | "SUPERSEDED_APPROACH"
    >;

  reasons:
    readonly string[];
}


export function classifyGenesisHistoricalEducationLearningRole(
  record:
    GenesisHistoricalEducationRecord,
): GenesisHistoricalEducationLearningRoleAssessment {
  const kinds =
    new Set(
      record.eventReferences.map(
        event =>
          event.kind,
      ),
    );

  const reasons:
    string[] = [];

  if (
    record.lifecycle ===
      "superseded"
  ) {
    reasons.push(
      "genesis-episode-lifecycle:superseded",
    );

    return {
      policyVersion:
        GENESIS_HISTORICAL_EDUCATION_LEARNING_ROLE_POLICY_VERSION,

      recordId:
        record.recordId,

      learningRole:
        "SUPERSEDED_APPROACH",

      reasons,
    };
  }

  if (
    kinds.has(
      "lesson-recorded",
    )
  ) {
    reasons.push(
      "genesis-event:lesson-recorded",
    );

    return {
      policyVersion:
        GENESIS_HISTORICAL_EDUCATION_LEARNING_ROLE_POLICY_VERSION,

      recordId:
        record.recordId,

      learningRole:
        "LESSON",

      reasons,
    };
  }

  if (
    kinds.has(
      "decision-rejected",
    ) ||
    kinds.has(
      "test-failed",
    ) ||
    kinds.has(
      "visual-validation-failed",
    )
  ) {
    reasons.push(
      "genesis-explicit-failure-evidence",
    );

    return {
      policyVersion:
        GENESIS_HISTORICAL_EDUCATION_LEARNING_ROLE_POLICY_VERSION,

      recordId:
        record.recordId,

      learningRole:
        "FAILED_APPROACH",

      reasons,
    };
  }

  if (
    kinds.has(
      "decision-approved",
    ) ||
    kinds.has(
      "decision-rejected",
    )
  ) {
    reasons.push(
      "genesis-explicit-decision-evidence",
    );

    return {
      policyVersion:
        GENESIS_HISTORICAL_EDUCATION_LEARNING_ROLE_POLICY_VERSION,

      recordId:
        record.recordId,

      learningRole:
        "DECISION_HISTORY",

      reasons,
    };
  }

  reasons.push(
    "genesis-governed-historical-context",
  );

  return {
    policyVersion:
      GENESIS_HISTORICAL_EDUCATION_LEARNING_ROLE_POLICY_VERSION,

    recordId:
      record.recordId,

    learningRole:
      "HISTORICAL_CONTEXT",

    reasons,
  };
}
