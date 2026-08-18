import type {
  EvidenceType,
} from "../evidence/index.js";

import type {
  GenesisReplayScope,
} from "./GenesisSourceManifest.js";

const ALL_EVIDENCE_TYPES:
  readonly EvidenceType[] =
  [
    "conversation",
    "commit",
    "tag",
    "branch",
    "ADR",
    "RFC",
    "document",
    "source-file",
    "runtime-event",
    "engineering-execution",
    "issue",
    "pull-request",
    "specification",
    "roadmap",
    "milestone",
    "build-output",
    "incident-log",
  ];

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

function hasDuplicates(
  values:
    readonly string[],
): boolean {
  return (
    new Set(
      values,
    ).size !==
    values.length
  );
}

export function validateGenesisReplayScope(
  scope:
    GenesisReplayScope,
): GenesisReplayScope {
  requireNonEmpty(
    scope.repository,
    "genesis_replay_scope_repository_required",
  );

  requireNonEmpty(
    scope.governancePolicyVersion,
    "genesis_replay_scope_governance_policy_version_required",
  );

  requireNonEmpty(
    scope.replayContractVersion,
    "genesis_replay_scope_contract_version_required",
  );

  if (
    scope.historicalStart !==
      undefined &&
    scope.historicalEnd !==
      undefined &&
    scope.historicalStart >
      scope.historicalEnd
  ) {
    throw new Error(
      "genesis_replay_scope_historical_range_invalid",
    );
  }

  if (
    hasDuplicates(
      scope.includedEvidenceTypes,
    )
  ) {
    throw new Error(
      "genesis_replay_scope_duplicate_included_evidence_type",
    );
  }

  if (
    hasDuplicates(
      scope.excludedEvidenceTypes,
    )
  ) {
    throw new Error(
      "genesis_replay_scope_duplicate_excluded_evidence_type",
    );
  }

  if (
    hasDuplicates(
      scope.explicitlyExcludedSourceIds,
    )
  ) {
    throw new Error(
      "genesis_replay_scope_duplicate_source_exclusion",
    );
  }

  const included =
    new Set(
      scope.includedEvidenceTypes,
    );

  for (
    const evidenceType
    of scope.excludedEvidenceTypes
  ) {
    if (
      included.has(
        evidenceType,
      )
    ) {
      throw new Error(
        "genesis_replay_scope_evidence_type_included_and_excluded",
      );
    }
  }

  if (
    scope.mode ===
      "full"
  ) {
    if (
      scope.ref !==
        undefined
    ) {
      throw new Error(
        "genesis_full_replay_scope_cannot_bound_ref",
      );
    }

    if (
      scope.historicalStart !==
        undefined ||
      scope.historicalEnd !==
        undefined
    ) {
      throw new Error(
        "genesis_full_replay_scope_cannot_bound_chronology",
      );
    }

    if (
      scope.excludedEvidenceTypes
        .length >
        0 ||
      scope
        .explicitlyExcludedSourceIds
        .length >
        0
    ) {
      throw new Error(
        "genesis_full_replay_scope_cannot_exclude_sources",
      );
    }

    const fullSet =
      new Set(
        scope.includedEvidenceTypes,
      );

    if (
      ALL_EVIDENCE_TYPES.some(
        (
          evidenceType,
        ) =>
          !fullSet.has(
            evidenceType,
          ),
      )
    ) {
      throw new Error(
        "genesis_full_replay_scope_must_include_all_evidence_types",
      );
    }
  }

  return scope;
}

export function genesisReplayScopeIsPartial(
  scope:
    GenesisReplayScope,
): boolean {
  validateGenesisReplayScope(
    scope,
  );

  return (
    scope.mode ===
    "partial"
  );
}

export function genesisReplayScopeIsFull(
  scope:
    GenesisReplayScope,
): boolean {
  return !genesisReplayScopeIsPartial(
    scope,
  );
}

export function allGenesisEvidenceTypes():
  readonly EvidenceType[] {
  return [
    ...ALL_EVIDENCE_TYPES,
  ];
}
