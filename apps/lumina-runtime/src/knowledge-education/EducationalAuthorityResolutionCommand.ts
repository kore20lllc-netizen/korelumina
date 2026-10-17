import {
  createEducationalAuthorityResolution,
} from "./EducationalAuthorityResolution.js";

import type {
  EducationalAuthorityResolution,
} from "./EducationalAuthorityResolution.js";

import {
  EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,
} from "./EducationalCorpusAuthorityPolicy.js";

import type {
  EducationalCorpusLearningRole,
} from "./EducationalCorpusAuthorityPolicy.js";


/*
 * Governed recording of a human educational authority decision.
 *
 * The command never decides a learning role. It records the role a
 * human reviewer chose, bound to the current valid Day-0 Genesis
 * certification, and only for an artifact the current Educational
 * Corpus source contract reports as requiring authority review.
 *
 * It previews by default and writes only when confirmed.
 */

export const EDUCATIONAL_LEARNING_ROLES = [
  "CURRENT_RULE",
  "CONSTITUTIONAL_CURRICULUM",
  "GOVERNING_ARCHITECTURE",
  "CURRENT_CANONICAL_KNOWLEDGE",
  "HISTORICAL_CONTEXT",
  "DECISION_HISTORY",
  "LESSON",
  "FAILED_APPROACH",
  "SUPERSEDED_APPROACH",
  "GOVERNANCE",
] as const satisfies readonly EducationalCorpusLearningRole[];


export interface AuthorityCommandDayZero {
  state:
    string;

  certificationId:
    string | null;
}


export interface AuthorityCommandAssessment {
  artifactId:
    string;

  decision:
    string;

  learningRole:
    string | null;
}


export interface AuthorityCommandCorpus {
  state:
    string;

  assessments:
    readonly AuthorityCommandAssessment[];

  unresolvedArtifactIds:
    readonly string[];
}


export interface AuthorityCommandEnvironment {
  readDayZero():
    AuthorityCommandDayZero;

  readCorpus():
    AuthorityCommandCorpus;

  save(
    resolution:
      EducationalAuthorityResolution,
  ): EducationalAuthorityResolution;

  titleOf(
    artifactId:
      string,
  ): string | null;

  now():
    number;
}


export interface AuthorityCommandRequest {
  artifactId:
    string;

  learningRole:
    string;

  reviewerId:
    string;

  reason:
    string;

  confirm:
    boolean;
}


export type AuthorityCommandOutcome =
  | {
      status:
        "PREVIEW";
      resolution:
        EducationalAuthorityResolution;
      title:
        string | null;
      before:
        AuthorityCommandCorpus;
    }
  | {
      status:
        "RECORDED";
      resolution:
        EducationalAuthorityResolution;
      title:
        string | null;
      before:
        AuthorityCommandCorpus;
      after:
        AuthorityCommandCorpus;
    }
  | {
      status:
        "REFUSED";
      reason:
        string;
    };


function refuse(
  reason:
    string,
): AuthorityCommandOutcome {
  return {
    status:
      "REFUSED",
    reason,
  };
}


export function isEducationalLearningRole(
  value:
    string,
): value is EducationalCorpusLearningRole {
  return (
    EDUCATIONAL_LEARNING_ROLES as readonly string[]
  ).includes(
    value,
  );
}


export function runEducationalAuthorityResolutionCommand(
  request:
    AuthorityCommandRequest,

  environment:
    AuthorityCommandEnvironment,
): AuthorityCommandOutcome {
  const artifactId =
    request.artifactId.trim();

  const learningRole =
    request.learningRole.trim();

  const reviewerId =
    request.reviewerId.trim();

  const reason =
    request.reason.trim();

  if (
    !artifactId
  ) {
    return refuse(
      "artifact-required",
    );
  }

  if (
    !isEducationalLearningRole(
      learningRole,
    )
  ) {
    return refuse(
      "unknown-learning-role",
    );
  }

  if (
    !reviewerId
  ) {
    return refuse(
      "reviewer-required",
    );
  }

  if (
    !reason
  ) {
    return refuse(
      "reason-required",
    );
  }

  const dayZero =
    environment.readDayZero();

  if (
    dayZero.state !==
      "VALID" ||
    !dayZero.certificationId
  ) {
    return refuse(
      "valid-day-zero-genesis-certification-required",
    );
  }

  const before =
    environment.readCorpus();

  const assessment =
    before.assessments.find(
      candidate =>
        candidate.artifactId ===
          artifactId,
    );

  if (
    !assessment
  ) {
    return refuse(
      "artifact-not-in-current-educational-corpus-source-contract",
    );
  }

  if (
    assessment.decision !==
      "REQUIRES_AUTHORITY_REVIEW"
  ) {
    return refuse(
      "artifact-does-not-require-authority-review",
    );
  }

  const resolution =
    createEducationalAuthorityResolution({
      artifactId,
      learningRole,
      reviewerId,
      reviewedAt:
        environment.now(),
      reason,
      authorityPolicyVersion:
        EDUCATIONAL_CORPUS_AUTHORITY_POLICY_VERSION,
      dayZeroCertificationId:
        dayZero.certificationId,
    });

  const title =
    environment.titleOf(
      artifactId,
    );

  if (
    !request.confirm
  ) {
    return {
      status:
        "PREVIEW",
      resolution,
      title,
      before,
    };
  }

  const saved =
    environment.save(
      resolution,
    );

  return {
    status:
      "RECORDED",
    resolution:
      saved,
    title,
    before,
    after:
      environment.readCorpus(),
  };
}
