import {
  certifyGenesisDayZeroConversationCoverage,
  validateGenesisDayZeroConversationCoverageCertification,
} from "./GenesisDayZeroConversationCoverageCertification.js";

import type {
  GenesisDayZeroConversationCoverageCertification,
  GenesisDayZeroConversationCoverageCertificationDecision,
  GenesisDayZeroConversationCoverageCertificationValidation,
} from "./GenesisDayZeroConversationCoverageCertification.js";

import type {
  GenesisDayZeroConversationCoverageEvidence,
} from "./GenesisDayZeroConversationCoverageEvidence.js";

import type {
  GenesisDayZeroConversationCoverageCertificationPersistenceStore,
} from "./GenesisDayZeroConversationCoverageCertificationPersistence.js";


export interface GenesisDayZeroConversationCoverageEvidenceReader {
  read():
    GenesisDayZeroConversationCoverageEvidence;
}


export type GenesisDayZeroConversationCoverageCertificationRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface GenesisDayZeroConversationCoverageCertificationRuntimeProjection {
  state:
    GenesisDayZeroConversationCoverageCertificationRuntimeState;

  evidence:
    GenesisDayZeroConversationCoverageEvidence;

  certification:
    GenesisDayZeroConversationCoverageCertification |
    null;

  validation:
    GenesisDayZeroConversationCoverageCertificationValidation |
    null;

  certificationAvailable:
    boolean;

  dayZeroConversationCoverageCertified:
    boolean;
}


export class GenesisDayZeroConversationCoverageCertificationService {
  constructor(
    private readonly persistence:
      GenesisDayZeroConversationCoverageCertificationPersistenceStore,

    private readonly evidenceService:
      GenesisDayZeroConversationCoverageEvidenceReader,
  ) {}


  read():
    GenesisDayZeroConversationCoverageCertificationRuntimeProjection {
    const evidence =
      this.evidenceService
        .read();

    const certification =
      this.persistence
        .load();

    if (
      !certification
    ) {
      return {
        state:
          "UNSET",

        evidence,

        certification:
          null,

        validation:
          null,

        certificationAvailable:
          evidence.state ===
            "READY_FOR_REVIEW",

        dayZeroConversationCoverageCertified:
          false,
      };
    }

    const validation =
      validateGenesisDayZeroConversationCoverageCertification({
        certification,

        currentEvidence:
          evidence,
      });

    return {
      state:
        validation.state,

      evidence,

      certification,

      validation,

      certificationAvailable:
        false,

      dayZeroConversationCoverageCertified:
        validation.state ===
          "VALID" &&
        certification
          .dayZeroConversationCoverageCertified,
    };
  }


  certify(
    decision:
      GenesisDayZeroConversationCoverageCertificationDecision,
  ):
    GenesisDayZeroConversationCoverageCertificationRuntimeProjection {
    const existing =
      this.persistence
        .load();

    if (
      existing
    ) {
      throw new Error(
        "genesis_day_zero_conversation_coverage_certification_already_exists",
      );
    }

    const evidence =
      this.evidenceService
        .read();

    const certification =
      certifyGenesisDayZeroConversationCoverage({
        evidence,

        decision,
      });

    this.persistence
      .save(
        certification,
      );

    return this.read();
  }
}
