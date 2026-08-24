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
  buildGenesisConversationCorrelationCompleteness,
} from "./GenesisConversationCorrelationCompleteness.js";

import type {
  GenesisConversationCorrelationCompletenessProjection,
} from "./GenesisConversationCorrelationCompleteness.js";

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
  buildGenesisHistoricalAdmissionGovernanceProjection,
} from "./GenesisHistoricalAdmissionGovernanceProjection.js";

import type {
  GenesisHistoricalAdmissionGovernanceProjection,
} from "./GenesisHistoricalAdmissionGovernanceProjection.js";

import {
  buildGenesisHistoricalOutputGovernanceProjection,
} from "./GenesisHistoricalOutputGovernance.js";

import type {
  GenesisHistoricalOutputGovernanceProjection,
} from "./GenesisHistoricalOutputGovernance.js";


import {
  buildGenesisHistoricalKnowledgeLineage,
} from "./GenesisHistoricalKnowledgeLineage.js";

import type {
  GenesisHistoricalKnowledgeLineageProjection,
} from "./GenesisHistoricalKnowledgeLineage.js";

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

import {
  buildGenesisRepositorySeedHandoffCertification,
} from "./GenesisRepositorySeedHandoffCertification.js";

import type {
  GenesisRepositorySeedHandoffCertification,
} from "./GenesisRepositorySeedHandoffCertification.js";

import {
  buildGenesisRepositorySeedCertification,
} from "./GenesisRepositorySeedCertification.js";

import type {
  GenesisRepositorySeedCertification,
} from "./GenesisRepositorySeedCertification.js";

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

  historicalKnowledgeLineage:
    GenesisHistoricalKnowledgeLineageProjection;

  historicalAdmissionGovernance:
    GenesisHistoricalAdmissionGovernanceProjection;

  historicalOutputGovernance:
    GenesisHistoricalOutputGovernanceProjection;

  repositorySeedCertification:
    GenesisRepositorySeedCertification;

  repositorySeedHandoffCertification:
    GenesisRepositorySeedHandoffCertification;

  readiness:
    GenesisReadinessProjection;

  conversationSource:
    GenesisConversationSourceBoundary;

  conversationCorrelationCompleteness:
    GenesisConversationCorrelationCompletenessProjection;
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

  replayDispositions?:
    readonly import("./GenesisReplayCheckpoint.js")
      .GenesisReplayCheckpointDisposition[];

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

  const historicalKnowledgeLineage =
    buildGenesisHistoricalKnowledgeLineage({
      corpus,

      dispositions:
        input.replayDispositions ??
        [],
    });

  const historicalAdmissionGovernance =
    buildGenesisHistoricalAdmissionGovernanceProjection({
      manifestEntries:
        input.manifestEntries,

      dispositions:
        input.replayDispositions ??
        [],
    });

  const historicalOutputGovernance =
    buildGenesisHistoricalOutputGovernanceProjection({
      historicalAdmissionGovernance,

      knowledgeLifecycle,
    });

  const conversationSource =
    input.conversationSource ??
    certifiedConversationBoundary();

  const conversationCorrelationCompleteness =
    buildGenesisConversationCorrelationCompleteness({
      manifestEntries:
        input.manifestEntries,

      dispositions:
        input.replayDispositions ??
        [],

      correlation:
        input.correlation,
    });

  const repositorySeedCertification =
    buildGenesisRepositorySeedCertification({
      corpus,

      historicalAdmissionGovernance,

      conversationSource,
    });

  const repositorySeedHandoffCertification =
    buildGenesisRepositorySeedHandoffCertification({
      repositorySeedCertification,

      knowledgeLifecycle,
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

      historicalKnowledgeLineageProjectionId:
        historicalKnowledgeLineage
          .projectionId,

      historicalAdmissionGovernanceProjectionId:
        historicalAdmissionGovernance
          .projectionId,

      historicalOutputGovernanceProjectionId:
        historicalOutputGovernance
          .projectionId,

      repositorySeedCertificationId:
        repositorySeedCertification
          .certificationId,

      repositorySeedHandoffCertificationId:
        repositorySeedHandoffCertification
          .certificationId,

      readinessProjectionId:
        readiness.projectionId,

      conversationSourceProjectionId:
        conversationSource
          .projectionId,

      conversationCorrelationCompletenessProjectionId:
        conversationCorrelationCompleteness
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

    historicalKnowledgeLineage,

    historicalAdmissionGovernance,

    historicalOutputGovernance,

    repositorySeedCertification,

    repositorySeedHandoffCertification,

    readiness,

    conversationSource,

    conversationCorrelationCompleteness,
  };
}
