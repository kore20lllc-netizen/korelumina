import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";


export type EducationalCorpusRuntimeState =
  | "UNSET"
  | "CURRENT"
  | "STALE"
  | "INCOMPLETE"
  | "BLOCKED";


export type EducationalCorpusCertificationRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface EducationalCorpusCertificationException {
  code:
    string;

  category:
    | "corpus-state"
    | "authority-review"
    | "curriculum-coverage"
    | "provenance";

  subjectId:
    string | null;
}


export interface EducationalCorpusCertificationCandidate {
  candidateId:
    string;

  state:
    "READY"
    | "INCOMPLETE"
    | "BLOCKED";

  corpusId:
    string | null;

  sourceContractId:
    string | null;

  dayZeroCertificationId:
    string | null;

  coverage: {
    constitutionalLiteracy: {
      satisfiedRequirements:
        readonly string[];

      missingRequirements:
        readonly string[];

      satisfiedCount:
        number;

      requirementCount:
        number;

      completion:
        number;

      measurementVersion:
        "education-coverage-v1";
    };
  };

  summary: {
    sourceArtifacts:
      number;

    curriculumItems:
      number;

    unresolvedItems:
      number;

    excludedItems:
      number;

    blockedItems:
      number;

    exceptions:
      number;
  };

  excludedMaterial:
    readonly {
      artifactId:
        string;

      decision:
        "REQUIRES_AUTHORITY_REVIEW"
        | "EXCLUDED"
        | "BLOCKED";

      reasons:
        readonly string[];
    }[];

  exceptions:
    readonly EducationalCorpusCertificationException[];

  approval: {
    singleHumanApprovalRequired:
      true;

    perArtifactApprovalRequired:
      false;

    available:
      boolean;

    reason:
      string;
  };
}


export interface EducationalCorpusRuntimeProjection {
  state:
    EducationalCorpusRuntimeState;

  persistedCorpus:
    {
      corpusId:
        string;

      summary: {
        sourceArtifacts:
          number;

        curriculumItems:
          number;

        unresolvedItems:
          number;

        excludedItems:
          number;

        blockedItems:
          number;
      };
    } |
    null;

  currentCorpus:
    {
      corpusId:
        string;

      summary: {
        sourceArtifacts:
          number;

        curriculumItems:
          number;

        unresolvedItems:
          number;

        excludedItems:
          number;

        blockedItems:
          number;
      };
    } |
    null;

  blockers:
    readonly string[];

  unresolvedArtifactIds:
    readonly string[];

  certificationCandidate:
    EducationalCorpusCertificationCandidate |
    null;
}


export interface EducationalCorpusCertificationProjection {
  state:
    EducationalCorpusCertificationRuntimeState;

  candidate:
    EducationalCorpusCertificationCandidate |
    null;

  certification:
    {
      certificationId:
        string;

      state:
        "CERTIFIED";

      corpusId:
        string;

      certifiedBy:
        string;

      certifiedAt:
        number;

      reason:
        string;

      acknowledgedExcludedArtifactIds:
        readonly string[];
    } |
    null;

  validation:
    {
      state:
        "VALID"
        | "STALE"
        | "BLOCKED";

      blockers:
        readonly string[];
    } |
    null;

  downstream: {
    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


async function body(
  response:
    Response,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error(
      "education_runtime_invalid_json",
    );
  }
}


function projectionFrom<T>(
  value:
    unknown,

  fallback:
    string,
): T {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    throw new Error(
      fallback,
    );
  }

  const response =
    value as {
      ok?:
        unknown;

      projection?:
        unknown;

      error?:
        unknown;
    };

  if (
    response.ok !==
      true ||
    !response.projection
  ) {
    throw new Error(
      typeof response.error ===
        "string"
        ? response.error
        : fallback,
    );
  }

  return response.projection as T;
}


export async function getEducationalCorpus():
  Promise<
    EducationalCorpusRuntimeProjection
  > {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/education/corpus`,
      {
        method:
          "GET",

        cache:
          "no-store",
      },
    );

  const result =
    await body(
      response,
    );

  if (
    !response.ok
  ) {
    throw new Error(
      "educational_corpus_read_failed",
    );
  }

  return projectionFrom<
    EducationalCorpusRuntimeProjection
  >(
    result,
    "educational_corpus_response_invalid",
  );
}


export async function persistEducationalCorpus():
  Promise<
    EducationalCorpusRuntimeProjection
  > {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/education/corpus`,
      {
        method:
          "PUT",

        headers:
          getRuntimeCallerHeaders(),
      },
    );

  const result =
    await body(
      response,
    );

  if (
    !response.ok
  ) {
    throw new Error(
      projectionError(
        result,
        "educational_corpus_persist_failed",
      ),
    );
  }

  return projectionFrom<
    EducationalCorpusRuntimeProjection
  >(
    result,
    "educational_corpus_response_invalid",
  );
}


function projectionError(
  value:
    unknown,

  fallback:
    string,
): string {
  if (
    value &&
    typeof value ===
      "object" &&
    "error" in value &&
    typeof (
      value as {
        error?:
          unknown;
      }
    ).error ===
      "string"
  ) {
    return (
      value as {
        error:
          string;
      }
    ).error;
  }

  return fallback;
}


export async function getEducationalCorpusCertification():
  Promise<
    EducationalCorpusCertificationProjection
  > {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/education/corpus-certification`,
      {
        method:
          "GET",

        cache:
          "no-store",
      },
    );

  const result =
    await body(
      response,
    );

  if (
    !response.ok
  ) {
    throw new Error(
      projectionError(
        result,
        "educational_corpus_certification_read_failed",
      ),
    );
  }

  return projectionFrom<
    EducationalCorpusCertificationProjection
  >(
    result,
    "educational_corpus_certification_response_invalid",
  );
}


export async function certifyEducationalCorpus(
  input: {
    certifiedBy:
      string;

    reason:
      string;

    acknowledgedExcludedArtifactIds:
      readonly string[];
  },
): Promise<
  EducationalCorpusCertificationProjection
> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/knowledge/education/corpus-certification`,
      {
        method:
          "PUT",

        headers:
          getRuntimeCallerHeaders({
            "Content-Type":
              "application/json",
          }),

        body:
          JSON.stringify({
            certifiedBy:
              input.certifiedBy,

            certifiedAt:
              Date.now(),

            reason:
              input.reason,

            acknowledgedExcludedArtifactIds:
              input
                .acknowledgedExcludedArtifactIds,
          }),
      },
    );

  const result =
    await body(
      response,
    );

  if (
    !response.ok
  ) {
    throw new Error(
      projectionError(
        result,
        "educational_corpus_certification_write_failed",
      ),
    );
  }

  return projectionFrom<
    EducationalCorpusCertificationProjection
  >(
    result,
    "educational_corpus_certification_response_invalid",
  );
}
