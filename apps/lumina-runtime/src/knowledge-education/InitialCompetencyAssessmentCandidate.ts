import { createHash } from "node:crypto";

import type {
  EducationalRuntimeCompetency,
} from "./CertifiedEducationalCurriculum.js";

import type {
  EducationalCorpusCertificationRuntimeProjection,
} from "./EducationalCorpusCertificationService.js";

import type {
  KnowledgeEducationSnapshot,
} from "./KnowledgeEducationProjectionService.js";

import type {
  InitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";


export const INITIAL_COMPETENCY_ASSESSMENT_VERSION =
  "initial-competency-assessment:v1" as const;


export type InitialCompetencyAssessmentState =
  | "BLOCKED"
  | "INCOMPLETE"
  | "READY_FOR_HUMAN_REVIEW";


export interface InitialCompetencyAssessmentEntry {
  id:
    string;

  title:
    string;

  status:
    EducationalRuntimeCompetency["status"];

  evidence:
    string;

  resolved:
    boolean;
}


export interface InitialCompetencyAssessmentCandidate {
  candidateId:
    `initial-competency-assessment:${string}`;

  assessmentVersion:
    typeof INITIAL_COMPETENCY_ASSESSMENT_VERSION;

  state:
    InitialCompetencyAssessmentState;

  educationalCorpusCertificationId:
    string | null;

  competencies:
    readonly InitialCompetencyAssessmentEntry[];

  completedCompetencyIds:
    readonly string[];

  unresolvedCompetencyIds:
    readonly string[];

  blockers:
    readonly string[];

  humanReview: {
    required:
      true;

    available:
      boolean;
  };

  downstream: {
    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
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


export function buildInitialCompetencyAssessmentCandidate(
  input: {
    corpusCertification:
      EducationalCorpusCertificationRuntimeProjection;

    education:
      KnowledgeEducationSnapshot;

    evidence?:
      readonly InitialCompetencyEvidenceRecord[];
  },
): InitialCompetencyAssessmentCandidate {
  const certification =
    input
      .corpusCertification
      .certification;

  const certificationValid =
    input
      .corpusCertification
      .state ===
        "VALID" &&
    certification !==
      null;

  const validatedEvidenceByCompetency =
    new Map<
      string,
      InitialCompetencyEvidenceRecord[]
    >();

  for (
    const evidence
    of input.evidence ??
      []
  ) {
    if (
      evidence.validationState !==
        "VALIDATED"
    ) {
      continue;
    }

    const existing =
      validatedEvidenceByCompetency.get(
        evidence.competencyId,
      ) ??
      [];

    existing.push(
      evidence,
    );

    validatedEvidenceByCompetency.set(
      evidence.competencyId,
      existing,
    );
  }

  const competencies:
    InitialCompetencyAssessmentEntry[] =
      input
        .education
        .competencies
        .map(
          competency => {
            const validatedEvidence =
              validatedEvidenceByCompetency.get(
                competency.id,
              ) ??
              [];

            const resolvedByProjection =
              competency.status ===
                "completed";

            const resolvedByValidatedEvidence =
              validatedEvidence.length >
              0;

            return {
              id:
                competency.id,

              title:
                competency.title,

              status:
                resolvedByProjection ||
                resolvedByValidatedEvidence
                  ? "completed"
                  : competency.status,

              evidence:
                resolvedByValidatedEvidence
                  ? validatedEvidence
                      .map(
                        item =>
                          item.evidenceId,
                      )
                      .sort()
                      .join(", ")
                  : competency.evidence,

              resolved:
                resolvedByProjection ||
                resolvedByValidatedEvidence,
            };
          },
        )
        .sort(
          (
            left,
            right,
          ) =>
            left.id.localeCompare(
              right.id,
            ),
        );

  const completedCompetencyIds =
    competencies
      .filter(
        competency =>
          competency.resolved,
      )
      .map(
        competency =>
          competency.id,
      );

  const unresolvedCompetencyIds =
    competencies
      .filter(
        competency =>
          !competency.resolved,
      )
      .map(
        competency =>
          competency.id,
      );

  const blockers:
    string[] =
      [];

  if (
    !certificationValid
  ) {
    blockers.push(
      "valid-educational-corpus-certification-required",
    );
  }

  if (
    competencies.length ===
      0
  ) {
    blockers.push(
      "initial-competency-domains-unavailable",
    );
  }

  if (
    unresolvedCompetencyIds
      .length >
      0
  ) {
    blockers.push(
      "initial-competency-evidence-incomplete",
    );
  }

  let state:
    InitialCompetencyAssessmentState;

  if (
    !certificationValid
  ) {
    state =
      "BLOCKED";
  } else if (
    blockers.length >
      0
  ) {
    state =
      "INCOMPLETE";
  } else {
    state =
      "READY_FOR_HUMAN_REVIEW";
  }

  const educationalCorpusCertificationId =
    certification
      ?.certificationId ??
    null;

  const candidateId =
    `initial-competency-assessment:${hash({
      assessmentVersion:
        INITIAL_COMPETENCY_ASSESSMENT_VERSION,

      educationalCorpusCertificationId,

      competencies,

      state,
    })}` as const;

  return {
    candidateId,

    assessmentVersion:
      INITIAL_COMPETENCY_ASSESSMENT_VERSION,

    state,

    educationalCorpusCertificationId,

    competencies,

    completedCompetencyIds,

    unresolvedCompetencyIds,

    blockers: [
      ...new Set(
        blockers,
      ),
    ].sort(),

    humanReview: {
      required:
        true,

      available:
        state ===
          "READY_FOR_HUMAN_REVIEW",
    },

    downstream: {
      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  };
}
