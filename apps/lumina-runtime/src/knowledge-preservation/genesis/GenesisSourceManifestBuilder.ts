import type {
  GenesisReplayScope,
  GenesisSourceManifest,
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

import {
  historicalSourceToManifestEntry,
} from "./GenesisSourceManifest.js";

import {
  canonicalizeGenesisSourceManifestIdentityInput,
  createGenesisSourceManifestId,
} from "./GenesisSourceManifestIdentity.js";

import {
  validateGenesisReplayScope,
} from "./GenesisReplayScope.js";

import {
  aggregateHistoricalSourceDiscovery,
} from "./HistoricalSourceDiscovery.js";

import type {
  HistoricalSourceDiscoverer,
  HistoricalSourceDiscoveryError,
  HistoricalSourceDiscoveryObservation,
} from "./HistoricalSourceDiscovery.js";

import {
  DocumentationHistoricalSourceDiscoverer,
} from "./DocumentationHistoricalSourceDiscoverer.js";

import {
  GitHistoryHistoricalSourceDiscoverer,
} from "./GitHistoryHistoricalSourceDiscoverer.js";

export type GenesisSourceManifestBuildReadiness =
  | "READY"
  | "BLOCKED";

export interface GenesisSourceManifestBuildResult {
  manifest:
    GenesisSourceManifest;

  readiness:
    GenesisSourceManifestBuildReadiness;

  errors:
    readonly HistoricalSourceDiscoveryError[];

  observations:
    readonly HistoricalSourceDiscoveryObservation[];

  discovererIds:
    readonly string[];
}

export interface BuildGenesisSourceManifestInput {
  scope:
    GenesisReplayScope;

  discoverers:
    readonly HistoricalSourceDiscoverer[];

  discoveredAt?:
    number;
}

export interface BuildDefaultGenesisSourceManifestInput {
  repositoryRoot:
    string;

  scope:
    GenesisReplayScope;

  discoveredAt?:
    number;

  additionalDiscoverers?:
    readonly HistoricalSourceDiscoverer[];
}

function canonicalManifestEntries(
  input: {
    scope:
      GenesisReplayScope;

    replayContractVersion:
      string;

    entries:
      readonly GenesisSourceManifestEntry[];
  },
): readonly GenesisSourceManifestEntry[] {
  const canonical =
    canonicalizeGenesisSourceManifestIdentityInput({
      replayContractVersion:
        input.replayContractVersion,

      scope:
        input.scope,

      entries:
        input.entries,
    });

  const entriesById =
    new Map(
      input.entries.map(
        (
          entry,
        ) => [
          entry.historicalSourceId,
          entry,
        ] as const,
      ),
    );

  return canonical.entries.map(
    (
      canonicalEntry,
    ) => {
      const fullEntry =
        entriesById.get(
          canonicalEntry
            .historicalSourceId,
        );

      if (
        !fullEntry
      ) {
        throw new Error(
          "genesis_manifest_builder_canonical_entry_missing",
        );
      }

      return fullEntry;
    },
  );
}

function readinessFor(
  errors:
    readonly HistoricalSourceDiscoveryError[],
): GenesisSourceManifestBuildReadiness {
  return errors.length ===
    0
    ? "READY"
    : "BLOCKED";
}

export function assertGenesisSourceManifestBuildReady(
  result:
    GenesisSourceManifestBuildResult,
): void {
  if (
    result.readiness !==
      "READY" ||
    result.errors.length >
      0
  ) {
    throw new Error(
      "genesis_source_manifest_discovery_incomplete",
    );
  }
}

export async function buildGenesisSourceManifest(
  input:
    BuildGenesisSourceManifestInput,
): Promise<
  GenesisSourceManifestBuildResult
> {
  validateGenesisReplayScope(
    input.scope,
  );

  const discovery =
    await aggregateHistoricalSourceDiscovery({
      scope:
        input.scope,

      discoverers:
        input.discoverers,
    });

  const replayContractVersion =
    input.scope
      .replayContractVersion
      .trim();

  const rawEntries =
    discovery.sources.map(
      historicalSourceToManifestEntry,
    );

  const entries =
    canonicalManifestEntries({
      scope:
        input.scope,

      replayContractVersion,

      entries:
        rawEntries,
    });

  const manifestId =
    createGenesisSourceManifestId({
      replayContractVersion,

      scope:
        input.scope,

      entries,
    });

  return {
    manifest: {
      manifestId,

      replayContractVersion,

      scope:
        input.scope,

      entries,

      discoveredAt:
        input.discoveredAt ??
        Date.now(),
    },

    readiness:
      readinessFor(
        discovery.errors,
      ),

    errors:
      discovery.errors,

    observations:
      discovery.observations,

    discovererIds:
      discovery.discovererIds,
  };
}

export async function buildDefaultGenesisSourceManifest(
  input:
    BuildDefaultGenesisSourceManifestInput,
): Promise<
  GenesisSourceManifestBuildResult
> {
  const discoveredAt =
    input.discoveredAt ??
    Date.now();

  return buildGenesisSourceManifest({
    scope:
      input.scope,

    discoveredAt,

    discoverers: [
      new DocumentationHistoricalSourceDiscoverer({
        repositoryRoot:
          input.repositoryRoot,

        discoveredAt:
          () =>
            discoveredAt,
      }),

      new GitHistoryHistoricalSourceDiscoverer({
        repositoryRoot:
          input.repositoryRoot,

        discoveredAt:
          () =>
            discoveredAt,
      }),

      ...(
        input.additionalDiscoverers ??
        []
      ),
    ],
  });
}
