import {
  createHash,
} from "node:crypto";

import type {
  EducationalCorpusCertificationCandidate,
} from "./EducationalCorpusCertificationCandidate.js";

import type {
  DayZeroEducationalCoverage,
} from "./DayZeroEducationalCoverage.js";


export const EDUCATIONAL_CORPUS_CERTIFICATION_VERSION =
  "educational-corpus-certification:v1" as const;


export type EducationalCorpusCertificationId =
  `educational-corpus-certification:${string}`;


export interface EducationalCorpusCertificationDecision {
  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;

  acknowledgedExcludedArtifactIds:
    readonly string[];
}


export interface EducationalCorpusCertification {
  certificationId:
    EducationalCorpusCertificationId;

  certificationVersion:
    typeof EDUCATIONAL_CORPUS_CERTIFICATION_VERSION;

  state:
    "CERTIFIED";

  candidateId:
    EducationalCorpusCertificationCandidate[
      "candidateId"
    ];

  corpusId:
    string;

  sourceContractId:
    string;

  dayZeroCertificationId:
    string;

  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;

  constitutionalCoverage: {
    satisfiedRequirements:
      readonly string[];

    requirementCount:
      number;

    completion:
      number;

    measurementVersion:
      "education-coverage-v1";
  };

  dayZeroCoverage?:
    DayZeroEducationalCoverage;

  acknowledgedExcludedArtifactIds:
    readonly string[];

  downstream: {
    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


export type EducationalCorpusCertificationValidationState =
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface EducationalCorpusCertificationValidation {
  state:
    EducationalCorpusCertificationValidationState;

  certificationId:
    EducationalCorpusCertificationId;

  currentCandidateId:
    EducationalCorpusCertificationCandidate[
      "candidateId"
    ];

  blockers:
    readonly string[];
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


function required(
  value:
    string,

  field:
    string,
): string {
  const normalized =
    value.trim();

  if (
    normalized.length ===
    0
  ) {
    throw new Error(
      `educational_corpus_certification_${field}_required`,
    );
  }

  return normalized;
}


function validateTimestamp(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new Error(
      "educational_corpus_certification_timestamp_invalid",
    );
  }

  return value;
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


function assertCandidateCertifiable(
  candidate:
    EducationalCorpusCertificationCandidate,
): void {
  if (
    candidate.state !==
      "READY"
  ) {
    throw new Error(
      "educational_corpus_certification_candidate_not_ready",
    );
  }

  if (
    !candidate.approval
      .available
  ) {
    throw new Error(
      "educational_corpus_certification_approval_not_available",
    );
  }

  if (
    candidate.exceptions.length >
      0
  ) {
    throw new Error(
      "educational_corpus_certification_candidate_has_exceptions",
    );
  }

  if (
    candidate.corpusId ===
      null
  ) {
    throw new Error(
      "educational_corpus_certification_corpus_missing",
    );
  }

  if (
    candidate.sourceContractId ===
      null
  ) {
    throw new Error(
      "educational_corpus_certification_source_contract_missing",
    );
  }

  if (
    candidate.dayZeroCertificationId ===
      null
  ) {
    throw new Error(
      "educational_corpus_certification_day_zero_certification_missing",
    );
  }

  if (
    candidate.coverage
      .constitutionalLiteracy
      .completion !==
      100
  ) {
    throw new Error(
      "educational_corpus_certification_constitutional_coverage_incomplete",
    );
  }

  if (
    candidate.coverage
      .constitutionalLiteracy
      .missingRequirements
      .length >
      0
  ) {
    throw new Error(
      "educational_corpus_certification_constitutional_requirements_missing",
    );
  }

  if (
    candidate.coverage
      .dayZero
      .completion !==
      100 ||
    candidate.coverage
      .dayZero
      .missingRequirements
      .length >
      0 ||
    candidate.coverage
      .dayZero
      .completeModules
      .length !==
    candidate.coverage
      .dayZero
      .requiredModules
      .length
  ) {
    throw new Error(
      "educational_corpus_certification_day_zero_coverage_incomplete",
    );
  }
}


function assertExactExcludedMaterialAcknowledgement(
  candidate:
    EducationalCorpusCertificationCandidate,

  decision:
    EducationalCorpusCertificationDecision,
): readonly string[] {
  const expected =
    sortedUnique(
      candidate
        .excludedMaterial
        .filter(
          item =>
            item.decision ===
              "EXCLUDED",
        )
        .map(
          item =>
            item.artifactId,
        ),
    );

  const acknowledged =
    sortedUnique(
      decision
        .acknowledgedExcludedArtifactIds,
    );

  if (
    acknowledged.length !==
      decision
        .acknowledgedExcludedArtifactIds
        .length
  ) {
    throw new Error(
      "educational_corpus_certification_duplicate_excluded_acknowledgement",
    );
  }

  if (
    expected.length !==
      acknowledged.length ||
    expected.some(
      (
        artifactId,
        index,
      ) =>
        artifactId !==
        acknowledged[
          index
        ],
    )
  ) {
    throw new Error(
      "educational_corpus_certification_excluded_acknowledgement_mismatch",
    );
  }

  return acknowledged;
}


export function certifyEducationalCorpus(
  input: {
    candidate:
      EducationalCorpusCertificationCandidate;

    decision:
      EducationalCorpusCertificationDecision;
  },
): EducationalCorpusCertification {
  assertCandidateCertifiable(
    input.candidate,
  );

  const certifiedBy =
    required(
      input.decision
        .certifiedBy,
      "certified_by",
    );

  const certifiedAt =
    validateTimestamp(
      input.decision
        .certifiedAt,
    );

  const reason =
    required(
      input.decision
        .reason,
      "reason",
    );

  const acknowledgedExcludedArtifactIds =
    assertExactExcludedMaterialAcknowledgement(
      input.candidate,
      input.decision,
    );

  const corpusId =
    input.candidate
      .corpusId;

  const sourceContractId =
    input.candidate
      .sourceContractId;

  const dayZeroCertificationId =
    input.candidate
      .dayZeroCertificationId;

  if (
    corpusId ===
      null ||
    sourceContractId ===
      null ||
    dayZeroCertificationId ===
      null
  ) {
    throw new Error(
      "educational_corpus_certification_provenance_missing",
    );
  }

  const constitutionalCoverage = {
    satisfiedRequirements:
      sortedUnique(
        input.candidate
          .coverage
          .constitutionalLiteracy
          .satisfiedRequirements,
      ),

    requirementCount:
      input.candidate
        .coverage
        .constitutionalLiteracy
        .requirementCount,

    completion:
      input.candidate
        .coverage
        .constitutionalLiteracy
        .completion,

    measurementVersion:
      input.candidate
        .coverage
        .constitutionalLiteracy
        .measurementVersion,
  };

  const dayZeroCoverage =
    input.candidate
      .coverage
      .dayZero;


  const certificationId =
    `educational-corpus-certification:${hash({
      certificationVersion:
        EDUCATIONAL_CORPUS_CERTIFICATION_VERSION,

      candidateId:
        input.candidate
          .candidateId,

      corpusId,

      sourceContractId,

      dayZeroCertificationId,

      certifiedBy,

      certifiedAt,

      reason,

      constitutionalCoverage,

      dayZeroCoverage,

      acknowledgedExcludedArtifactIds,
    })}` as EducationalCorpusCertificationId;

  return {
    certificationId,

    certificationVersion:
      EDUCATIONAL_CORPUS_CERTIFICATION_VERSION,

    state:
      "CERTIFIED",

    candidateId:
      input.candidate
        .candidateId,

    corpusId,

    sourceContractId,

    dayZeroCertificationId,

    certifiedBy,

    certifiedAt,

    reason,

    constitutionalCoverage,

    dayZeroCoverage,

    acknowledgedExcludedArtifactIds,

    downstream: {
      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  };
}


export function validateEducationalCorpusCertification(
  input: {
    certification:
      EducationalCorpusCertification;

    currentCandidate:
      EducationalCorpusCertificationCandidate;
  },
): EducationalCorpusCertificationValidation {
  const blockers:
    string[] =
      [];

  const current =
    input.currentCandidate;

  if (
    current.state !==
      "READY"
  ) {
    blockers.push(
      "current-educational-corpus-candidate-not-ready",
    );
  }

  if (
    current.candidateId !==
      input.certification
        .candidateId
  ) {
    blockers.push(
      "educational-corpus-certification-candidate-changed",
    );
  }

  if (
    current.corpusId !==
      input.certification
        .corpusId
  ) {
    blockers.push(
      "educational-corpus-changed",
    );
  }

  if (
    current.sourceContractId !==
      input.certification
        .sourceContractId
  ) {
    blockers.push(
      "educational-corpus-source-contract-changed",
    );
  }

  if (
    current.dayZeroCertificationId !==
      input.certification
        .dayZeroCertificationId
  ) {
    blockers.push(
      "day-zero-certification-changed",
    );
  }

  const currentCoverage =
    current.coverage
      .constitutionalLiteracy;

  if (
    currentCoverage
      .completion !==
      input.certification
        .constitutionalCoverage
        .completion ||
    currentCoverage
      .requirementCount !==
      input.certification
        .constitutionalCoverage
        .requirementCount ||
    currentCoverage
      .measurementVersion !==
      input.certification
        .constitutionalCoverage
        .measurementVersion
  ) {
    blockers.push(
      "educational-corpus-constitutional-coverage-changed",
    );
  }

  const currentSatisfied =
    sortedUnique(
      currentCoverage
        .satisfiedRequirements,
    );

  const certifiedSatisfied =
    sortedUnique(
      input.certification
        .constitutionalCoverage
        .satisfiedRequirements,
    );

  if (
    currentSatisfied.length !==
      certifiedSatisfied.length ||
    currentSatisfied.some(
      (
        requirementId,
        index,
      ) =>
        requirementId !==
        certifiedSatisfied[
          index
        ],
    )
  ) {
    blockers.push(
      "educational-corpus-constitutional-requirements-changed",
    );
  }

  const certifiedDayZeroCoverage =
    input.certification
      .dayZeroCoverage;

  if (
    !certifiedDayZeroCoverage
  ) {
    blockers.push(
      "educational-corpus-day-zero-coverage-not-certified",
    );
  } else if (
    JSON.stringify(
      stableNormalize(
        current.coverage
          .dayZero,
      ),
    ) !==
    JSON.stringify(
      stableNormalize(
        certifiedDayZeroCoverage,
      ),
    )
  ) {
    blockers.push(
      "educational-corpus-day-zero-coverage-changed",
    );

    for (
      const moduleId
      of current.coverage
        .dayZero
        .requiredModules
    ) {
      const currentModule =
        current.coverage
          .dayZero
          .modules[
            moduleId
          ];

      const certifiedModule =
        certifiedDayZeroCoverage
          .modules[
            moduleId
          ];

      if (
        !certifiedModule ||
        JSON.stringify(
          stableNormalize(
            currentModule,
          ),
        ) !==
        JSON.stringify(
          stableNormalize(
            certifiedModule,
          ),
        )
      ) {
        blockers.push(
          `educational-corpus-module-coverage-changed:${moduleId}`,
        );
      }
    }
  }


  const currentExcluded =
    sortedUnique(
      current
        .excludedMaterial
        .filter(
          item =>
            item.decision ===
              "EXCLUDED",
        )
        .map(
          item =>
            item.artifactId,
        ),
    );

  const certifiedExcluded =
    sortedUnique(
      input.certification
        .acknowledgedExcludedArtifactIds,
    );

  if (
    currentExcluded.length !==
      certifiedExcluded.length ||
    currentExcluded.some(
      (
        artifactId,
        index,
      ) =>
        artifactId !==
        certifiedExcluded[
          index
        ],
    )
  ) {
    blockers.push(
      "educational-corpus-excluded-material-set-changed",
    );
  }

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const state:
    EducationalCorpusCertificationValidationState =
      current.state !==
        "READY"
        ? "BLOCKED"
        : normalizedBlockers.length >
            0
          ? "STALE"
          : "VALID";

  return {
    state,

    certificationId:
      input.certification
        .certificationId,

    currentCandidateId:
      current.candidateId,

    blockers:
      normalizedBlockers,
  };
}
