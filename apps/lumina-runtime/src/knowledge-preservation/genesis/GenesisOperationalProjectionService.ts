import type {
  OrganizationalMemoryRecord,
} from "../../knowledge/organizational-memory/OrganizationalMemoryRecord.js";

import type {
  KnowledgeManufacturingRun,
} from "../manufacturing/index.js";

import type {
  GenesisHistoricalCorrelationPersistenceStore,
} from "./GenesisHistoricalCorrelationPersistence.js";

import type {
  GenesisReadinessPolicy,
} from "./GenesisReadiness.js";

import type {
  GenesisConversationSourceBoundary,
} from "./GenesisConversationSourceBoundary.js";

import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisReplayPersistenceReader,
} from "./GenesisReplayStatusService.js";

import {
  inspectGenesisReplayStatus,
} from "./GenesisReplayStatusService.js";

import {
  buildGenesisOperationalProjection,
} from "./GenesisOperationalProjection.js";

import type {
  GenesisOperationalProjection,
} from "./GenesisOperationalProjection.js";

export interface GenesisOperationalManufacturingRunReader {
  list():
    KnowledgeManufacturingRun[];
}

export interface GenesisOperationalMemoryReader {
  list():
    OrganizationalMemoryRecord[];
}

export interface ReadGenesisOperationalProjectionInput {
  replayId:
    GenesisReplayId;

  replayPersistence:
    GenesisReplayPersistenceReader;

  historicalCorrelation:
    Pick<
      GenesisHistoricalCorrelationPersistenceStore,
      "load"
    >;

  manufacturingRuns:
    GenesisOperationalManufacturingRunReader;

  organizationalMemory:
    GenesisOperationalMemoryReader;

  readinessPolicy:
    GenesisReadinessPolicy;

  conversationSource?:
    GenesisConversationSourceBoundary;
}

export function readGenesisOperationalProjection(
  input:
    ReadGenesisOperationalProjectionInput,
): GenesisOperationalProjection {
  const manifestBuild =
    input.replayPersistence
      .loadManifestBuild(
        input.replayId,
      );

  if (
    !manifestBuild
  ) {
    throw new Error(
      "genesis_operational_projection_manifest_not_found",
    );
  }

  const correlation =
    input.historicalCorrelation
      .load(
        input.replayId,
      );

  if (
    !correlation
  ) {
    throw new Error(
      "genesis_operational_projection_correlation_not_found",
    );
  }

  const status =
    inspectGenesisReplayStatus({
      replayId:
        input.replayId,

      persistence:
        input.replayPersistence,

      manufacturingRuns:
        input.manufacturingRuns,
    });

  if (
    !status.found
  ) {
    throw new Error(
      "genesis_operational_projection_replay_not_found",
    );
  }

  return buildGenesisOperationalProjection({
    replayId:
      input.replayId,

    replayInventory: {
      total:
        1,

      replayIds: [
        input.replayId,
      ],

      replays: [
        status,
      ],
    },

    correlation,

    manifestEntries:
      manifestBuild
        .manifest
        .entries,

    manufacturingRuns:
      input.manufacturingRuns
        .list(),

    organizationalMemory:
      input.organizationalMemory
        .list(),

    replayDispositions:
      status.checkpoint
        ?.dispositions ??
      [],

    readinessPolicy:
      input.readinessPolicy,

    conversationSource:
      input.conversationSource,
  });
}
