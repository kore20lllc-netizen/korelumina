import type {
  GenesisDayZeroCertificationRuntimeProjection,
} from "../knowledge-preservation/genesis/index.js";

import type {
  EducationalArtifactProjection,
} from "./projection/index.js";


export const EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION =
  "educational-corpus-authority:v1" as const;


export type EducationalCorpusLearningRole =
  | "CURRENT_RULE"
  | "CONSTITUTIONAL_CURRICULUM"
  | "GOVERNING_ARCHITECTURE"
  | "CURRENT_CANONICAL_KNOWLEDGE"
  | "HISTORICAL_CONTEXT"
  | "DECISION_HISTORY"
  | "LESSON"
  | "FAILED_APPROACH"
  | "SUPERSEDED_APPROACH"
  | "GOVERNANCE";


export type EducationalCorpusAuthorityDecision =
  | "ELIGIBLE"
  | "REQUIRES_AUTHORITY_REVIEW"
  | "EXCLUDED"
  | "BLOCKED";


export interface EducationalCorpusAuthorityAssessment {
  policyVersion:
    typeof EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION;

  artifactId:
    string;

  decision:
    EducationalCorpusAuthorityDecision;

  learningRole:
    EducationalCorpusLearningRole |
    null;

  dayZeroCertificationId:
    string | null;

  authority: {
    authorityClass:
      string;

    approvalState:
      string;

    owner:
      string;

    scope:
      string;

    version:
      string;
  };

  reasons:
    readonly string[];
}


function normalized(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase();
}


function isUnavailable(
  value:
    string,
): boolean {
  const next =
    normalized(
      value,
    );

  return (
    next.length ===
      0 ||
    next ===
      "unavailable" ||
    next ===
      "unknown"
  );
}


function explicitRoleFromArtifact(
  artifact:
    EducationalArtifactProjection,
): EducationalCorpusLearningRole |
  null {
  /*
   * Only constitutionally unambiguous classes receive an
   * automatic educational role here.
   *
   * Historical/superseded/failed/current-policy distinctions
   * must not be inferred from chronology, titles, or canonical
   * status alone.
   */
  switch (
    artifact.kind
  ) {
    case "canon":
    case "constitution":
    case "amendment":
      return "CONSTITUTIONAL_CURRICULUM";

    case "architecture":
    case "reconciliation":
    case "adr":
    case "edr":
    case "specification":
    case "standard":
    case "security":
      return "GOVERNING_ARCHITECTURE";

    case "decision":
      return "DECISION_HISTORY";

    default:
      return null;
  }
}


export function assessEducationalCorpusAuthority(
  input: {
    artifact:
      EducationalArtifactProjection;

    dayZero:
      GenesisDayZeroCertificationRuntimeProjection;
  },
): EducationalCorpusAuthorityAssessment {
  const {
    artifact,
    dayZero,
  } = input;

  const reasons:
    string[] =
      [];

  if (
    dayZero.state !==
      "VALID" ||
    !dayZero.certification
  ) {
    reasons.push(
      "valid-day-zero-genesis-certification-required",
    );

    return {
      policyVersion:
        EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,

      artifactId:
        artifact.id,

      decision:
        "BLOCKED",

      learningRole:
        null,

      dayZeroCertificationId:
        dayZero.certification
          ?.certificationId ??
        null,

      authority: {
        authorityClass:
          artifact.authorityClass,

        approvalState:
          artifact.approvalState,

        owner:
          artifact.owner,

        scope:
          artifact.scope,

        version:
          artifact.version,
      },

      reasons,
    };
  }

  if (
    normalized(
      artifact.approvalState,
    ) !==
    "approved"
  ) {
    reasons.push(
      "educational-source-not-approved",
    );

    return {
      policyVersion:
        EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,

      artifactId:
        artifact.id,

      decision:
        "EXCLUDED",

      learningRole:
        null,

      dayZeroCertificationId:
        dayZero.certification
          .certificationId,

      authority: {
        authorityClass:
          artifact.authorityClass,

        approvalState:
          artifact.approvalState,

        owner:
          artifact.owner,

        scope:
          artifact.scope,

        version:
          artifact.version,
      },

      reasons,
    };
  }

  const missingAuthorityFields =
    [
      [
        "authorityClass",
        artifact.authorityClass,
      ],
      [
        "owner",
        artifact.owner,
      ],
      [
        "scope",
        artifact.scope,
      ],
      [
        "version",
        artifact.version,
      ],
    ]
      .filter(
        (
          entry,
        ) =>
          isUnavailable(
            entry[1],
          ),
      )
      .map(
        entry =>
          entry[0],
      );

  if (
    missingAuthorityFields.length >
    0
  ) {
    reasons.push(
      `educational-source-authority-incomplete:${missingAuthorityFields.join(",")}`,
    );

    return {
      policyVersion:
        EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,

      artifactId:
        artifact.id,

      decision:
        "REQUIRES_AUTHORITY_REVIEW",

      learningRole:
        null,

      dayZeroCertificationId:
        dayZero.certification
          .certificationId,

      authority: {
        authorityClass:
          artifact.authorityClass,

        approvalState:
          artifact.approvalState,

        owner:
          artifact.owner,

        scope:
          artifact.scope,

        version:
          artifact.version,
      },

      reasons,
    };
  }

  const learningRole =
    explicitRoleFromArtifact(
      artifact,
    );

  if (
    learningRole ===
      null
  ) {
    reasons.push(
      "educational-learning-role-not-explicitly-resolved",
    );

    return {
      policyVersion:
        EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,

      artifactId:
        artifact.id,

      decision:
        "REQUIRES_AUTHORITY_REVIEW",

      learningRole:
        null,

      dayZeroCertificationId:
        dayZero.certification
          .certificationId,

      authority: {
        authorityClass:
          artifact.authorityClass,

        approvalState:
          artifact.approvalState,

        owner:
          artifact.owner,

        scope:
          artifact.scope,

        version:
          artifact.version,
      },

      reasons,
    };
  }

  reasons.push(
    "educational-source-authority-complete",
  );

  reasons.push(
    `educational-learning-role:${learningRole}`,
  );

  return {
    policyVersion:
      EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,

    artifactId:
      artifact.id,

    decision:
      "ELIGIBLE",

    learningRole,

    dayZeroCertificationId:
      dayZero.certification
        .certificationId,

    authority: {
      authorityClass:
        artifact.authorityClass,

      approvalState:
        artifact.approvalState,

      owner:
        artifact.owner,

      scope:
        artifact.scope,

      version:
        artifact.version,
    },

    reasons,
  };
}
