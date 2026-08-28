import type {
  Express,
  Request,
  RequestHandler,
  Response,
} from "express";

import type {
  KnowledgePreservationPlatform,
} from "../knowledge-preservation/bootstrap/index.js";

import {
  allGenesisEvidenceTypes,
  runGovernedGenesisReplay,
  validateGenesisReplayScope,
} from "../knowledge-preservation/genesis/index.js";

import type {
  FileGenesisReplayPersistenceStore,
  GenesisConversationReplayEvidenceResolver,
  GenesisHistoricalCorrelationState,
  GenesisProductionReplayReprocessingRequest,
  GenesisReplayOrchestratorMode,
  GenesisReplayOrchestratorResult,
  GenesisReplayScope,
  HistoricalSourceDiscoverer,
} from "../knowledge-preservation/genesis/index.js";

import {
  requireRuntimeAccess,
} from "./runtimeAccess.js";

export interface GenesisReplayExecutionRouteRuntime {
  persistenceStore:
    FileGenesisReplayPersistenceStore;

  platform:
    KnowledgePreservationPlatform;

  repositoryRoot:
    string;

  now():
    number;

  additionalDiscoverers?:
    readonly HistoricalSourceDiscoverer[];

  conversationEvidenceResolver?:
    GenesisConversationReplayEvidenceResolver;

  priorHistoricalCorrelation?():
    GenesisHistoricalCorrelationState |
    null;

  execute?:
    typeof runGovernedGenesisReplay;
}

interface GenesisReplayExecutionRequestBody {
  mode:
    GenesisReplayOrchestratorMode;

  scope:
    GenesisReplayScope;

  authorizeProductionAdmission:
    boolean;

  reprocessing?:
    GenesisProductionReplayReprocessingRequest;
}

function record(
  value:
    unknown,
): Record<
  string,
  unknown
> {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "genesis_replay_execution_body_invalid",
    );
  }

  return value as Record<
    string,
    unknown
  >;
}

function parseMode(
  value:
    unknown,
): GenesisReplayOrchestratorMode {
  if (
    value ===
      "DRY_RUN" ||
    value ===
      "PRODUCTION_ADMISSION"
  ) {
    return value;
  }

  throw new Error(
    "genesis_replay_execution_mode_invalid",
  );
}

function requireString(
  value:
    unknown,
  error:
    string,
): string {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    throw new Error(
      error,
    );
  }

  return value.trim();
}

function requireStringArray(
  value:
    unknown,
  error:
    string,
): readonly string[] {
  if (
    !Array.isArray(
      value,
    ) ||
    value.some(
      item =>
        typeof item !==
          "string",
    )
  ) {
    throw new Error(
      error,
    );
  }

  return [
    ...value,
  ];
}

function optionalTimestamp(
  value:
    unknown,
  error:
    string,
): number | undefined {
  if (
    value ===
      undefined
  ) {
    return undefined;
  }

  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new Error(
      error,
    );
  }

  return value;
}

function parseScope(
  value:
    unknown,
): GenesisReplayScope {
  const input =
    record(
      value,
    );

  if (
    input.mode !==
      "partial"
  ) {
    throw new Error(
      "genesis_bounded_replay_partial_scope_required",
    );
  }

  const includedEvidenceTypes =
    requireStringArray(
      input.includedEvidenceTypes,
      "genesis_replay_scope_included_evidence_types_invalid",
    );

  const excludedEvidenceTypes =
    requireStringArray(
      input.excludedEvidenceTypes,
      "genesis_replay_scope_excluded_evidence_types_invalid",
    );

  const allowedEvidenceTypes =
    new Set<string>(
      allGenesisEvidenceTypes(),
    );

  for (
    const evidenceType
    of [
      ...includedEvidenceTypes,
      ...excludedEvidenceTypes,
    ]
  ) {
    if (
      !allowedEvidenceTypes.has(
        evidenceType,
      )
    ) {
      throw new Error(
        "genesis_replay_scope_evidence_type_invalid",
      );
    }
  }

  const scope = {
    mode:
      "partial",

    repository:
      requireString(
        input.repository,
        "genesis_replay_scope_repository_required",
      ),

    ref:
      input.ref ===
        undefined
        ? undefined
        : requireString(
            input.ref,
            "genesis_replay_scope_ref_invalid",
          ),

    historicalStart:
      optionalTimestamp(
        input.historicalStart,
        "genesis_replay_scope_historical_start_invalid",
      ),

    historicalEnd:
      optionalTimestamp(
        input.historicalEnd,
        "genesis_replay_scope_historical_end_invalid",
      ),

    includedEvidenceTypes:
      includedEvidenceTypes as
        GenesisReplayScope["includedEvidenceTypes"],

    excludedEvidenceTypes:
      excludedEvidenceTypes as
        GenesisReplayScope["excludedEvidenceTypes"],

    explicitlyExcludedSourceIds:
      requireStringArray(
        input.explicitlyExcludedSourceIds,
        "genesis_replay_scope_source_exclusions_invalid",
      ) as GenesisReplayScope[
        "explicitlyExcludedSourceIds"
      ],

    governancePolicyVersion:
      requireString(
        input.governancePolicyVersion,
        "genesis_replay_scope_governance_policy_version_required",
      ),

    replayContractVersion:
      requireString(
        input.replayContractVersion,
        "genesis_replay_scope_contract_version_required",
      ),
  } satisfies GenesisReplayScope;

  return validateGenesisReplayScope(
    scope,
  );
}

function parseReprocessing(
  value:
    unknown,
): GenesisProductionReplayReprocessingRequest |
  undefined {
  if (
    value ===
      undefined
  ) {
    return undefined;
  }

  const input =
    record(
      value,
    );

  return {
    historicalSourceId:
      requireString(
        input.historicalSourceId,
        "genesis_reprocessing_historical_source_id_required",
      ),

    attemptId:
      requireString(
        input.attemptId,
        "genesis_reprocessing_attempt_id_required",
      ),

    priorManufacturingRunId:
      requireString(
        input.priorManufacturingRunId,
        "genesis_reprocessing_prior_run_required",
      ),

    priorPackageId:
      requireString(
        input.priorPackageId,
        "genesis_reprocessing_prior_package_required",
      ),

    reason:
      requireString(
        input.reason,
        "genesis_reprocessing_reason_required",
      ),
  };
}


function parseBody(
  value:
    unknown,
): GenesisReplayExecutionRequestBody {
  const input =
    record(
      value,
    );

  const mode =
    parseMode(
      input.mode,
    );

  const scope =
    parseScope(
      input.scope,
    );

  const authorizeProductionAdmission =
    input.authorizeProductionAdmission ===
    true;

  const reprocessing =
    parseReprocessing(
      input.reprocessing,
    );

  if (
    reprocessing &&
    mode !==
      "PRODUCTION_ADMISSION"
  ) {
    throw new Error(
      "genesis_reprocessing_requires_production_admission",
    );
  }

  if (
    mode ===
      "PRODUCTION_ADMISSION" &&
    !authorizeProductionAdmission
  ) {
    throw new Error(
      "genesis_replay_execution_production_authorization_required",
    );
  }

  return {
    mode,
    scope,
    authorizeProductionAdmission,

    ...(reprocessing
      ? {
          reprocessing,
        }
      : {}),
  };
}

function errorStatus(
  error:
    string,
): number {
  if (
    error ===
      "genesis_replay_execution_production_authorization_required"
  ) {
    return 403;
  }

  if (
    error.startsWith(
      "genesis_replay_execution_",
    ) ||
    error.startsWith(
      "genesis_replay_scope_",
    ) ||
    error ===
      "genesis_bounded_replay_partial_scope_required"
  ) {
    return 400;
  }

  return 409;
}

export function createGenesisReplayExecutionHandler(
  runtime:
    GenesisReplayExecutionRouteRuntime,
): RequestHandler {
  return async (
    req:
      Request,

    res:
      Response,
  ) => {
    let request:
      GenesisReplayExecutionRequestBody;

    try {
      request =
        parseBody(
          req.body,
        );
    } catch (
      error
    ) {
      const message =
        error instanceof Error
          ? error.message
          : "genesis_replay_execution_body_invalid";

      return res
        .status(
          errorStatus(
            message,
          ),
        )
        .json({
          ok:
            false,

          error:
            message,
        });
    }

    try {
      const startedAt =
        runtime.now();

      if (
        !Number.isFinite(
          startedAt,
        ) ||
        startedAt <
          0
      ) {
        throw new Error(
          "genesis_replay_execution_runtime_clock_invalid",
        );
      }

      const execute =
        runtime.execute ??
        runGovernedGenesisReplay;

      const result:
        GenesisReplayOrchestratorResult =
        await execute({
          mode:
            request.mode,

          repositoryRoot:
            runtime.repositoryRoot,

          scope:
            request.scope,

          persistenceStore:
            runtime.persistenceStore,

          startedAt,

          executionTimestampForManifestIndex:
            () =>
              runtime.now(),

          platform:
            runtime.platform,

          authorizeProductionAdmission:
            request
              .authorizeProductionAdmission,

          reprocessing:
            request.reprocessing,

          additionalDiscoverers:
            runtime.additionalDiscoverers,

          conversationEvidenceResolver:
            runtime.conversationEvidenceResolver,

          priorHistoricalCorrelation:
            runtime.priorHistoricalCorrelation
              ? runtime.priorHistoricalCorrelation()
              : null,
        });

      return res.json({
        ok:
          true,

        result,
      });
    } catch (
      error
    ) {
      const message =
        error instanceof Error
          ? error.message
          : "genesis_replay_execution_failed";

      return res
        .status(
          errorStatus(
            message,
          ),
        )
        .json({
          ok:
            false,

          error:
            message,
        });
    }
  };
}

export function registerGenesisReplayExecutionRoute(
  app:
    Express,

  runtime:
    GenesisReplayExecutionRouteRuntime,
): void {
  app.post(
    "/api/runtime/genesis/replays/execute",
    requireRuntimeAccess,
    createGenesisReplayExecutionHandler(
      runtime,
    ),
  );
}
