import {
  createHash,
} from "node:crypto";

import type {
  EvidenceType,
} from "../evidence/index.js";

import type {
  HistoricalSourceId,
} from "./HistoricalSource.js";

export interface DerivedHistoricalSourceKeyInput {
  provenanceLocator:
    string;
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

export function createHistoricalSourceId(
  evidenceType:
    EvidenceType,

  stableSourceKey:
    string,
): HistoricalSourceId {
  const normalizedKey =
    requireNonEmpty(
      stableSourceKey,
      "historical_source_stable_key_required",
    );

  return (
    `genesis-source:${evidenceType}:${normalizedKey}`
  ) as HistoricalSourceId;
}

export function deriveHistoricalSourceStableKey(
  input:
    DerivedHistoricalSourceKeyInput,
): string {
  const provenanceLocator =
    requireNonEmpty(
      input.provenanceLocator,
      "historical_source_provenance_locator_required",
    );

  const digest =
    createHash(
      "sha256",
    )
      .update(
        provenanceLocator,
        "utf8",
      )
      .digest(
        "hex",
      );

  return `derived:${digest}`;
}

export function createDerivedHistoricalSourceId(
  evidenceType:
    EvidenceType,

  input:
    DerivedHistoricalSourceKeyInput,
): HistoricalSourceId {
  return createHistoricalSourceId(
    evidenceType,
    deriveHistoricalSourceStableKey(
      input,
    ),
  );
}
