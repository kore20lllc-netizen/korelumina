import {
  createHash,
} from "node:crypto";

import type {
  GenesisReplayScope,
} from "./GenesisSourceManifest.js";

import {
  validateGenesisReplayScope,
} from "./GenesisReplayScope.js";

export type GenesisReplayId =
  `genesis-replay:${string}`;

export interface GenesisReplayIdentityInput {
  manifestId:
    string;

  replayContractVersion:
    string;

  scope:
    GenesisReplayScope;
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

function canonicalScope(
  scope:
    GenesisReplayScope,
) {
  return {
    mode:
      scope.mode,

    repository:
      scope.repository.trim(),

    ref:
      scope.ref?.trim(),

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
      scope
        .governancePolicyVersion
        .trim(),

    replayContractVersion:
      scope
        .replayContractVersion
        .trim(),
  };
}

export function createGenesisReplayId(
  input:
    GenesisReplayIdentityInput,
): GenesisReplayId {
  const manifestId =
    requireNonEmpty(
      input.manifestId,
      "genesis_replay_manifest_id_required",
    );

  const replayContractVersion =
    requireNonEmpty(
      input.replayContractVersion,
      "genesis_replay_contract_version_required",
    );

  validateGenesisReplayScope(
    input.scope,
  );

  if (
    replayContractVersion !==
    input.scope
      .replayContractVersion
      .trim()
  ) {
    throw new Error(
      "genesis_replay_contract_version_mismatch",
    );
  }

  const canonical = {
    manifestId,

    replayContractVersion,

    scope:
      canonicalScope(
        input.scope,
      ),
  };

  const digest =
    createHash(
      "sha256",
    )
      .update(
        JSON.stringify(
          canonical,
        ),
        "utf8",
      )
      .digest(
        "hex",
      );

  return (
    `genesis-replay:${digest}`
  ) as GenesisReplayId;
}
