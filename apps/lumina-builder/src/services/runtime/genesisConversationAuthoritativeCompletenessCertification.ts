import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";


export type GenesisConversationAuthoritativeCompletenessCertificationRuntimeState =
  | "UNSET"
  | "VALID"
  | "STALE"
  | "BLOCKED";


export interface GenesisConversationAuthoritativeCompletenessEvidence {
  state:
    "UNAVAILABLE"
    | "BLOCKED"
    | "READY_FOR_REVIEW";

  candidateId:
    string | null;

  reviewId:
    string | null;

  acquisitionId:
    string | null;

  acquisitionInventoryId:
    string;

  candidateConversationCount:
    number;

  acquiredConversationCount:
    number;

  projectCount:
    number;

  historicalSourceCount:
    number;

  evidenceCount:
    number;

  knownOmissionCount:
    number;

  gapCounts: {
    notYetAcquired:
      number;

    historicallyUnavailable:
      number;

    permissionBlocked:
      number;

    sourceUnavailable:
      number;
  };

  blockers:
    readonly string[];

  authoritativeCompletenessEvidenceCertified:
    false;

  authoritativeExpectedHistoryCreated:
    boolean;

  authoritativeExpectedHistoryCreationAvailable:
    false;

  dayZeroConversationCoverageCertified:
    false;

  promotionAvailable:
    false;
}


export interface GenesisConversationAuthoritativeCompletenessCertification {
  certificationId:
    string;

  certificationVersion:
    string;

  state:
    "CERTIFIED";

  candidateId:
    string;

  reviewId:
    string;

  acquisitionId:
    string;

  acquisitionInventoryId:
    string;

  candidateConversationCount:
    number;

  acquiredConversationCount:
    number;

  projectCount:
    number;

  historicalSourceCount:
    number;

  evidenceCount:
    number;

  knownOmissionCount:
    number;

  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;

  authoritativeExpectedHistoryCreated:
    false;

  dayZeroConversationCoverageCertified:
    false;

  promotionAvailable:
    false;
}


export interface GenesisConversationAuthoritativeCompletenessCertificationValidation {
  state:
    "VALID"
    | "STALE"
    | "BLOCKED";

  certificationId:
    string;

  blockers:
    readonly string[];
}


export interface GenesisConversationAuthoritativeCompletenessCertificationProjection {
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


export interface GenesisConversationAuthoritativeCompletenessCertificationDecisionInput {
  certifiedBy:
    string;

  certifiedAt:
    number;

  reason:
    string;
}


export class GenesisConversationAuthoritativeCompletenessCertificationApiError
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
      "GenesisConversationAuthoritativeCompletenessCertificationApiError";

    this.status =
      input.status;

    this.code =
      input.code;
  }
}


function errorCode(
  value:
    unknown,

  fallback:
    string,
): string {
  if (
    typeof value ===
      "object" &&
    value !==
      null &&
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


async function request(
  input:
    RequestInit,
): Promise<
  GenesisConversationAuthoritativeCompletenessCertificationProjection
> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/genesis/conversations/authoritative-completeness-certification`,
      input,
    );

  let body:
    unknown;

  try {
    body =
      await response.json();
  } catch {
    throw new GenesisConversationAuthoritativeCompletenessCertificationApiError({
      status:
        response.status,

      code:
        "genesis_conversation_authoritative_completeness_certification_invalid_json",
    });
  }

  if (
    !response.ok
  ) {
    throw new GenesisConversationAuthoritativeCompletenessCertificationApiError({
      status:
        response.status,

      code:
        errorCode(
          body,
          "genesis_conversation_authoritative_completeness_certification_request_failed",
        ),
    });
  }

  if (
    typeof body !==
      "object" ||
    body ===
      null ||
    (
      body as {
        ok?:
          unknown;
      }
    ).ok !==
      true ||
    typeof (
      body as {
        projection?:
          unknown;
      }
    ).projection !==
      "object" ||
    (
      body as {
        projection?:
          unknown;
      }
    ).projection ===
      null
  ) {
    throw new GenesisConversationAuthoritativeCompletenessCertificationApiError({
      status:
        response.status,

      code:
        "genesis_conversation_authoritative_completeness_certification_response_invalid",
    });
  }

  return (
    body as {
      projection:
        GenesisConversationAuthoritativeCompletenessCertificationProjection;
    }
  ).projection;
}


export async function getGenesisConversationAuthoritativeCompletenessCertification():
  Promise<
    GenesisConversationAuthoritativeCompletenessCertificationProjection
  > {
  return request({
    method:
      "GET",

    headers:
      getRuntimeCallerHeaders(),
  });
}


export async function certifyGenesisConversationAuthoritativeCompleteness(
  input:
    GenesisConversationAuthoritativeCompletenessCertificationDecisionInput,
): Promise<
  GenesisConversationAuthoritativeCompletenessCertificationProjection
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
        input,
      ),
  });
}
