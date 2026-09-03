import {
  createHash,
} from "node:crypto";

import type {
  GenesisConversationAcquisitionLatestState,
} from "./GenesisConversationAcquisitionExecution.js";

import type {
  GenesisConversationRuntimeConfiguration,
} from "./GenesisConversationRuntimeConfiguration.js";

import type {
  GenesisConversationHistoricalGapState,
} from "./GenesisHistoricalConversationSourceAdapter.js";


export type GenesisConversationAcquisitionInventoryId =
  `genesis-conversation-acquisition-inventory:${string}`;


export type GenesisConversationAcquisitionHistoryState =
  | "UNCONFIGURED"
  | "SOURCE_UNAVAILABLE"
  | "NOT_ACQUIRED"
  | "ACQUISITION_FAILED"
  | "ACQUIRED";


export type GenesisConversationHistoricalCompleteness =
  | "NOT_ACQUIRED"
  | "INCOMPLETE"
  | "UNVERIFIED";


export interface GenesisConversationGapCounts {
  notYetAcquired:
    number;

  historicallyUnavailable:
    number;

  permissionBlocked:
    number;

  sourceUnavailable:
    number;
}


export interface GenesisConversationAcquisitionInventory {
  inventoryId:
    GenesisConversationAcquisitionInventoryId;

  historyState:
    GenesisConversationAcquisitionHistoryState;

  completeness:
    GenesisConversationHistoricalCompleteness;

  configured:
    boolean;

  acquisitionAvailable:
    boolean;

  acquisitionId:
    string | null;

  acquiredConversationIds:
    readonly string[];

  conversationCount:
    number;

  historicalSourceCount:
    number;

  evidenceCount:
    number;

  gapCounts:
    GenesisConversationGapCounts;

  blockers:
    readonly string[];

  historicalCompletenessCertified:
    false;
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


function emptyGapCounts():
  GenesisConversationGapCounts {
  return {
    notYetAcquired:
      0,

    historicallyUnavailable:
      0,

    permissionBlocked:
      0,

    sourceUnavailable:
      0,
  };
}


function gapCountsFor(
  gaps:
    readonly {
      state:
        GenesisConversationHistoricalGapState;
    }[],
): GenesisConversationGapCounts {
  const counts =
    emptyGapCounts();

  for (
    const gap
    of gaps
  ) {
    switch (
      gap.state
    ) {
      case "not-yet-acquired":
        counts.notYetAcquired +=
          1;
        break;

      case "historically-unavailable":
        counts.historicallyUnavailable +=
          1;
        break;

      case "permission-blocked":
        counts.permissionBlocked +=
          1;
        break;

      case "source-unavailable":
        counts.sourceUnavailable +=
          1;
        break;
    }
  }

  return counts;
}


function hasKnownGaps(
  counts:
    GenesisConversationGapCounts,
): boolean {
  return (
    counts.notYetAcquired >
      0 ||
    counts.historicallyUnavailable >
      0 ||
    counts.permissionBlocked >
      0 ||
    counts.sourceUnavailable >
      0
  );
}


export function buildGenesisConversationAcquisitionInventory(
  input: {
    configuration:
      GenesisConversationRuntimeConfiguration;

    latest:
      GenesisConversationAcquisitionLatestState |
      null;
  },
): GenesisConversationAcquisitionInventory {
  const {
    configuration,
    latest,
  } = input;

  let historyState:
    GenesisConversationAcquisitionHistoryState;

  let completeness:
    GenesisConversationHistoricalCompleteness;

  const blockers:
    string[] =
      [];

  let acquisitionId:
    string | null =
      null;

  let acquiredConversationIds:
    readonly string[] =
      [];

  let conversationCount =
    0;

  let historicalSourceCount =
    0;

  let evidenceCount =
    0;

  let gapCounts =
    emptyGapCounts();

  if (
    latest?.state ===
    "ACQUIRED"
  ) {
    /*
     * A successfully persisted acquisition is durable historical
     * evidence. Current source configuration controls whether a new
     * acquisition can execute; it must not erase an acquisition that
     * has already completed and been persisted.
     */
    historyState =
      "ACQUIRED";

    acquisitionId =
      latest.acquisitionId;

    acquiredConversationIds =
      [
        ...(
          latest.conversationIds ??
          []
        ),
      ].sort();

    conversationCount =
      latest.conversationCount;

    historicalSourceCount =
      latest.historicalSourceCount;

    evidenceCount =
      latest.evidenceCount;

    gapCounts =
      gapCountsFor(
        latest.gaps ??
        [],
      );

    if (
      hasKnownGaps(
        gapCounts,
      )
    ) {
      completeness =
        "INCOMPLETE";

      if (
        gapCounts.notYetAcquired >
        0
      ) {
        blockers.push(
          "conversation-history-not-yet-acquired",
        );
      }

      if (
        gapCounts.historicallyUnavailable >
        0
      ) {
        blockers.push(
          "conversation-history-historically-unavailable",
        );
      }

      if (
        gapCounts.permissionBlocked >
        0
      ) {
        blockers.push(
          "conversation-history-permission-blocked",
        );
      }

      if (
        gapCounts.sourceUnavailable >
        0
      ) {
        blockers.push(
          "conversation-history-source-unavailable",
        );
      }
    } else {
      /*
       * A successful export acquisition proves what was present in
       * that export. It does NOT prove that the export represents every
       * conversation that existed from Day 0 to the present.
       */
      completeness =
        "UNVERIFIED";

      blockers.push(
        "authoritative-conversation-history-inventory-not-certified",
      );
    }
  } else if (
    configuration.state ===
    "UNCONFIGURED"
  ) {
    historyState =
      "UNCONFIGURED";

    completeness =
      "NOT_ACQUIRED";

    blockers.push(
      "conversation-source-not-configured",
    );
  } else if (
    configuration.state ===
    "UNAVAILABLE"
  ) {
    historyState =
      "SOURCE_UNAVAILABLE";

    completeness =
      "NOT_ACQUIRED";

    blockers.push(
      "configured-conversation-source-unavailable",
    );
  } else if (
    latest ===
    null
  ) {
    historyState =
      "NOT_ACQUIRED";

    completeness =
      "NOT_ACQUIRED";

    blockers.push(
      "conversation-acquisition-not-executed",
    );
  } else {
    historyState =
      "ACQUISITION_FAILED";

    completeness =
      "NOT_ACQUIRED";

    blockers.push(
      "conversation-acquisition-failed",
    );
  }

  const normalizedBlockers =
    [
      ...new Set(
        blockers,
      ),
    ].sort();

  const configured =
    configuration.state ===
    "CONFIGURED";

  const acquisitionAvailable =
    configuration
      .boundary
      .acquisition
      .available;

  const inventoryId =
    `genesis-conversation-acquisition-inventory:${hash({
      configurationState:
        configuration.state,

      boundaryProjectionId:
        configuration
          .boundary
          .projectionId,

      historyState,

      completeness,

      acquisitionId,

      acquiredConversationIds,

      conversationCount,

      historicalSourceCount,

      evidenceCount,

      gapCounts,

      blockers:
        normalizedBlockers,

      historicalCompletenessCertified:
        false,
    })}` as GenesisConversationAcquisitionInventoryId;

  return {
    inventoryId,

    historyState,

    completeness,

    configured,

    acquisitionAvailable,

    acquisitionId,

    acquiredConversationIds,

    conversationCount,

    historicalSourceCount,

    evidenceCount,

    gapCounts,

    blockers:
      normalizedBlockers,

    historicalCompletenessCertified:
      false,
  };
}
