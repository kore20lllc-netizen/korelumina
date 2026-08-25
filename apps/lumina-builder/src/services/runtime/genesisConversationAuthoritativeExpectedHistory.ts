import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

import type {
  GenesisConversationAuthoritativeCompletenessCertificationProjection,
} from "@/services/runtime/genesisConversationAuthoritativeCompletenessCertification";


export interface GenesisConversationExpectedHistoryProjection {
  expectedHistory: {
    inventoryId:
      string;

    authority: {
      authorityId:
        string;

      authorityClass:
        string;

      certifiedBy:
        string;

      certifiedAt:
        number;

      scope:
        string;

      version:
        string;
    };

    historicalStart:
      number | null;

    historicalEnd:
      number | null;

    conversations:
      readonly {
        conversationId:
          string;

        disposition:
          "EXPECTED_RECOVERABLE"
          | "HISTORICALLY_UNAVAILABLE";

        projectId?:
          string;

        sourceLocator?:
          string;

        firstKnownAt?:
          number;

        lastKnownAt?:
          number;

        basis:
          string;
      }[];
  } | null;

  acquisitionInventory: {
    inventoryId:
      string;

    conversationCount:
      number;
  };

  reconciliation: {
    state:
      "COMPLETE"
      | "INCOMPLETE"
      | "BLOCKED";

    expectedRecoverableConversationIds:
      readonly string[];

    acquiredExpectedConversationIds:
      readonly string[];

    notYetAcquiredConversationIds:
      readonly string[];

    historicallyUnavailableConversationIds:
      readonly string[];

    unexpectedAcquiredConversationIds:
      readonly string[];

    blockers:
      readonly string[];

    dayZeroConversationCoverageCertified:
      false;
  } | null;
}


export class GenesisConversationAuthoritativeExpectedHistoryApiError
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
      "GenesisConversationAuthoritativeExpectedHistoryApiError";

    this.status =
      input.status;

    this.code =
      input.code;
  }
}


async function parseBody(
  response:
    Response,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new GenesisConversationAuthoritativeExpectedHistoryApiError({
      status:
        response.status,

      code:
        "genesis_conversation_authoritative_expected_history_invalid_json",
    });
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


export async function getGenesisConversationExpectedHistory():
  Promise<
    GenesisConversationExpectedHistoryProjection
  > {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/genesis/conversations/expected-history`,
      {
        method:
          "GET",

        headers:
          getRuntimeCallerHeaders(),
      },
    );

  const body =
    await parseBody(
      response,
    );

  if (
    !response.ok
  ) {
    throw new GenesisConversationAuthoritativeExpectedHistoryApiError({
      status:
        response.status,

      code:
        errorCode(
          body,
          "genesis_conversation_expected_history_read_failed",
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
      true
  ) {
    throw new GenesisConversationAuthoritativeExpectedHistoryApiError({
      status:
        response.status,

      code:
        "genesis_conversation_expected_history_response_invalid",
    });
  }

  return (
    body as {
      projection:
        GenesisConversationExpectedHistoryProjection;
    }
  ).projection;
}


export async function getGenesisConversationCompletenessCertificationForExpectedHistory():
  Promise<
    GenesisConversationAuthoritativeCompletenessCertificationProjection
  > {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/genesis/conversations/authoritative-completeness-certification`,
      {
        method:
          "GET",

        headers:
          getRuntimeCallerHeaders(),
      },
    );

  const body =
    await parseBody(
      response,
    );

  if (
    !response.ok
  ) {
    throw new GenesisConversationAuthoritativeExpectedHistoryApiError({
      status:
        response.status,

      code:
        errorCode(
          body,
          "genesis_conversation_authoritative_completeness_certification_read_failed",
        ),
    });
  }

  return (
    body as {
      projection:
        GenesisConversationAuthoritativeCompletenessCertificationProjection;
    }
  ).projection;
}


export async function createGenesisConversationAuthoritativeExpectedHistory():
  Promise<
    GenesisConversationExpectedHistoryProjection
  > {
  const response =
    await fetch(
      `${RUNTIME_API}/api/runtime/genesis/conversations/expected-history/create-from-certified-completeness`,
      {
        method:
          "POST",

        headers:
          getRuntimeCallerHeaders(),
      },
    );

  const body =
    await parseBody(
      response,
    );

  if (
    !response.ok
  ) {
    throw new GenesisConversationAuthoritativeExpectedHistoryApiError({
      status:
        response.status,

      code:
        errorCode(
          body,
          "genesis_conversation_authoritative_expected_history_create_failed",
        ),
    });
  }

  return (
    body as {
      projection:
        GenesisConversationExpectedHistoryProjection;
    }
  ).projection;
}
