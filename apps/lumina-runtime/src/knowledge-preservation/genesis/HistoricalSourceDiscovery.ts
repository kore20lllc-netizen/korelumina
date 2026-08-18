import type {
  GenesisReplayScope,
} from "./GenesisSourceManifest.js";

import type {
  HistoricalSource,
  HistoricalSourceClass,
  HistoricalSourceId,
} from "./HistoricalSource.js";

import {
  genesisSourceClassPriority,
} from "./GenesisSourceManifestIdentity.js";

export type HistoricalSourceDiscoveryErrorCode =
  | "SOURCE_UNAVAILABLE"
  | "SOURCE_IDENTITY_AMBIGUOUS"
  | "TIMESTAMP_UNAVAILABLE"
  | "PROVENANCE_INCOMPLETE"
  | "CHECKSUM_MISMATCH"
  | "GOVERNANCE_BLOCKED"
  | "DISCOVERY_FAILED";

export interface HistoricalSourceDiscoveryError {
  code:
    HistoricalSourceDiscoveryErrorCode;

  discovererId:
    string;

  historicalSourceId?:
    HistoricalSourceId;

  provenanceLocator?:
    string;

  message:
    string;

  cause?:
    string;
}

export interface HistoricalSourceDiscoveryResult {
  discovererId:
    string;

  sources:
    readonly HistoricalSource[];

  errors:
    readonly HistoricalSourceDiscoveryError[];
}

export interface HistoricalSourceDiscoverer {
  readonly id:
    string;

  readonly sourceClasses:
    readonly HistoricalSourceClass[];

  discover(
    scope:
      GenesisReplayScope,
  ):
    Promise<
      HistoricalSourceDiscoveryResult
    >;
}

export interface HistoricalSourceDiscoveryObservation {
  historicalSourceId:
    HistoricalSourceId;

  discovererIds:
    readonly string[];
}

export interface HistoricalSourceDiscoveryAggregate {
  sources:
    readonly HistoricalSource[];

  errors:
    readonly HistoricalSourceDiscoveryError[];

  discovererIds:
    readonly string[];

  observations:
    readonly HistoricalSourceDiscoveryObservation[];
}

function requireNonEmpty(
  value:
    string,

  error:
    string,
): string {
  const normalized =
    value.trim();

  if (
    !normalized
  ) {
    throw new Error(
      error,
    );
  }

  return normalized;
}

function compareHistoricalSourceDiscoveryOrder(
  left:
    HistoricalSource,

  right:
    HistoricalSource,
): number {
  const sourceClassOrder =
    genesisSourceClassPriority(
      left.sourceClass,
    ) -
    genesisSourceClassPriority(
      right.sourceClass,
    );

  if (
    sourceClassOrder !==
    0
  ) {
    return sourceClassOrder;
  }

  const locatorOrder =
    left.provenance.locator
      .localeCompare(
        right.provenance.locator,
      );

  if (
    locatorOrder !==
    0
  ) {
    return locatorOrder;
  }

  return left.historicalSourceId
    .localeCompare(
      right.historicalSourceId,
    );
}

export function orderHistoricalSourcesForDiscovery(
  sources:
    readonly HistoricalSource[],
): readonly HistoricalSource[] {
  return [
    ...sources,
  ].sort(
    compareHistoricalSourceDiscoveryOrder,
  );
}

function validateDiscoverer(
  discoverer:
    HistoricalSourceDiscoverer,
): void {
  requireNonEmpty(
    discoverer.id,
    "genesis_discoverer_id_required",
  );

  if (
    discoverer.sourceClasses.length ===
    0
  ) {
    throw new Error(
      "genesis_discoverer_source_class_required",
    );
  }

  if (
    new Set(
      discoverer.sourceClasses,
    ).size !==
    discoverer.sourceClasses.length
  ) {
    throw new Error(
      "genesis_discoverer_duplicate_source_class",
    );
  }
}

function validateDiscoveryResult(
  discoverer:
    HistoricalSourceDiscoverer,

  result:
    HistoricalSourceDiscoveryResult,
): void {
  if (
    result.discovererId !==
    discoverer.id
  ) {
    throw new Error(
      "genesis_discovery_result_discoverer_id_mismatch",
    );
  }

  const allowedClasses =
    new Set(
      discoverer.sourceClasses,
    );

  for (
    const source
    of result.sources
  ) {
    if (
      !allowedClasses.has(
        source.sourceClass,
      )
    ) {
      throw new Error(
        "genesis_discovery_source_class_not_owned",
      );
    }
  }

  for (
    const error
    of result.errors
  ) {
    if (
      error.discovererId !==
      discoverer.id
    ) {
      throw new Error(
        "genesis_discovery_error_discoverer_id_mismatch",
      );
    }
  }
}

function discovererPriority(
  discoverer:
    HistoricalSourceDiscoverer,
): number {
  return Math.min(
    ...discoverer.sourceClasses.map(
      genesisSourceClassPriority,
    ),
  );
}

function orderDiscoverers(
  discoverers:
    readonly HistoricalSourceDiscoverer[],
): readonly HistoricalSourceDiscoverer[] {
  return [
    ...discoverers,
  ].sort(
    (
      left,
      right,
    ) => {
      const priorityOrder =
        discovererPriority(
          left,
        ) -
        discovererPriority(
          right,
        );

      if (
        priorityOrder !==
        0
      ) {
        return priorityOrder;
      }

      return left.id
        .localeCompare(
          right.id,
        );
    },
  );
}

function assertUniqueDiscovererIds(
  discoverers:
    readonly HistoricalSourceDiscoverer[],
): void {
  const ids =
    new Set<
      string
    >();

  for (
    const discoverer
    of discoverers
  ) {
    validateDiscoverer(
      discoverer,
    );

    if (
      ids.has(
        discoverer.id,
      )
    ) {
      throw new Error(
        "genesis_duplicate_discoverer_id",
      );
    }

    ids.add(
      discoverer.id,
    );
  }
}

function orderDiscoveryErrors(
  errors:
    readonly HistoricalSourceDiscoveryError[],
): readonly HistoricalSourceDiscoveryError[] {
  return [
    ...errors,
  ].sort(
    (
      left,
      right,
    ) => {
      const discovererOrder =
        left.discovererId
          .localeCompare(
            right.discovererId,
          );

      if (
        discovererOrder !==
        0
      ) {
        return discovererOrder;
      }

      const codeOrder =
        left.code
          .localeCompare(
            right.code,
          );

      if (
        codeOrder !==
        0
      ) {
        return codeOrder;
      }

      const sourceOrder =
        (
          left.historicalSourceId ??
          ""
        ).localeCompare(
          right.historicalSourceId ??
          "",
        );

      if (
        sourceOrder !==
        0
      ) {
        return sourceOrder;
      }

      const locatorOrder =
        (
          left.provenanceLocator ??
          ""
        ).localeCompare(
          right.provenanceLocator ??
          "",
        );

      if (
        locatorOrder !==
        0
      ) {
        return locatorOrder;
      }

      const messageOrder =
        left.message
          .localeCompare(
            right.message,
          );

      if (
        messageOrder !==
        0
      ) {
        return messageOrder;
      }

      return (
        left.cause ??
        ""
      ).localeCompare(
        right.cause ??
        "",
      );
    },
  );
}

function assertNoConflictingSourceIdentity(
  existing:
    HistoricalSource,

  incoming:
    HistoricalSource,
): void {
  if (
    existing.sourceChecksum !==
    incoming.sourceChecksum
  ) {
    throw new Error(
      "genesis_discovery_source_identity_checksum_conflict",
    );
  }

  if (
    existing.evidenceType !==
      incoming.evidenceType ||
    existing.sourceClass !==
      incoming.sourceClass ||
    existing.provenance.locator !==
      incoming.provenance.locator
  ) {
    throw new Error(
      "genesis_discovery_source_identity_contract_conflict",
    );
  }
}

export async function aggregateHistoricalSourceDiscovery(
  input: {
    scope:
      GenesisReplayScope;

    discoverers:
      readonly HistoricalSourceDiscoverer[];
  },
): Promise<
  HistoricalSourceDiscoveryAggregate
> {
  assertUniqueDiscovererIds(
    input.discoverers,
  );

  const orderedDiscoverers =
    orderDiscoverers(
      input.discoverers,
    );

  const sourcesById =
    new Map<
      HistoricalSourceId,
      HistoricalSource
    >();

  const discoverersBySourceId =
    new Map<
      HistoricalSourceId,
      Set<string>
    >();

  const errors:
    HistoricalSourceDiscoveryError[] =
      [];

  const discovererIds:
    string[] =
      [];

  for (
    const discoverer
    of orderedDiscoverers
  ) {
    discovererIds.push(
      discoverer.id,
    );

    let result:
      HistoricalSourceDiscoveryResult;

    try {
      result =
        await discoverer.discover(
          input.scope,
        );
    } catch (
      error
    ) {
      errors.push({
        code:
          "DISCOVERY_FAILED",

        discovererId:
          discoverer.id,

        message:
          "historical source discovery failed",

        cause:
          error instanceof Error
            ? error.message
            : String(
                error,
              ),
      });

      continue;
    }

    validateDiscoveryResult(
      discoverer,
      result,
    );

    errors.push(
      ...result.errors,
    );

    for (
      const source
      of result.sources
    ) {
      const existing =
        sourcesById.get(
          source.historicalSourceId,
        );

      if (
        !existing
      ) {
        sourcesById.set(
          source.historicalSourceId,
          source,
        );

        discoverersBySourceId.set(
          source.historicalSourceId,
          new Set([
            discoverer.id,
          ]),
        );

        continue;
      }

      assertNoConflictingSourceIdentity(
        existing,
        source,
      );

      const observers =
        discoverersBySourceId.get(
          source.historicalSourceId,
        );

      if (
        !observers
      ) {
        throw new Error(
          "genesis_discovery_observation_state_missing",
        );
      }

      observers.add(
        discoverer.id,
      );
    }
  }

  const orderedSources =
    orderHistoricalSourcesForDiscovery(
      [
        ...sourcesById.values(),
      ],
    );

  return {
    sources:
      orderedSources,

    errors:
      orderDiscoveryErrors(
        errors,
      ),

    discovererIds,

    observations:
      orderedSources.map(
        (
          source,
        ) => ({
          historicalSourceId:
            source.historicalSourceId,

          discovererIds: [
            ...(
              discoverersBySourceId.get(
                source.historicalSourceId,
              ) ??
              new Set<string>()
            ),
          ].sort(),
        }),
      ),
  };
}
