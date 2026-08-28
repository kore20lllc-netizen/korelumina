import path from "node:path";

import type {
  KnowledgePreservationPlatform,
} from "../bootstrap/index.js";

import {
  createGenesisReplayPlan,
} from "./GenesisReplayPlan.js";

import type {
  GenesisReplayPlan,
} from "./GenesisReplayPlan.js";

import {
  startGenesisReplayExecution,
} from "./GenesisReplayExecution.js";

import type {
  GenesisReplayRunnerResult,
} from "./GenesisReplayRunner.js";

import {
  FileGenesisReplayPersistenceStore,
  resumePersistedGenesisReplay,
} from "./GenesisReplayPersistence.js";

import type {
  GenesisReplayScope,
} from "./GenesisSourceManifest.js";

import type {
  GenesisSourceManifestBuildResult,
} from "./GenesisSourceManifestBuilder.js";

import {
  buildDefaultGenesisSourceManifest,
} from "./GenesisSourceManifestBuilder.js";

import {
  GenesisProductionReplayAdmissionAdapter,
} from "./GenesisProductionReplayAdmissionAdapter.js";

import type {
  GenesisProductionReplayReprocessingRequest,
} from "./GenesisProductionReplayAdmissionAdapter.js";

import {
  FileGenesisHistoricalCorrelationPersistenceStore,
} from "./GenesisHistoricalCorrelationPersistence.js";

import {
  materializeGenesisHistoricalCorrelation,
} from "./GenesisHistoricalCorrelationMaterializer.js";

import {
  integrateGenesisHistoricalCorrelationRevision,
} from "./GenesisHistoricalCorrelationRevisionIntegrator.js";

import type {
  GenesisHistoricalCorrelationState,
} from "./GenesisHistoricalCorrelation.js";

import type {
  HistoricalSourceDiscoverer,
} from "./HistoricalSourceDiscovery.js";

import type {
  GenesisConversationReplayEvidenceResolver,
} from "./GenesisConversationReplayEvidenceResolver.js";

export type GenesisReplayOrchestratorMode =
  | "DRY_RUN"
  | "PRODUCTION_ADMISSION";

export interface GenesisReplayOrchestratorPreflight {
  manifestReady:
    boolean;

  planReady:
    boolean;

  persistenceIsolated:
    boolean;

  productionAuthorized:
    boolean;

  readyToExecute:
    boolean;
}

export interface GenesisReplayOrchestratorDryRunResult {
  mode:
    "DRY_RUN";

  manifestBuild:
    GenesisSourceManifestBuildResult;

  plan:
    GenesisReplayPlan;

  preflight:
    GenesisReplayOrchestratorPreflight;

  runnerResult:
    null;
}

export interface GenesisReplayOrchestratorProductionResult {
  mode:
    "PRODUCTION_ADMISSION";

  manifestBuild:
    GenesisSourceManifestBuildResult;

  plan:
    GenesisReplayPlan;

  preflight:
    GenesisReplayOrchestratorPreflight;

  runnerResult:
    GenesisReplayRunnerResult;
}

export type GenesisReplayOrchestratorResult =
  | GenesisReplayOrchestratorDryRunResult
  | GenesisReplayOrchestratorProductionResult;

export type GenesisReplayManifestBuilder =
  (
    input: {
      repositoryRoot:
        string;

      scope:
        GenesisReplayScope;

      discoveredAt?:
        number;

      additionalDiscoverers?:
        readonly HistoricalSourceDiscoverer[];
    },
  ) => Promise<
    GenesisSourceManifestBuildResult
  >;

export interface RunGovernedGenesisReplayInput {
  mode:
    GenesisReplayOrchestratorMode;

  repositoryRoot:
    string;

  scope:
    GenesisReplayScope;

  persistenceStore:
    FileGenesisReplayPersistenceStore;

  discoveredAt?:
    number;

  startedAt:
    number;

  executionTimestampForManifestIndex:
    (
      manifestIndex:
        number,
    ) => number;

  platform?:
    KnowledgePreservationPlatform;

  authorizeProductionAdmission?:
    boolean;

  reprocessing?:
    GenesisProductionReplayReprocessingRequest;

  manifestBuilder?:
    GenesisReplayManifestBuilder;

  additionalDiscoverers?:
    readonly HistoricalSourceDiscoverer[];

  conversationEvidenceResolver?:
    GenesisConversationReplayEvidenceResolver;

  priorHistoricalCorrelation?:
    GenesisHistoricalCorrelationState |
    null;
}

function assertValidTimestamp(
  value:
    number,

  error:
    string,
): number {
  if (
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

function assertPersistenceIsolation(
  store:
    FileGenesisReplayPersistenceStore,
): void {
  const normalized =
    path.resolve(
      store.storageRoot,
    );

  const normalizedParts =
    normalized
      .split(
        path.sep,
      )
      .filter(
        Boolean,
      );

  for (
    let index = 0;
    index <
      normalizedParts.length - 1;
    index +=
      1
  ) {
    if (
      normalizedParts[index] ===
        "runtime" &&
      normalizedParts[index + 1] ===
        "knowledge"
    ) {
      throw new Error(
        "genesis_replay_orchestrator_persistence_not_isolated",
      );
    }
  }
}

function preflightFor(
  input: {
    manifestBuild:
      GenesisSourceManifestBuildResult;

    plan:
      GenesisReplayPlan;

    persistenceStore:
      FileGenesisReplayPersistenceStore;

    productionAuthorized:
      boolean;
  },
): GenesisReplayOrchestratorPreflight {
  assertPersistenceIsolation(
    input.persistenceStore,
  );

  const manifestReady =
    input.manifestBuild
      .readiness ===
      "READY" &&
    input.manifestBuild
      .errors.length ===
      0;

  const planReady =
    input.plan.readiness ===
    "READY" &&
    input.plan.summary.block ===
    0;

  return {
    manifestReady,

    planReady,

    persistenceIsolated:
      true,

    productionAuthorized:
      input.productionAuthorized,

    readyToExecute:
      manifestReady &&
      planReady &&
      input.productionAuthorized,
  };
}

export async function runGovernedGenesisReplay(
  input:
    RunGovernedGenesisReplayInput,
): Promise<
  GenesisReplayOrchestratorResult
> {
  assertValidTimestamp(
    input.startedAt,
    "genesis_replay_orchestrator_started_at_invalid",
  );

  const builder =
    input.manifestBuilder ??
    buildDefaultGenesisSourceManifest;

  const manifestBuild =
    await builder({
      repositoryRoot:
        input.repositoryRoot,

      scope:
        input.scope,

      discoveredAt:
        input.discoveredAt,

      additionalDiscoverers:
        input.additionalDiscoverers,
    });

  /*
   * createGenesisReplayPlan is itself the governed manifest
   * readiness gate. A BLOCKED discovery cannot become a plan.
   */
  const plan =
    createGenesisReplayPlan(
      manifestBuild,
    );

  const productionAuthorized =
    input.mode ===
      "PRODUCTION_ADMISSION" &&
    input.authorizeProductionAdmission ===
      true;

  const preflight =
    preflightFor({
      manifestBuild,

      plan,

      persistenceStore:
        input.persistenceStore,

      productionAuthorized,
    });

  if (
    input.mode ===
      "DRY_RUN" &&
    input.reprocessing
  ) {
    throw new Error(
      "genesis_reprocessing_requires_production_admission",
    );
  }

  if (
    input.mode ===
    "DRY_RUN"
  ) {
    return {
      mode:
        "DRY_RUN",

      manifestBuild,

      plan,

      preflight,

      runnerResult:
        null,
    };
  }

  if (
    !preflight
      .readyToExecute
  ) {
    throw new Error(
      "genesis_replay_orchestrator_production_not_authorized",
    );
  }

  if (
    !input.platform
  ) {
    throw new Error(
      "genesis_replay_orchestrator_production_platform_required",
    );
  }

  const existingExecution =
    input.persistenceStore
      .loadExecution(
        plan.replayId,
      );

  if (
    existingExecution
  ) {
    throw new Error(
      "genesis_replay_orchestrator_existing_execution_requires_explicit_resume",
    );
  }

  /*
   * Persistence is established before the first production
   * Evidence admission is attempted.
   */
  input.persistenceStore
    .saveManifestBuild(
      manifestBuild,
    );

  const initialExecution =
    startGenesisReplayExecution({
      plan,

      manifest:
        manifestBuild.manifest,

      startedAt:
        input.startedAt,
    });

  input.persistenceStore
    .saveExecution(
      initialExecution,
    );

  const admissionAdapter =
    new GenesisProductionReplayAdmissionAdapter({
      platform:
        input.platform,

      conversationEvidenceResolver:
        input.conversationEvidenceResolver,

      reprocessing:
        input.reprocessing,
    });

  const runnerResult =
    await resumePersistedGenesisReplay(
      {
        replayId:
          plan.replayId,

        admissionAdapter,

        executionTimestampForManifestIndex:
          input
            .executionTimestampForManifestIndex,
      },
      input.persistenceStore,
    );

  if (
    runnerResult.outcome ===
    "COMPLETED"
  ) {
    const materializedCorrelation =
      materializeGenesisHistoricalCorrelation(
        runnerResult.execution,
      );

    const correlation =
      input.priorHistoricalCorrelation
        ? integrateGenesisHistoricalCorrelationRevision(
            input.priorHistoricalCorrelation,
            materializedCorrelation,
          )
        : materializedCorrelation;

    const correlationStore =
      new FileGenesisHistoricalCorrelationPersistenceStore();

    correlationStore.save(
      plan.replayId,
      correlation,
    );
  }

  return {
    mode:
      "PRODUCTION_ADMISSION",

    manifestBuild,

    plan,

    preflight,

    runnerResult,
  };
}
