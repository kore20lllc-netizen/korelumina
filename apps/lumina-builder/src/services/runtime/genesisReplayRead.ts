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
