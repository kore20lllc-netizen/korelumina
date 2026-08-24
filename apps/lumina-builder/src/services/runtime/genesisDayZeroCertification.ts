import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";


export type GenesisDayZeroCertificationRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export type GenesisDayZeroCertificationApprovalState =
  | "READY_FOR_SINGLE_APPROVAL"
  | "CERTIFIED"
  | "EXCEPTIONS_PRESENT"
  | "BLOCKED"
  | "STALE";


export interface GenesisDayZeroCertificationException {
  code:
    string;

  category:
    | "repository"
    | "conversation-acquisition"
    | "conversation-correlation"
    | "historical-link"
    | "episode-lineage"
    | "certification";

  subjectId:
    string | null;

  relatedId:
    string | null;
}


export interface GenesisDayZeroCertificationApprovalProjection {
  projectionId:
    string;

  state:
    GenesisDayZeroCertificationApprovalState;

  certificationState:
    GenesisDayZeroCertificationRuntimeState;

  candidateId:
    string;

  summary: {
    repositorySources:
      number | null;

    repositorySourcesCompleted:
      number | null;

    expectedRecoverableConversations:
      number;

    acquiredExpectedConversations:
      number;

    conversationManifestSources:
      number;

    admittedConversationSources:
      number;

    correlatedConversationSources:
      number;

    correlatedConversationEvents:
      number;

    historicalEvents:
      number;

    relationships:
      number;

    evolutionEpisodes:
      number;

    historicallyUnavailableConversations:
      number;

    unresolvedExceptions:
      number;
  };

  acknowledgedHistoricalGaps:
    readonly string[];

  exceptions:
    readonly GenesisDayZeroCertificationException[];

  approval: {
    singleHumanApprovalRequired:
      true;

    perConversationApprovalRequired:
      false;

    available:
      boolean;

    reason:
      string;
  };

  downstream: {
    educationalCorpusCertified:
      false;

    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


export interface GenesisDayZeroCertificationArtifact {
  certificationId:
    string;

  state:
    "CERTIFIED";

  candidateId:
    string;

  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;

  certifiedHistoricalGaps: {
    historicallyUnavailableConversationIds:
      readonly string[];
  };
}


export interface GenesisDayZeroCertificationRuntimeProjection {
  state:
    GenesisDayZeroCertificationRuntimeState;

  certification:
    GenesisDayZeroCertificationArtifact |
    null;

  approval:
    GenesisDayZeroCertificationApprovalProjection;

  downstream: {
    educationalCorpusCertified:
      false;

    initialCompetencyCertified:
      false;

    chiefAgentActivationAuthorized:
      false;
  };
}


export interface GenesisDayZeroCertificationDecisionInput {
  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;

  acknowledgedHistoricallyUnavailableConversationIds:
    readonly string[];
}


export class GenesisDayZeroCertificationApiError
  extends Error
{
  readonly status:
    number;

  readonly code:
    string;


  constructor(
    input: {
      status:
        number;

      code:
        string;
    },
  ) {
    super(
      input.code,
    );

    this.name =
      "GenesisDayZeroCertificationApiError";

    this.status =
      input.status;

    this.code =
      input.code;
  }
}


function errorCode(
  body:
    unknown,

  fallback:
    string,
): string {
  if (
    typeof body ===
      "object" &&
    body !==
      null &&
    "error" in body &&
    typeof (
      body as {
        error?:
          unknown;
      }
    ).error ===
      "string"
  ) {
    return (
      body as {
        error:
          string;
      }
    ).error;
  }

  return fallback;
}


async function readBody(
  response:
    Response,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new GenesisDayZeroCertificationApiError({
      status:
        response.status,

      code:
        "genesis_day_zero_certification_invalid_json",
    });
  }
}


function isProjectionResponse(
  value:
    unknown,
): value is {
  ok:
    true;

  projection:
    GenesisDayZeroCertificationRuntimeProjection;
} {
  if (
    typeof value !==
      "object" ||
    value ===
      null
  ) {
    return false;
  }

  const response =
    value as {
      ok?:
        unknown;

      projection?: {
        state?:
          unknown;

        approval?: {
          projectionId?:
            unknown;

          state?:
            unknown;

          candidateId?:
            unknown;

          summary?:
            unknown;

          approval?:
            unknown;

          exceptions?:
            unknown;
        };
      };
    };

  return (
    response.ok ===
      true &&
    typeof response
      .projection
      ?.state ===
      "string" &&
    typeof response
      .projection
      ?.approval
      ?.projectionId ===
      "string" &&
    typeof response
      .projection
      ?.approval
      ?.state ===
      "string" &&
    typeof response
      .projection
      ?.approval
      ?.candidateId ===
      "string" &&
    typeof response
      .projection
      ?.approval
      ?.summary ===
      "object" &&
    response
      .projection
      ?.approval
      ?.summary !==
      null &&
    typeof response
      .projection
      ?.approval
      ?.approval ===
      "object" &&
    response
      .projection
      ?.approval
      ?.approval !==
      null &&
    Array.isArray(
      response
        .projection
        ?.approval
        ?.exceptions,
    )
  );
}


async function request(
  input:
    RequestInit,
): Promise<
  GenesisDayZeroCertificationRuntimeProjection
> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/genesis/day-zero-certification`,
      input,
    );

  const body =
    await readBody(
      response,
    );

  if (
    !response.ok
  ) {
    throw new GenesisDayZeroCertificationApiError({
      status:
        response.status,

      code:
        errorCode(
          body,
          "genesis_day_zero_certification_request_failed",
        ),
    });
  }

  if (
    !isProjectionResponse(
      body,
    )
  ) {
    throw new GenesisDayZeroCertificationApiError({
      status:
        response.status,

      code:
        "genesis_day_zero_certification_response_invalid",
    });
  }

  return body.projection;
}


export async function getGenesisDayZeroCertification():
  Promise<
    GenesisDayZeroCertificationRuntimeProjection
  > {
  return request({
    method:
      "GET",

    headers:
      getRuntimeCallerHeaders(),
  });
}


export async function certifyGenesisDayZero(
  decision:
    GenesisDayZeroCertificationDecisionInput,
): Promise<
  GenesisDayZeroCertificationRuntimeProjection
> {
  return request({
    method:
      "PUT",

    headers:
      getRuntimeCallerHeaders({
        "Content-Type":
          "application/json",
      }),

    body:
      JSON.stringify(
        decision,
      ),
  });
}
