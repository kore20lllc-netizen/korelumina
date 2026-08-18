import type {
  EvidenceType,
} from "../evidence/index.js";

export type HistoricalSourceId =
  `genesis-source:${EvidenceType}:${string}`;

export type HistoricalSourceReplayEligibility =
  | "eligible"
  | "excluded"
  | "blocked";

export interface HistoricalSourceAuthority {
  authorityClass:
    string;

  approvalState?:
    string;

  owner?:
    string;

  scope?:
    string;

  version?:
    string;
}

export interface HistoricalSourceTimestamp {
  value:
    number;

  source:
    string;
}

export interface HistoricalSourceProvenance {
  locator:
    string;

  nativeId?:
    string;

  repository?:
    string;

  ref?:
    string;

  parentIds?:
    readonly string[];
}

export interface HistoricalSource {
  historicalSourceId:
    HistoricalSourceId;

  evidenceType:
    EvidenceType;

  stableSourceKey:
    string;

  sourceChecksum:
    string;

  provenance:
    HistoricalSourceProvenance;

  historicalTimestamp:
    HistoricalSourceTimestamp;

  authority:
    HistoricalSourceAuthority;

  replayEligibility:
    HistoricalSourceReplayEligibility;

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
