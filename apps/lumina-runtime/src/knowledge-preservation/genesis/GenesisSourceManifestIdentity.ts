import {
  createHash,
} from "node:crypto";

import type {
  GenesisReplayScope,
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

export interface GenesisSourceManifestIdentityInput {
  replayContractVersion:
    string;

  scope:
    GenesisReplayScope;

  entries:
    readonly GenesisSourceManifestEntry[];
}

type ManifestIdentityEntry =
  Omit<
    GenesisSourceManifestEntry,
    "discoveredAt" |
    "discoveryMethod"
  >;

const SOURCE_CLASS_PRIORITY:
  Readonly<
    Record<
      GenesisSourceManifestEntry["sourceType"],
      number
    >
  > = {
    ADR: 1,
    RFC: 2,

    "architecture-document": 3,
    document: 3,

    specification: 4,

    roadmap: 5,
    milestone: 5,

    "source-file": 6,

    commit: 7,
    tag: 7,
    branch: 7,

    "runtime-event": 8,
    "incident-log": 8,

    conversation: 9,

    "engineering-execution": 10,
    issue: 10,
    "pull-request": 10,
    "build-output": 10,
  };

export function genesisSourceClassPriority(
  sourceType:
    GenesisSourceManifestEntry["sourceType"],
): number {
  return SOURCE_CLASS_PRIORITY[
    sourceType
  ];
}

function stableRecord(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableRecord,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return Object.fromEntries(
      Object.entries(
        value as
          Record<
            string,
            unknown
          >,
      )
        .sort(
          (
            [left],
            [right],
          ) =>
            left.localeCompare(
              right,
            ),
        )
        .map(
          (
            [key, entry],
          ) => [
            key,
            stableRecord(
              entry,
            ),
          ],
        ),
    );
  }

  return value;
}

function canonicalizeScope(
  scope:
    GenesisReplayScope,
): GenesisReplayScope {
  return {
    repository:
      scope.repository,

    ref:
      scope.ref,

    historicalStart:
      scope.historicalStart,

    historicalEnd:
      scope.historicalEnd,

    includedEvidenceTypes: [
      ...scope
        .includedEvidenceTypes,
    ].sort(),

    excludedEvidenceTypes: [
      ...scope
        .excludedEvidenceTypes,
    ].sort(),

    explicitlyExcludedSourceIds: [
      ...scope
        .explicitlyExcludedSourceIds,
    ].sort(),

    governancePolicyVersion:
      scope.governancePolicyVersion,

    replayContractVersion:
      scope.replayContractVersion,
  };
}

function canonicalizeEntry(
  entry:
    GenesisSourceManifestEntry,
): ManifestIdentityEntry {
  return {
    historicalSourceId:
      entry.historicalSourceId,

    sourceType:
      entry.sourceType,

    evidenceType:
      entry.evidenceType,

    authorityClass:
      entry.authorityClass,

    approvalState:
      entry.approvalState,

    provenanceLocator:
      entry.provenanceLocator,

    sourceChecksum:
      entry.sourceChecksum,

    historicalTimestamp:
      entry.historicalTimestamp,

    historicalTimestampSource:
      entry
        .historicalTimestampSource,

    replayEligibility:
      entry.replayEligibility,

    exclusionReason:
      entry.exclusionReason,

    supersedes: [
      ...entry.supersedes,
    ].sort(),

    conflictsWith: [
      ...entry.conflictsWith,
    ].sort(),

    metadata:
      stableRecord(
        entry.metadata,
      ) as Readonly<
        Record<
          string,
          unknown
        >
      >,
  };
}

function assertReplayContractVersionConsistency(
  input:
    GenesisSourceManifestIdentityInput,
): void {
  if (
    input.replayContractVersion !==
    input.scope.replayContractVersion
  ) {
    throw new Error(
      "genesis_manifest_replay_contract_version_mismatch",
    );
  }
}

export function canonicalizeGenesisSourceManifestIdentityInput(
  input:
    GenesisSourceManifestIdentityInput,
) {
  assertReplayContractVersionConsistency(
    input,
  );

  const entries = [
    ...input.entries,
  ]
    .map(
      canonicalizeEntry,
    )
    .sort(
      (
        left,
        right,
      ) => {
        if (
          left.historicalTimestamp !==
          right.historicalTimestamp
        ) {
          return (
            left.historicalTimestamp -
            right.historicalTimestamp
          );
        }

        const sourceClassOrder =
          genesisSourceClassPriority(
            left.sourceType,
          ) -
          genesisSourceClassPriority(
            right.sourceType,
          );

        if (
          sourceClassOrder !==
          0
        ) {
          return sourceClassOrder;
        }

        const locatorOrder =
          left.provenanceLocator
            .localeCompare(
              right.provenanceLocator,
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
      },
    );

  return {
    replayContractVersion:
      input.replayContractVersion,

    scope:
      canonicalizeScope(
        input.scope,
      ),

    entries,
  };
}

export function createGenesisSourceManifestId(
  input:
    GenesisSourceManifestIdentityInput,
): string {
  const canonical =
    canonicalizeGenesisSourceManifestIdentityInput(
      input,
    );

  const digest =
    createHash(
      "sha256",
    )
      .update(
        JSON.stringify(
          stableRecord(
            canonical,
          ),
        ),
        "utf8",
      )
      .digest(
        "hex",
      );

  return `genesis-manifest:${digest}`;
}
