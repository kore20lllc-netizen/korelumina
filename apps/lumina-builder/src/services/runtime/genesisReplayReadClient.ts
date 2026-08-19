export type GenesisReplayId =
  `genesis-replay:${string}`;

export type GenesisManifestReadiness =
  | "READY"
  | "BLOCKED";

export type GenesisReplayExecutionStatus =
  | "running"
  | "completed"
  | "failed";

export type GenesisCorpusCompletionStatus =
  | "INCOMPLETE"
  | "COMPLETE";

export type GenesisReplayRunnerOutcome =
  | "COMPLETED"
  | "FAILED";

export type GenesisReplayRecoveryEligibilityReason =
  | "ELIGIBLE"
  | "REPLAY_NOT_FOUND"
  | "EXECUTION_NOT_FOUND"
  | "ALREADY_COMPLETED"
  | "EXECUTION_NOT_RUNNING"
  | "CURRENT_POSITION_MISSING";

export interface GenesisReplayRecoveryEligibility {
  eligible:
    boolean;

  reason:
    GenesisReplayRecoveryEligibilityReason;
}

export interface GenesisReplayProgress {
  totalSources:
    number;

  completedSources:
    number;

  admittedSources:
    number;

  skippedSources:
    number;

  rejectedSources:
    number;
}

export interface GenesisReplayCheckpoint {
  replayId:
    GenesisReplayId;

  manifestId:
    string;

  replayContractVersion:
    string;

  lastCompletedManifestIndex:
    number;

  completedHistoricalSourceIds:
    readonly string[];

  completedSourceChecksums:
    readonly string[];

  admittedEvidenceIds:
    readonly string[];

  dispositions:
    readonly unknown[];

  checkpointedAt:
    number;
}

export interface GenesisReplayRunnerFailure {
  manifestIndex:
    number;

  historicalSourceId:
    string;

  message:
    string;
}

export interface GenesisReplayAdmissionLink {
  evidenceId:
    string;

  manufacturingRunId:
    string | null;

  linked:
    boolean;

  ambiguous:
    boolean;

  matchingManufacturingRunIds:
    readonly string[];

  status:
    string | null;

  currentStage:
    string | null;

  packageId:
    string | null;

  canonicalKnowledgeIds:
    readonly string[];
}

export interface GenesisReplayStatusSnapshot {
  replayId:
    GenesisReplayId;

  found:
    boolean;

  manifestPresent:
    boolean;

  executionPresent:
    boolean;

  manifestId:
    string | null;

  manifestReadiness:
    GenesisManifestReadiness |
    null;

  manifestErrors:
    number;

  totalManifestSources:
    number;

  executionStatus:
    GenesisReplayExecutionStatus |
    null;

  corpusStatus:
    GenesisCorpusCompletionStatus |
    null;

  currentManifestIndex:
    number | null;

  currentHistoricalSourceId:
    string | null;

  lastCompletedManifestIndex:
    number | null;

  progress:
    GenesisReplayProgress |
    null;

  checkpoint:
    GenesisReplayCheckpoint |
    null;

  runnerOutcome:
    GenesisReplayRunnerOutcome |
    null;

  runnerFailure:
    GenesisReplayRunnerFailure |
    null;

  recovery:
    GenesisReplayRecoveryEligibility;

  admittedEvidenceIds:
    readonly string[];

  admissionLinks:
    readonly GenesisReplayAdmissionLink[];

  allAdmittedEvidenceLinked:
    boolean;
}

export interface GenesisReplayInventory {
  total:
    number;

  replayIds:
    readonly GenesisReplayId[];

  replays:
    readonly GenesisReplayStatusSnapshot[];
}

export interface GenesisReplayInventorySuccessResponse {
  ok:
    true;

  inventory:
    GenesisReplayInventory;
}

export interface GenesisReplayStatusSuccessResponse {
  ok:
    true;

  status:
    GenesisReplayStatusSnapshot;
}

export interface GenesisReplayReadClientOptions {
  baseUrl:
    string;

  getHeaders?:
    () => HeadersInit;

  fetchImpl?:
    typeof fetch;
}

export class GenesisReplayReadApiError
  extends Error
{
  readonly status:
    number;

  readonly code:
    string;

  readonly replayId?:
    GenesisReplayId;

  constructor(
    input: {
      status:
        number;

      code:
        string;

      replayId?:
        GenesisReplayId;
    },
  ) {
    super(
      input.code,
    );

    this.name =
      "GenesisReplayReadApiError";

    this.status =
      input.status;

    this.code =
      input.code;

    this.replayId =
      input.replayId;
  }
}

export interface GenesisReplayReadClient {
  listReplays():
    Promise<
      GenesisReplayInventory
    >;

  getReplayStatus(
    replayId:
      GenesisReplayId,
  ):
    Promise<
      GenesisReplayStatusSnapshot
    >;
}

const REPLAY_ID_PATTERN =
  /^genesis-replay:[a-f0-9]{64}$/;

export function assertGenesisReplayId(
  replayId:
    string,
): asserts replayId is
  GenesisReplayId {
  if (
    !REPLAY_ID_PATTERN.test(
      replayId,
    )
  ) {
    throw new Error(
      "genesis_replay_id_invalid",
    );
  }
}

function trimTrailingSlash(
  value:
    string,
): string {
  return value.replace(
    /\/+$/,
    "",
  );
}

async function readJson(
  response:
    Response,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new GenesisReplayReadApiError({
      status:
        response.status,

      code:
        "genesis_replay_read_invalid_json",
    });
  }
}

function errorCodeFromBody(
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

function isInventorySuccess(
  body:
    unknown,
): body is
  GenesisReplayInventorySuccessResponse {
  if (
    typeof body !==
      "object" ||
    body ===
      null
  ) {
    return false;
  }

  const candidate =
    body as {
      ok?:
        unknown;

      inventory?: {
        total?:
          unknown;

        replayIds?:
          unknown;

        replays?:
          unknown;
      };
    };

  return (
    candidate.ok ===
      true &&
    typeof candidate
      .inventory
      ?.total ===
      "number" &&
    Array.isArray(
      candidate
        .inventory
        ?.replayIds,
    ) &&
    Array.isArray(
      candidate
        .inventory
        ?.replays,
    )
  );
}

function isStatusSuccess(
  body:
    unknown,
): body is
  GenesisReplayStatusSuccessResponse {
  if (
    typeof body !==
      "object" ||
    body ===
      null
  ) {
    return false;
  }

  const candidate =
    body as {
      ok?:
        unknown;

      status?: {
        replayId?:
          unknown;

        found?:
          unknown;
      };
    };

  return (
    candidate.ok ===
      true &&
    typeof candidate
      .status
      ?.replayId ===
      "string" &&
    typeof candidate
      .status
      ?.found ===
      "boolean"
  );
}

export function createGenesisReplayReadClient(
  options:
    GenesisReplayReadClientOptions,
): GenesisReplayReadClient {
  const baseUrl =
    trimTrailingSlash(
      options.baseUrl,
    );

  const fetchImpl =
    options.fetchImpl ??
    fetch;

  function headers():
    HeadersInit {
    return options
      .getHeaders?.() ??
      {};
  }

  return {
    async listReplays() {
      const response =
        await fetchImpl(
          `${baseUrl}/api/runtime/genesis/replays`,
          {
            method:
              "GET",

            headers:
              headers(),
          },
        );

      const body =
        await readJson(
          response,
        );

      if (
        !response.ok
      ) {
        throw new GenesisReplayReadApiError({
          status:
            response.status,

          code:
            errorCodeFromBody(
              body,
              "genesis_replay_inventory_read_failed",
            ),
        });
      }

      if (
        !isInventorySuccess(
          body,
        )
      ) {
        throw new GenesisReplayReadApiError({
          status:
            response.status,

          code:
            "genesis_replay_inventory_response_invalid",
        });
      }

      return body.inventory;
    },

    async getReplayStatus(
      replayId,
    ) {
      assertGenesisReplayId(
        replayId,
      );

      const response =
        await fetchImpl(
          `${baseUrl}/api/runtime/genesis/replays/${encodeURIComponent(
            replayId,
          )}/status`,
          {
            method:
              "GET",

            headers:
              headers(),
          },
        );

      const body =
        await readJson(
          response,
        );

      if (
        !response.ok
      ) {
        throw new GenesisReplayReadApiError({
          status:
            response.status,

          code:
            errorCodeFromBody(
              body,
              "genesis_replay_status_read_failed",
            ),

          replayId,
        });
      }

      if (
        !isStatusSuccess(
          body,
        ) ||
        body.status.replayId !==
          replayId
      ) {
        throw new GenesisReplayReadApiError({
          status:
            response.status,

          code:
            "genesis_replay_status_response_invalid",

          replayId,
        });
      }

      return body.status;
    },
  };
}
