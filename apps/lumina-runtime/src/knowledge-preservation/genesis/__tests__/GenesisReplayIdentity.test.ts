import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceType,
} from "../../evidence/index.js";

import type {
  GenesisReplayScope,
} from "../index.js";

import {
  allGenesisEvidenceTypes,
  createGenesisReplayId,
  genesisReplayScopeIsFull,
  genesisReplayScopeIsPartial,
  validateGenesisReplayScope,
} from "../index.js";

function partialScope(
  overrides:
    Partial<
      GenesisReplayScope
    > = {},
): GenesisReplayScope {
  return {
    mode:
      "partial",

    repository:
      "kore20lllc-netizen/korelumina",

    ref:
      "main",

    historicalStart:
      100,

    historicalEnd:
      200,

    includedEvidenceTypes: [
      "ADR",
      "document",
      "commit",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],

    governancePolicyVersion:
      "constitutional-governance-v1",

    replayContractVersion:
      "1.0",

    ...overrides,
  };
}

function fullScope():
  GenesisReplayScope {
  return {
    mode:
      "full",

    repository:
      "kore20lllc-netizen/korelumina",
    includedEvidenceTypes:
      allGenesisEvidenceTypes(),

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],

    governancePolicyVersion:
      "constitutional-governance-v1",

    replayContractVersion:
      "1.0",
  };
}

test(
  "same manifest scope and contract produce the same replay identity",
  () => {
    const input = {
      manifestId:
        "genesis-manifest:abc",

      replayContractVersion:
        "1.0",

      scope:
        partialScope(),
    };

    assert.equal(
      createGenesisReplayId(
        input,
      ),
      createGenesisReplayId(
        input,
      ),
    );
  },
);

test(
  "replay identity has the governed prefix and sha256 shape",
  () => {
    assert.match(
      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "1.0",

        scope:
          partialScope(),
      }),
      /^genesis-replay:[a-f0-9]{64}$/,
    );
  },
);

test(
  "different manifest identity produces a different replay identity",
  () => {
    const scope =
      partialScope();

    assert.notEqual(
      createGenesisReplayId({
        manifestId:
          "genesis-manifest:first",

        replayContractVersion:
          "1.0",

        scope,
      }),

      createGenesisReplayId({
        manifestId:
          "genesis-manifest:second",

        replayContractVersion:
          "1.0",

        scope,
      }),
    );
  },
);

test(
  "different replay scope produces a different replay identity",
  () => {
    assert.notEqual(
      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "1.0",

        scope:
          partialScope({
            historicalEnd:
              200,
          }),
      }),

      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "1.0",

        scope:
          partialScope({
            historicalEnd:
              300,
          }),
      }),
    );
  },
);

test(
  "scope list order does not affect replay identity",
  () => {
    const first:
      readonly EvidenceType[] =
      [
        "ADR",
        "document",
        "commit",
      ];

    const second:
      readonly EvidenceType[] =
      [
        "commit",
        "ADR",
        "document",
      ];

    assert.equal(
      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "1.0",

        scope:
          partialScope({
            includedEvidenceTypes:
              first,
          }),
      }),

      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "1.0",

        scope:
          partialScope({
            includedEvidenceTypes:
              second,
          }),
      }),
    );
  },
);

test(
  "governance policy change produces a different replay identity",
  () => {
    assert.notEqual(
      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "1.0",

        scope:
          partialScope({
            governancePolicyVersion:
              "governance-v1",
          }),
      }),

      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "1.0",

        scope:
          partialScope({
            governancePolicyVersion:
              "governance-v2",
          }),
      }),
    );
  },
);

test(
  "replay contract version change produces a different replay identity",
  () => {
    assert.notEqual(
      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "1.0",

        scope:
          partialScope({
            replayContractVersion:
              "1.0",
          }),
      }),

      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "2.0",

        scope:
          partialScope({
            replayContractVersion:
              "2.0",
          }),
      }),
    );
  },
);

test(
  "contradictory replay contract versions are rejected",
  () => {
    assert.throws(
      () =>
        createGenesisReplayId({
          manifestId:
            "genesis-manifest:abc",

          replayContractVersion:
            "1.0",

          scope:
            partialScope({
              replayContractVersion:
                "2.0",
            }),
        }),
      /genesis_replay_contract_version_mismatch/,
    );
  },
);

test(
  "partial replay is explicitly classified as partial",
  () => {
    assert.equal(
      genesisReplayScopeIsPartial(
        partialScope(),
      ),
      true,
    );

    assert.equal(
      genesisReplayScopeIsFull(
        partialScope(),
      ),
      false,
    );
  },
);

test(
  "complete unbounded all-source scope is classified as full",
  () => {
    assert.equal(
      genesisReplayScopeIsFull(
        fullScope(),
      ),
      true,
    );

    assert.equal(
      genesisReplayScopeIsPartial(
        fullScope(),
      ),
      false,
    );
  },
);

test(
  "full replay cannot have chronological bounds",
  () => {
    assert.throws(
      () =>
        validateGenesisReplayScope({
          ...fullScope(),

          historicalStart:
            100,
        }),
      /genesis_full_replay_scope_cannot_bound_chronology/,
    );
  },
);

test(
  "full replay cannot exclude evidence types",
  () => {
    assert.throws(
      () =>
        validateGenesisReplayScope({
          ...fullScope(),

          includedEvidenceTypes:
            allGenesisEvidenceTypes()
              .filter(
                (
                  type,
                ) =>
                  type !==
                  "conversation",
              ),

          excludedEvidenceTypes: [
            "conversation",
          ],
        }),
      /genesis_full_replay_scope_cannot_exclude_sources/,
    );
  },
);

test(
  "full replay must include every governed EvidenceType",
  () => {
    assert.throws(
      () =>
        validateGenesisReplayScope({
          ...fullScope(),

          includedEvidenceTypes:
            allGenesisEvidenceTypes()
              .filter(
                (
                  type,
                ) =>
                  type !==
                  "conversation",
              ),
        }),
      /genesis_full_replay_scope_must_include_all_evidence_types/,
    );
  },
);

test(
  "invalid chronological range is rejected",
  () => {
    assert.throws(
      () =>
        validateGenesisReplayScope(
          partialScope({
            historicalStart:
              300,

            historicalEnd:
              200,
          }),
        ),
      /genesis_replay_scope_historical_range_invalid/,
    );
  },
);

test(
  "evidence type cannot be both included and excluded",
  () => {
    assert.throws(
      () =>
        validateGenesisReplayScope(
          partialScope({
            excludedEvidenceTypes: [
              "ADR",
            ],
          }),
        ),
      /genesis_replay_scope_evidence_type_included_and_excluded/,
    );
  },
);

test(
  "duplicate evidence type declarations are rejected",
  () => {
    assert.throws(
      () =>
        validateGenesisReplayScope(
          partialScope({
            includedEvidenceTypes: [
              "ADR",
              "ADR",
            ],
          }),
        ),
      /genesis_replay_scope_duplicate_included_evidence_type/,
    );
  },
);

test(
  "repository identity is required",
  () => {
    assert.throws(
      () =>
        validateGenesisReplayScope(
          partialScope({
            repository:
              " ",
          }),
        ),
      /genesis_replay_scope_repository_required/,
    );
  },
);

test(
  "manifest identity is required for replay identity",
  () => {
    assert.throws(
      () =>
        createGenesisReplayId({
          manifestId:
            " ",

          replayContractVersion:
            "1.0",

          scope:
            partialScope(),
        }),
      /genesis_replay_manifest_id_required/,
    );
  },
);

test(
  "replay identity does not depend on execution time",
  () => {
    const before =
      Date.now();

    const first =
      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "1.0",

        scope:
          partialScope(),
      });

    const after =
      Date.now();

    const second =
      createGenesisReplayId({
        manifestId:
          "genesis-manifest:abc",

        replayContractVersion:
          "1.0",

        scope:
          partialScope(),
      });

    assert.ok(
      after >= before,
    );

    assert.equal(
      first,
      second,
    );
  },
);


test(
  "full replay cannot be bounded by a Git ref",
  () => {
    assert.throws(
      () =>
        validateGenesisReplayScope({
          ...fullScope(),

          ref:
            "main",
        }),
      /genesis_full_replay_scope_cannot_bound_ref/,
    );
  },
);
