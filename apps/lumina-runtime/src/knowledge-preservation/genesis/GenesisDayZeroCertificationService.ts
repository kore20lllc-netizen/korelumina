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

import {
  buildGenesisDayZeroCertificationApprovalProjection,
} from "./GenesisDayZeroCertificationApprovalProjection.js";

import type {
  GenesisDayZeroCertificationApprovalProjection,
} from "./GenesisDayZeroCertificationApprovalProjection.js";


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

  approval:
    GenesisDayZeroCertificationApprovalProjection;
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
      const projectionWithoutApproval = {
        state:
          "UNSET" as const,

        candidate,

        certification:
          null,

        validation:
          null,

        downstream: {
          educationalCorpusCertified:
            false as const,

          initialCompetencyCertified:
            false as const,

          chiefAgentActivationAuthorized:
            false as const,
        },
      };

      return {
        ...projectionWithoutApproval,

        approval:
          buildGenesisDayZeroCertificationApprovalProjection(
            projectionWithoutApproval,
          ),
      };
    }

    const validation =
      validateGenesisDayZeroCertification({
        certification,

        currentCandidate:
          candidate,
      });

    const projectionWithoutApproval = {
      state:
        validation.state,

      candidate,

      certification,

      validation,

      downstream: {
        educationalCorpusCertified:
          false as const,

        initialCompetencyCertified:
          false as const,

        chiefAgentActivationAuthorized:
          false as const,
      },
    };

    return {
      ...projectionWithoutApproval,

      approval:
        buildGenesisDayZeroCertificationApprovalProjection(
          projectionWithoutApproval,
        ),
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
