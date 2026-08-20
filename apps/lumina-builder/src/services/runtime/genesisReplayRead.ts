import {
  RUNTIME_API,
  getRuntimeCallerHeaders,
} from "@/services/runtime/client";

import {
  createGenesisReplayReadClient,
} from "@/services/runtime/genesisReplayReadClient";

export {
  GenesisReplayReadApiError,
  assertGenesisReplayId,
  createGenesisReplayReadClient,
} from "@/services/runtime/genesisReplayReadClient";

export type {
  GenesisCorpusCompletionStatus,
  GenesisManifestReadiness,
  GenesisReplayAdmissionLink,
  GenesisReplayCheckpoint,
  GenesisReplayExecutionStatus,
  GenesisReplayId,
  GenesisReplayInventory,
  GenesisReplayInventorySuccessResponse,
  GenesisReplayProgress,
  GenesisReplayReadClient,
  GenesisReplayReadClientOptions,
  GenesisReplayRecoveryEligibility,
  GenesisReplayRecoveryEligibilityReason,
  GenesisReplayRunnerFailure,
  GenesisReplayRunnerOutcome,
  GenesisReplayStatusSnapshot,
  GenesisReplayStatusSuccessResponse,
} from "@/services/runtime/genesisReplayReadClient";

const genesisReplayReadClient =
  createGenesisReplayReadClient({
    baseUrl:
      RUNTIME_API,

    getHeaders:
      () =>
        getRuntimeCallerHeaders(),
  });

export const listGenesisReplays =
  genesisReplayReadClient
    .listReplays;

export const getGenesisReplayStatus =
  genesisReplayReadClient
    .getReplayStatus;

import {
  createGenesisReplayReadController as createProductionGenesisReplayReadController,
} from "@/services/runtime/genesisReplayReadController";

export const genesisReplayReadController =
  createProductionGenesisReplayReadController(
    genesisReplayReadClient,
  );

import {
  createGenesisReplayReactAdapter as createProductionGenesisReplayReactAdapter,
} from "@/services/runtime/genesisReplayReactAdapter";

export const genesisReplayReactAdapter =
  createProductionGenesisReplayReactAdapter(
    genesisReplayReadController,
  );

export {
  createGenesisReplayReadStateAdapter,
} from "@/services/runtime/genesisReplayReadState";

export type {
  GenesisReplayReadState,
  GenesisReplayReadStateAdapter,
  GenesisReplayReadStateError,
  GenesisReplayReadStateErrorScope,
} from "@/services/runtime/genesisReplayReadState";

export {
  createGenesisReplayReadViewModel,
} from "@/services/runtime/genesisReplayReadViewModel";

export type {
  GenesisReplayErrorViewModel,
  GenesisReplayInventoryRowViewModel,
  GenesisReplayLifecycleLabel,
  GenesisReplayLinkageHealth,
  GenesisReplayLinkageViewModel,
  GenesisReplayProgressViewModel,
  GenesisReplayReadViewModel,
  GenesisReplayRecoveryViewModel,
  GenesisReplaySelectedViewModel,
  GenesisReplayViewTone,
} from "@/services/runtime/genesisReplayReadViewModel";

export {
  createGenesisReplayReadController,
} from "@/services/runtime/genesisReplayReadController";

export type {
  GenesisReplayReadController,
  GenesisReplayReadControllerListener,
} from "@/services/runtime/genesisReplayReadController";

export {
  createGenesisReplayReactAdapter,
  useGenesisReplayRead,
} from "@/services/runtime/genesisReplayReactAdapter";

export type {
  GenesisReplayReactActions,
  GenesisReplayReactAdapter,
  GenesisReplayReactBinding,
  GenesisReplayReactStore,
} from "@/services/runtime/genesisReplayReactAdapter";

import {
  createGenesisOperationalReadClient,
} from "@/services/runtime/genesisOperationalReadClient";

export {
  GenesisOperationalReadApiError,
  createGenesisOperationalReadClient,
} from "@/services/runtime/genesisOperationalReadClient";

export type {
  GenesisConversationSourceSupportClassification,
  GenesisOperationalChronologySummary,
  GenesisOperationalConversationSourceSummary,
  GenesisOperationalCorpusSummary,
  GenesisOperationalDocumentationGovernanceSummary,
  GenesisOperationalKnowledgeLifecycleSummary,
  GenesisOperationalProjection,
  GenesisOperationalProjectionId,
  GenesisOperationalReadClient,
  GenesisOperationalReadClientOptions,
  GenesisOperationalReadinessSummary,
  GenesisOperationalSuccessResponse,
  GenesisReadinessDimensionState,
  GenesisReadinessOverall,
} from "@/services/runtime/genesisOperationalReadClient";

import {
  createGenesisOperationalReadStateAdapter,
} from "@/services/runtime/genesisOperationalReadState";

export {
  createGenesisOperationalReadStateAdapter,
} from "@/services/runtime/genesisOperationalReadState";

export type {
  GenesisOperationalReadState,
  GenesisOperationalReadStateAdapter,
  GenesisOperationalReadStateError,
} from "@/services/runtime/genesisOperationalReadState";

export const genesisOperationalReadClient =
  createGenesisOperationalReadClient({
    baseUrl:
      RUNTIME_API,

    getHeaders:
      () =>
        getRuntimeCallerHeaders(),
  });

export const getGenesisOperationalProjection =
  genesisOperationalReadClient
    .getOperationalProjection;

export const genesisOperationalReadState =
  createGenesisOperationalReadStateAdapter(
    genesisOperationalReadClient,
  );

import {
  createGenesisOperationalReadController,
} from "@/services/runtime/genesisOperationalReadController";

export {
  createGenesisOperationalReadController,
} from "@/services/runtime/genesisOperationalReadController";

export type {
  GenesisOperationalReadController,
  GenesisOperationalReadControllerListener,
  GenesisOperationalReadSnapshot,
} from "@/services/runtime/genesisOperationalReadController";

import {
  createGenesisOperationalReactAdapter,
} from "@/services/runtime/genesisOperationalReactAdapter";

export {
  createGenesisOperationalReactAdapter,
  useGenesisOperationalRead,
} from "@/services/runtime/genesisOperationalReactAdapter";

export type {
  GenesisOperationalReactActions,
  GenesisOperationalReactAdapter,
  GenesisOperationalReactBinding,
  GenesisOperationalReactStore,
} from "@/services/runtime/genesisOperationalReactAdapter";

export const genesisOperationalReadController =
  createGenesisOperationalReadController(
    genesisReplayReadController,
    genesisOperationalReadState,
  );

export const genesisOperationalReactAdapter =
  createGenesisOperationalReactAdapter(
    genesisOperationalReadController,
  );
