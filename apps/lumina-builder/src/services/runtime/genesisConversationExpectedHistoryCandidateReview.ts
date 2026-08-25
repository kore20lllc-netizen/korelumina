import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";


export type GenesisConversationHistoryCandidateReviewState =
  | "PENDING_REVIEW"
  | "SCOPE_ATTESTED"
  | "GAPS_DECLARED"
  | "REJECTED";


export type GenesisConversationHistoryCandidateReviewDecision =
  | "ATTEST_SCOPE"
  | "DECLARE_GAPS"
  | "REJECT";


export interface GenesisConversationHistoryKnownOmission {
  description:
    string;

  projectId?:
    string;

  conversationId?:
    string;

  basis:
    string;
}


export interface GenesisConversationHistoryCandidateReview {
  reviewId:
    string;

  candidateId:
    string;

  state:
    GenesisConversationHistoryCandidateReviewState;

  reviewedBy:
    string | null;

  reviewedAt:
    number | null;

  candidateConversationCount:
    number;

  candidateProjectIds:
    readonly string[];

  knownOmissions:
    readonly GenesisConversationHistoryKnownOmission[];

  notes:
    string | null;

  authoritativeExpectedHistoryCreated:
    false;

  dayZeroConversationCoverageCertified:
    false;

  promotionAvailable:
    false;
}


export interface GenesisConversationHistoryCandidateReviewDecisionInput {
  decision:
    GenesisConversationHistoryCandidateReviewDecision;

  reviewedBy:
    string;

  knownOmissions?:
    readonly GenesisConversationHistoryKnownOmission[];

  notes?:
    string;
}


export class GenesisConversationHistoryCandidateReviewApiError
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
      "GenesisConversationHistoryCandidateReviewApiError";

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
    throw new GenesisConversationHistoryCandidateReviewApiError({
      status:
        response.status,

      code:
        "genesis_conversation_history_candidate_review_invalid_json",
    });
  }
}


function isReview(
  value:
    unknown,
): value is GenesisConversationHistoryCandidateReview {
  if (
    typeof value !==
      "object" ||
    value ===
      null
  ) {
    return false;
  }

  const review =
    value as Partial<
      GenesisConversationHistoryCandidateReview
    >;

  return (
    typeof review.reviewId ===
      "string" &&
    typeof review.candidateId ===
      "string" &&
    (
      review.state ===
        "PENDING_REVIEW" ||
      review.state ===
        "SCOPE_ATTESTED" ||
      review.state ===
        "GAPS_DECLARED" ||
      review.state ===
        "REJECTED"
    ) &&
    typeof review.candidateConversationCount ===
      "number" &&
    Array.isArray(
      review.candidateProjectIds,
    ) &&
    Array.isArray(
      review.knownOmissions,
    ) &&
    review.authoritativeExpectedHistoryCreated ===
      false &&
    review.dayZeroConversationCoverageCertified ===
      false &&
    review.promotionAvailable ===
      false
  );
}


function isResponse(
  value:
    unknown,
): value is {
  ok:
    true;

  review:
    GenesisConversationHistoryCandidateReview;
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

      review?:
        unknown;
    };

  return (
    response.ok ===
      true &&
    isReview(
      response.review,
    )
  );
}


async function request(
  input:
    RequestInit,
): Promise<
  GenesisConversationHistoryCandidateReview
> {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/genesis/conversations/expected-history-candidate/review`,
      input,
    );

  const body =
    await readBody(
      response,
    );

  if (
    !response.ok
  ) {
    throw new GenesisConversationHistoryCandidateReviewApiError({
      status:
        response.status,

      code:
        errorCode(
          body,
          "genesis_conversation_history_candidate_review_request_failed",
        ),
    });
  }

  if (
    !isResponse(
      body,
    )
  ) {
    throw new GenesisConversationHistoryCandidateReviewApiError({
      status:
        response.status,

      code:
        "genesis_conversation_history_candidate_review_response_invalid",
    });
  }

  return body.review;
}


export async function getGenesisConversationHistoryCandidateReview():
  Promise<
    GenesisConversationHistoryCandidateReview
  > {
  return request({
    method:
      "GET",

    headers:
      getRuntimeCallerHeaders(),
  });
}


export async function decideGenesisConversationHistoryCandidateReview(
  input:
    GenesisConversationHistoryCandidateReviewDecisionInput,
): Promise<
  GenesisConversationHistoryCandidateReview
> {
  return request({
    method:
      "POST",

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
