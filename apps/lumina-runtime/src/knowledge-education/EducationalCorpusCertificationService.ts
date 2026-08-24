import {
  certifyEducationalCorpus,
  validateEducationalCorpusCertification,
} from "./EducationalCorpusCertification.js";

import type {
  EducationalCorpusCertification,
  EducationalCorpusCertificationDecision,
  EducationalCorpusCertificationValidation,
} from "./EducationalCorpusCertification.js";

import type {
  EducationalCorpusCertificationCandidate,
} from "./EducationalCorpusCertificationCandidate.js";

import type {
  EducationalCorpusCertificationPersistenceStore,
} from "./EducationalCorpusCertificationPersistence.js";


export type EducationalCorpusCertificationRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface EducationalCorpusCertificationRuntimeProjection {
  state:
    EducationalCorpusCertificationRuntimeState;

  candidate:
    EducationalCorpusCertificationCandidate |
    null;

  certification:
    EducationalCorpusCertification |
    null;

  validation:
    EducationalCorpusCertificationValidation |
    null;

  downstream: {
    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


export interface EducationalCorpusCertificationCandidateReader {
  readCurrentCandidate():
    EducationalCorpusCertificationCandidate |
    null;
}


export class EducationalCorpusCertificationService {
  constructor(
    private readonly persistence:
      EducationalCorpusCertificationPersistenceStore,

    private readonly candidateReader:
      EducationalCorpusCertificationCandidateReader,
  ) {}


  read():
    EducationalCorpusCertificationRuntimeProjection {
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
      validateEducationalCorpusCertification({
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
          false,

        chiefAgentActivationAuthorized:
          false,
      },
    };
  }


  certify(
    decision:
      EducationalCorpusCertificationDecision,
  ): EducationalCorpusCertificationRuntimeProjection {
    const candidate =
      this.candidateReader
        .readCurrentCandidate();

    if (
      !candidate
    ) {
      throw new Error(
        "educational_corpus_certification_candidate_unavailable",
      );
    }

    const certification =
      certifyEducationalCorpus({
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
