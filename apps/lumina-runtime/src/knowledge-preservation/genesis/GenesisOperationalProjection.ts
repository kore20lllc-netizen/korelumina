import {
  createHash,
} from "node:crypto";

import type {
  OrganizationalMemoryRecord,
} from "../../knowledge/organizational-memory/OrganizationalMemoryRecord.js";

import type {
  KnowledgeManufacturingRun,
} from "../manufacturing/index.js";

import {
  buildGenesisConversationSourceBoundary,
} from "./GenesisConversationSourceBoundary.js";

import type {
  GenesisConversationSourceBoundary,
} from "./GenesisConversationSourceBoundary.js";

import {
  buildGenesisCorpusReadModel,
} from "./GenesisCorpusReadModel.js";

import type {
  GenesisCorpusReadModel,
} from "./GenesisCorpusReadModel.js";

import {
  buildGenesisDocumentationGovernanceProjection,
} from "./GenesisDocumentationGovernance.js";

import type {
  GenesisDocumentationGovernanceProjection,
} from "./GenesisDocumentationGovernance.js";

import type {
  GenesisHistoricalCorrelationState,
} from "./GenesisHistoricalCorrelation.js";

import {
  buildGenesisKnowledgeLifecycleCorrelation,
} from "./GenesisKnowledgeLifecycleCorrelation.js";

import type {
  GenesisKnowledgeLifecycleProjection,
} from "./GenesisKnowledgeLifecycleCorrelation.js";

import {
  buildGenesisReadiness,
} from "./GenesisReadiness.js";

import type {
  GenesisReadinessPolicy,
  GenesisReadinessProjection,
} from "./GenesisReadiness.js";

import type {
  GenesisReplayId,
} from "./GenesisReplayIdentity.js";

import type {
  GenesisReplayInventory,
} from "./GenesisReplayInventoryService.js";

import type {
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

import {
  buildGenesisTemporalChronology,
} from "./GenesisTemporalChronology.js";

import type {
  GenesisTemporalChronology,
} from "./GenesisTemporalChronology.js";

export type GenesisOperationalProjectionId =
  `genesis-operational:${string}`;

export interface GenesisOperationalProjection {
  projectionId:
    GenesisOperationalProjectionId;

  replayId:
    GenesisReplayId;

  corpus:
    GenesisCorpusReadModel;

  chronology:
    GenesisTemporalChronology;

  documentationGovernance:
    GenesisDocumentationGovernanceProjection;

  knowledgeLifecycle:
    GenesisKnowledgeLifecycleProjection;

  readiness:
    GenesisReadinessProjection;

  conversationSource:
    GenesisConversationSourceBoundary;
}

export interface BuildGenesisOperationalProjectionInput {
  replayId:
    GenesisReplayId;

  replayInventory:
    GenesisReplayInventory;

  correlation:
    GenesisHistoricalCorrelationState;

  manifestEntries:
    readonly GenesisSourceManifestEntry[];

  manufacturingRuns:
    readonly KnowledgeManufacturingRun[];

  organizationalMemory:
    readonly OrganizationalMemoryRecord[];

  readinessPolicy:
    GenesisReadinessPolicy;

  conversationSource?:
    GenesisConversationSourceBoundary;
}

function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          (
            key,
          ) => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}

function hash(
  value:
    unknown,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        stableNormalize(
          value,
        ),
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}

function assertReplayInventoryContainsOnlyRequestedReplay(
  replayId:
    GenesisReplayId,

  inventory:
    GenesisReplayInventory,
): void {
  if (
    inventory.total !==
      1 ||
    inventory.replayIds.length !==
      1 ||
    inventory.replays.length !==
      1 ||
    inventory.replayIds[0] !==
      replayId ||
    inventory.replays[0]
      ?.replayId !==
      replayId
  ) {
    throw new Error(
      "genesis_operational_projection_replay_scope_mismatch",
    );
  }
}

function certifiedConversationBoundary():
  GenesisConversationSourceBoundary {
  return buildGenesisConversationSourceBoundary({
    compilerAvailable:
      true,

    compilerName:
      "conversation-compiler",

    governedKnowledgePathAvailable:
      true,

    acquisitionAvailable:
      false,

    acquisitionBlocker:
      "No governed historical conversation acquisition/source adapter is implemented.",
  });
}

export function buildGenesisOperationalProjection(
  input:
    BuildGenesisOperationalProjectionInput,
): GenesisOperationalProjection {
  assertReplayInventoryContainsOnlyRequestedReplay(
    input.replayId,
    input.replayInventory,
  );

  const corpus =
    buildGenesisCorpusReadModel({
      replayInventory:
        input.replayInventory,

      correlation:
        input.correlation,
    });

  const chronology =
    buildGenesisTemporalChronology(
      corpus,
    );

  const documentationGovernance =
    buildGenesisDocumentationGovernanceProjection(
      input.manifestEntries,
    );

  const knowledgeLifecycle =
    buildGenesisKnowledgeLifecycleCorrelation({
      corpus,

      manufacturingRuns:
        input.manufacturingRuns,

      organizationalMemory:
        input.organizationalMemory,
    });

  const readiness =
    buildGenesisReadiness({
      policy:
        input.readinessPolicy,

      corpus,

      chronology,

      documentationGovernance,

      knowledgeLifecycle,
    });

  const conversationSource =
    input.conversationSource ??
    certifiedConversationBoundary();

  const projectionId =
    `genesis-operational:${hash({
      replayId:
        input.replayId,

      corpusProjectionId:
        corpus.projectionId,

      chronologyProjectionId:
        chronology.projectionId,

      documentationGovernanceProjectionId:
        documentationGovernance
          .projectionId,

      knowledgeLifecycleProjectionId:
        knowledgeLifecycle
          .projectionId,

      readinessProjectionId:
        readiness.projectionId,

      conversationSourceProjectionId:
        conversationSource
          .projectionId,
    })}` as GenesisOperationalProjectionId;

  return {
    projectionId,

    replayId:
      input.replayId,

    corpus,

    chronology,

    documentationGovernance,

    knowledgeLifecycle,

    readiness,

    conversationSource,
  };
}
