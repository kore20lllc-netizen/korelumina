export const INITIAL_COMPETENCY_EVIDENCE_VERSION =
  "initial-competency-evidence:v1" as const;


export type InitialCompetencyEvidenceSource =
  | "canonical-knowledge"
  | "organizational-memory"
  | "runtime"
  | "mission"
  | "human-review";


export type InitialCompetencyEvidenceValidationState =
  | "PENDING"
  | "VALIDATED"
  | "REJECTED";


export interface InitialCompetencyEvidenceRecord {
  evidenceId:
    string;

  competencyId:
    string;

  source:
    InitialCompetencyEvidenceSource;

  sourceRef:
    string;

  claim:
    string;

  observedAt:
    number;

  validationState:
    InitialCompetencyEvidenceValidationState;

  validatedBy:
    string | null;

  validatedAt:
    number | null;
}


export interface InitialCompetencyEvidenceRequirement {
  requirementId:
    string;

  competencyId:
    string;

  description:
    string;

  acceptedSources:
    readonly InitialCompetencyEvidenceSource[];
}


export const initialCompetencyEvidenceRequirements:
  readonly InitialCompetencyEvidenceRequirement[] = [
    {
      requirementId:
        "governed-retrieval:authority-preserved",

      competencyId:
        "governed-retrieval",

      description:
        "Demonstrate retrieval in which governing authority, approval state, scope, and provenance remain visible to the consumer.",

      acceptedSources: [
        "canonical-knowledge",
        "organizational-memory",
        "human-review",
      ],
    },

    {
      requirementId:
        "runtime-truth-distinction:runtime-verification",

      competencyId:
        "runtime-truth-distinction",

      description:
        "Demonstrate that operational claims are verified against authoritative Runtime state rather than inferred from knowledge or memory.",

      acceptedSources: [
        "runtime",
        "human-review",
      ],
    },

    {
      requirementId:
        "mission-boundaries:governed-operation",

      competencyId:
        "mission-boundaries",

      description:
        "Demonstrate correct handling of mission ownership, delegation, execution boundaries, and required human approval.",

      acceptedSources: [
        "mission",
        "runtime",
        "human-review",
      ],
    },

    {
      requirementId:
        "explainable-grounding:governed-source-grounding",

      competencyId:
        "explainable-grounding",

      description:
        "Demonstrate an explainable output grounded in governed sources that cites provenance and explicitly identifies missing authority or knowledge when present.",

      acceptedSources: [
        "canonical-knowledge",
        "organizational-memory",
        "human-review",
      ],
    },
  ];


function requiredString(
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
      `initial_competency_evidence_${field}_required`,
    );
  }

  return normalized;
}


function validTimestamp(
  value:
    number,

  field:
    string,
): number {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new Error(
      `initial_competency_evidence_${field}_invalid`,
    );
  }

  return value;
}


export function createInitialCompetencyEvidenceRecord(
  input: {
    evidenceId:
      string;

    competencyId:
      string;

    source:
      InitialCompetencyEvidenceSource;

    sourceRef:
      string;

    claim:
      string;

    observedAt:
      number;

    validationState?:
      InitialCompetencyEvidenceValidationState;

    validatedBy?:
      string | null;

    validatedAt?:
      number | null;
  },
): InitialCompetencyEvidenceRecord {
  const validationState =
    input.validationState ??
    "PENDING";

  const validatedBy =
    input.validatedBy
      ?.trim() ||
    null;

  const validatedAt =
    input.validatedAt ??
    null;

  if (
    validationState ===
      "VALIDATED" &&
    (
      !validatedBy ||
      validatedAt ===
        null
    )
  ) {
    throw new Error(
      "initial_competency_evidence_validation_proof_required",
    );
  }

  if (
    validatedAt !==
      null
  ) {
    validTimestamp(
      validatedAt,
      "validated_at",
    );
  }

  return {
    evidenceId:
      requiredString(
        input.evidenceId,
        "id",
      ),

    competencyId:
      requiredString(
        input.competencyId,
        "competency_id",
      ),

    source:
      input.source,

    sourceRef:
      requiredString(
        input.sourceRef,
        "source_ref",
      ),

    claim:
      requiredString(
        input.claim,
        "claim",
      ),

    observedAt:
      validTimestamp(
        input.observedAt,
        "observed_at",
      ),

    validationState,

    validatedBy,

    validatedAt,
  };
}


export function evidenceRequirementsForCompetency(
  competencyId:
    string,
): readonly InitialCompetencyEvidenceRequirement[] {
  return initialCompetencyEvidenceRequirements
    .filter(
      requirement =>
        requirement.competencyId ===
          competencyId,
    )
    .map(
      requirement => ({
        ...requirement,

        acceptedSources: [
          ...requirement
            .acceptedSources,
        ],
      }),
    );
}
