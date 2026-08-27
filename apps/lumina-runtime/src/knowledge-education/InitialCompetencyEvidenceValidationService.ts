import {
  createInitialCompetencyEvidenceRecord,
  evidenceRequirementsForCompetency,
} from "./InitialCompetencyEvidenceContract.js";

import type {
  InitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";

import type {
  InitialCompetencyEvidencePersistenceStore,
} from "./InitialCompetencyEvidencePersistence.js";


export interface InitialCompetencyEvidenceValidationDecision {
  evidenceId:
    string;

  decision:
    "VALIDATED" |
    "REJECTED";

  validatedBy:
    string;

  validatedAt:
    number;
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
      `initial_competency_evidence_validation_${field}_required`,
    );
  }

  return normalized;
}


function validTimestamp(
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
      "initial_competency_evidence_validation_timestamp_invalid",
    );
  }

  return value;
}


export class InitialCompetencyEvidenceValidationService {
  constructor(
    private readonly persistence:
      InitialCompetencyEvidencePersistenceStore,
  ) {}


  list():
    readonly InitialCompetencyEvidenceRecord[] {
    return this.persistence
      .list();
  }


  get(
    evidenceId:
      string,
  ):
    InitialCompetencyEvidenceRecord |
    null {
    return this.persistence
      .get(
        evidenceId,
      );
  }


  submit(
    evidence:
      InitialCompetencyEvidenceRecord,
  ): InitialCompetencyEvidenceRecord {
    if (
      evidence.validationState !==
        "PENDING" ||
      evidence.validatedBy !==
        null ||
      evidence.validatedAt !==
        null
    ) {
      throw new Error(
        "initial_competency_evidence_submission_must_be_pending",
      );
    }

    const requirements =
      evidenceRequirementsForCompetency(
        evidence.competencyId,
      );

    if (
      requirements.length ===
        0
    ) {
      throw new Error(
        "initial_competency_evidence_requirement_missing",
      );
    }

    const sourceAccepted =
      requirements.some(
        requirement =>
          requirement
            .acceptedSources
            .includes(
              evidence.source,
            ),
      );

    if (
      !sourceAccepted
    ) {
      throw new Error(
        "initial_competency_evidence_source_not_allowed",
      );
    }

    if (
      this.persistence.get(
        evidence.evidenceId,
      )
    ) {
      throw new Error(
        "initial_competency_evidence_already_exists",
      );
    }

    this.persistence.save(
      evidence,
    );

    return evidence;
  }


  validate(
    decision:
      InitialCompetencyEvidenceValidationDecision,
  ): InitialCompetencyEvidenceRecord {
    const evidenceId =
      required(
        decision.evidenceId,
        "evidence_id",
      );

    const validatedBy =
      required(
        decision.validatedBy,
        "validated_by",
      );

    const validatedAt =
      validTimestamp(
        decision.validatedAt,
      );

    const existing =
      this.persistence.get(
        evidenceId,
      );

    if (
      !existing
    ) {
      throw new Error(
        "initial_competency_evidence_not_found",
      );
    }

    if (
      existing.validationState !==
        "PENDING"
    ) {
      throw new Error(
        "initial_competency_evidence_already_decided",
      );
    }

    const validated =
      createInitialCompetencyEvidenceRecord({
        evidenceId:
          existing.evidenceId,

        competencyId:
          existing.competencyId,

        source:
          existing.source,

        sourceRef:
          existing.sourceRef,

        claim:
          existing.claim,

        observedAt:
          existing.observedAt,

        validationState:
          decision.decision,

        validatedBy,

        validatedAt,
      });

    this.persistence.save(
      validated,
    );

    return validated;
  }
}
