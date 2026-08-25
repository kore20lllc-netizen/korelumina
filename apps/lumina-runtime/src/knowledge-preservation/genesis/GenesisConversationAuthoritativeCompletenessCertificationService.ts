import {
  certifyGenesisConversationAuthoritativeCompleteness,
  validateGenesisConversationAuthoritativeCompletenessCertification,
} from "./GenesisConversationAuthoritativeCompletenessCertification.js";

import type {
  GenesisConversationAuthoritativeCompletenessCertification,
  GenesisConversationAuthoritativeCompletenessCertificationDecision,
  GenesisConversationAuthoritativeCompletenessCertificationValidation,
} from "./GenesisConversationAuthoritativeCompletenessCertification.js";

import type {
  GenesisConversationAuthoritativeCompletenessEvidence,
} from "./GenesisConversationAuthoritativeCompletenessEvidence.js";

import type {
  GenesisConversationAuthoritativeCompletenessEvidenceService,
} from "./GenesisConversationAuthoritativeCompletenessEvidenceService.js";

import type {
  GenesisConversationAuthoritativeCompletenessCertificationPersistenceStore,
} from "./GenesisConversationAuthoritativeCompletenessCertificationPersistence.js";


export type GenesisConversationAuthoritativeCompletenessCertificationRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface GenesisConversationAuthoritativeCompletenessCertificationRuntimeProjection {
  state:
    GenesisConversationAuthoritativeCompletenessCertificationRuntimeState;

  evidence:
    GenesisConversationAuthoritativeCompletenessEvidence;

  certification:
    GenesisConversationAuthoritativeCompletenessCertification |
    null;

  validation:
    GenesisConversationAuthoritativeCompletenessCertificationValidation |
    null;

  certificationAvailable:
    boolean;

  authoritativeExpectedHistoryCreated:
    boolean;

  authoritativeExpectedHistoryCreationAvailable:
    boolean;

  dayZeroConversationCoverageCertified:
    false;

  promotionAvailable:
    false;
}


export class GenesisConversationAuthoritativeCompletenessCertificationService {
  constructor(
    private readonly persistence:
      GenesisConversationAuthoritativeCompletenessCertificationPersistenceStore,

    private readonly evidenceService:
      GenesisConversationAuthoritativeCompletenessEvidenceService,
  ) {}


  read():
    GenesisConversationAuthoritativeCompletenessCertificationRuntimeProjection {
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

        authoritativeExpectedHistoryCreated:
          evidence.authoritativeExpectedHistoryCreated,

        authoritativeExpectedHistoryCreationAvailable:
          false,

        dayZeroConversationCoverageCertified:
          false,

        promotionAvailable:
          false,
      };
    }

    const validation =
      validateGenesisConversationAuthoritativeCompletenessCertification({
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

      authoritativeExpectedHistoryCreated:
        evidence.authoritativeExpectedHistoryCreated,

      authoritativeExpectedHistoryCreationAvailable:
        validation.state ===
          "VALID" &&
        !evidence.authoritativeExpectedHistoryCreated,

      dayZeroConversationCoverageCertified:
        false,

      promotionAvailable:
        false,
    };
  }


  certify(
    decision:
      GenesisConversationAuthoritativeCompletenessCertificationDecision,
  ):
    GenesisConversationAuthoritativeCompletenessCertificationRuntimeProjection {
    const existing =
      this.persistence
        .load();

    if (
      existing
    ) {
      throw new Error(
        "genesis_conversation_authoritative_completeness_certification_already_exists",
      );
    }

    const evidence =
      this.evidenceService
        .read();

    const certification =
      certifyGenesisConversationAuthoritativeCompleteness({
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
