import type {
  EvidenceType,
} from "../evidence/index.js";

import type {
  HistoricalSource,
  HistoricalSourceClass,
  HistoricalSourceId,
} from "./HistoricalSource.js";

export const GENESIS_REPLAY_CONTRACT_VERSION =
  "1.0";

export type GenesisReplayScopeMode =
  | "full"
  | "partial";

export interface GenesisReplayScope {
  mode:
    GenesisReplayScopeMode;

  repository:
    string;

  ref?:
    string;

  historicalStart?:
    number;

  historicalEnd?:
    number;

  includedEvidenceTypes:
    readonly EvidenceType[];

  excludedEvidenceTypes:
    readonly EvidenceType[];

  explicitlyExcludedSourceIds:
    readonly HistoricalSourceId[];

  governancePolicyVersion:
    string;

  replayContractVersion:
    string;
}

export interface GenesisSourceManifestEntry {
  historicalSourceId:
    HistoricalSourceId;

  sourceType:
    HistoricalSourceClass;

  evidenceType:
    EvidenceType;

  authorityClass:
    string;

  approvalState?:
    string;

  provenanceLocator:
    string;

  sourceChecksum:
    string;

  historicalTimestamp:
    number;

  historicalTimestampSource:
    string;

  discoveredAt:
    number;

  discoveryMethod:
    string;

  replayEligibility:
    HistoricalSource["replayEligibility"];

  exclusionReason?:
    string;

  supersedes:
    readonly HistoricalSourceId[];

  conflictsWith:
    readonly HistoricalSourceId[];

  metadata:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}

export interface GenesisSourceManifest {
  manifestId:
    string;

  replayContractVersion:
    string;

  scope:
    GenesisReplayScope;

  entries:
    readonly GenesisSourceManifestEntry[];

  discoveredAt:
    number;
}

export function historicalSourceToManifestEntry(
  source:
    HistoricalSource,
): GenesisSourceManifestEntry {
  return {
    historicalSourceId:
      source.historicalSourceId,

    sourceType:
      source.sourceClass,

    evidenceType:
      source.evidenceType,

    authorityClass:
      source.authority.authorityClass,

    approvalState:
      source.authority.approvalState,

    provenanceLocator:
      source.provenance.locator,

    sourceChecksum:
      source.sourceChecksum,

    historicalTimestamp:
      source.historicalTimestamp.value,

    historicalTimestampSource:
      source.historicalTimestamp.source,

    discoveredAt:
      source.discoveredAt,

    discoveryMethod:
      source.discoveryMethod,

    replayEligibility:
      source.replayEligibility,

    exclusionReason:
      source.exclusionReason,

    supersedes: [
      ...source.supersedes,
    ],

    conflictsWith: [
      ...source.conflictsWith,
    ],

    metadata: {
      ...source.metadata,
    },
  };
}
