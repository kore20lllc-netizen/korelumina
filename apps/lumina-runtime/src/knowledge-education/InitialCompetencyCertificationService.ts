import {
  certifyInitialCompetency,
  validateInitialCompetencyCertification,
} from "./InitialCompetencyCertification.js";

import type {
  InitialCompetencyCertification,
  InitialCompetencyCertificationDecision,
  InitialCompetencyCertificationValidation,
} from "./InitialCompetencyCertification.js";

import type {
  InitialCompetencyAssessmentCandidate,
} from "./InitialCompetencyAssessmentCandidate.js";

import type {
  InitialCompetencyCertificationPersistenceStore,
} from "./InitialCompetencyCertificationPersistence.js";


export type InitialCompetencyCertificationRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface InitialCompetencyCertificationRuntimeProjection {
  state:
    InitialCompetencyCertificationRuntimeState;

  candidate:
    InitialCompetencyAssessmentCandidate |
    null;

  certification:
    InitialCompetencyCertification |
    null;

  validation:
    InitialCompetencyCertificationValidation |
    null;

  downstream: {
    initialCompetencyCertified:
      boolean;

    chiefAgentActivationAuthorized:
      false;
  };
}


export interface InitialCompetencyCertificationCandidateReader {
  readCurrentCandidate():
    InitialCompetencyAssessmentCandidate |
    null;
}


export class InitialCompetencyCertificationService {
  constructor(
    private readonly persistence:
      InitialCompetencyCertificationPersistenceStore,

    private readonly candidateReader:
      InitialCompetencyCertificationCandidateReader,
  ) {}


  read():
    InitialCompetencyCertificationRuntimeProjection {
    const candidate =
      this.candidateReader
        .readCurrentCandidate();

    const certification =
      this.persistence
        .load();

    if (
      !candidate
    ) {
      return {
        state:
          "BLOCKED",

        candidate:
          null,

        certification,

        validation:
          null,

        downstream: {
          initialCompetencyCertified:
            false,

          chiefAgentActivationAuthorized:
            false,
        },
      };
    }

    if (
      !certification
    ) {
      return {
        state:
          candidate.state ===
            "BLOCKED"
            ? "BLOCKED"
            : "UNSET",

        candidate,

        certification:
          null,

        validation:
          null,

        downstream: {
          initialCompetencyCertified:
            false,

          chiefAgentActivationAuthorized:
            false,
        },
      };
    }

    const validation =
      validateInitialCompetencyCertification({
        certification,

        currentCandidate:
          candidate,
      });

    return {
      state:
        validation.state,

      candidate,

      certification,

      validation,

      downstream: {
        initialCompetencyCertified:
          validation.state ===
            "VALID",

        chiefAgentActivationAuthorized:
          false,
      },
    };
  }


  certify(
    decision:
      InitialCompetencyCertificationDecision,
  ): InitialCompetencyCertificationRuntimeProjection {
    const candidate =
      this.candidateReader
        .readCurrentCandidate();

    if (
      !candidate
    ) {
      throw new Error(
        "initial_competency_certification_candidate_unavailable",
      );
    }

    const certification =
      certifyInitialCompetency({
        candidate,

        decision,
      });

    this.persistence
      .save(
        certification,
      );

    return this.read();
  }
}
