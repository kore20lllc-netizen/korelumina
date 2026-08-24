import {
  certifyGenesisDayZero,
  validateGenesisDayZeroCertification,
} from "./GenesisDayZeroCertification.js";

import type {
  GenesisDayZeroCertification,
  GenesisDayZeroCertificationDecision,
  GenesisDayZeroCertificationValidation,
} from "./GenesisDayZeroCertification.js";

import type {
  GenesisDayZeroCertificationCandidate,
} from "./GenesisDayZeroCertificationCandidate.js";

import type {
  GenesisDayZeroCertificationPersistenceStore,
} from "./GenesisDayZeroCertificationPersistence.js";


export type GenesisDayZeroCertificationRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface GenesisDayZeroCertificationRuntimeProjection {
  state:
    GenesisDayZeroCertificationRuntimeState;

  candidate:
    GenesisDayZeroCertificationCandidate;

  certification:
    GenesisDayZeroCertification |
    null;

  validation:
    GenesisDayZeroCertificationValidation |
    null;

  downstream: {
    educationalCorpusCertified:
      false;

    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


export interface GenesisDayZeroCertificationCandidateReader {
  readCurrentCandidate():
    GenesisDayZeroCertificationCandidate;
}


export class GenesisDayZeroCertificationService {
  constructor(
    private readonly persistence:
      GenesisDayZeroCertificationPersistenceStore,

    private readonly candidateReader:
      GenesisDayZeroCertificationCandidateReader,
  ) {}


  read():
    GenesisDayZeroCertificationRuntimeProjection {
    const candidate =
      this.candidateReader
        .readCurrentCandidate();

    const certification =
      this.persistence
        .load();

    if (
      !certification
    ) {
      return {
        state:
          "UNSET",

        candidate,

        certification:
          null,

        validation:
          null,

        downstream: {
          educationalCorpusCertified:
            false,

          initialCompetencyCertified:
            false,

          chiefAgentActivationAuthorized:
            false,
        },
      };
    }

    const validation =
      validateGenesisDayZeroCertification({
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
        educationalCorpusCertified:
          false,

        initialCompetencyCertified:
          false,

        chiefAgentActivationAuthorized:
          false,
      },
    };
  }


  certify(
    decision:
      GenesisDayZeroCertificationDecision,
  ): GenesisDayZeroCertificationRuntimeProjection {
    const candidate =
      this.candidateReader
        .readCurrentCandidate();

    const certification =
      certifyGenesisDayZero({
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
