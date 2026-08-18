import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeGenesisSourceManifestIdentityInput,
  createGenesisSourceManifestId,
  createHistoricalSourceId,
  historicalSourceToManifestEntry,
} from "../index.js";

import type {
  GenesisReplayScope,
  HistoricalSource,
} from "../index.js";

function scope(
  overrides:
    Partial<
      GenesisReplayScope
    > = {},
): GenesisReplayScope {
  return {
    repository:
      "kore20lllc-netizen/korelumina",

    ref:
      "main",

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

function source(
  input: {
    id:
      string;

    evidenceType:
      "ADR" |
      "document" |
      "commit";

    timestamp:
      number;

    checksum:
      string;

    locator:
      string;
  },
): HistoricalSource {
  return {
    historicalSourceId:
      createHistoricalSourceId(
        input.evidenceType,
        input.id,
      ),

    sourceClass:
      input.evidenceType === "document"
        ? "architecture-document"
        : input.evidenceType,

    evidenceType:
      input.evidenceType,

    stableSourceKey:
      input.id,

    sourceChecksum:
      input.checksum,

    provenance: {
      locator:
        input.locator,

      nativeId:
        input.id,

      repository:
        "kore20lllc-netizen/korelumina",
    },

    historicalTimestamp: {
      value:
        input.timestamp,

      source:
        "fixture",
    },

    discoveredAt:
      5000,

    discoveryMethod:
      "deterministic-fixture-discovery",

    authority: {
      authorityClass:
        "architecture",
    },

    replayEligibility:
      "eligible",

    supersedes:
      [],

    conflictsWith:
      [],

    metadata: {
      b:
        2,

      a:
        1,
    },
  };
}

const firstSource =
  source({
    id:
      "adr-001",

    evidenceType:
      "ADR",

    timestamp:
      100,

    checksum:
      "sha256:adr",

    locator:
      "docs/adr/ADR-001.md",
  });

const secondSource =
  source({
    id:
      "commit-001",

    evidenceType:
      "commit",

    timestamp:
      200,

    checksum:
      "sha256:commit",

    locator:
      "git:commit:commit-001",
  });

test(
  "manifest identity is deterministic for the same scope and sources",
  () => {
    const input = {
      replayContractVersion:
        "1.0",

      scope:
        scope(),

      entries: [
        historicalSourceToManifestEntry(
          firstSource,
        ),

        historicalSourceToManifestEntry(
          secondSource,
        ),
      ],
    };

    assert.equal(
      createGenesisSourceManifestId(
        input,
      ),
      createGenesisSourceManifestId(
        input,
      ),
    );
  },
);

test(
  "manifest identity is independent from discoveredAt execution time",
  () => {
    const entries = [
      historicalSourceToManifestEntry(
        firstSource,
      ),
    ];

    const first = {
      manifestId:
        createGenesisSourceManifestId({
          replayContractVersion:
            "1.0",

          scope:
            scope(),

          entries,
        }),

      discoveredAt:
        1000,
    };

    const second = {
      manifestId:
        createGenesisSourceManifestId({
          replayContractVersion:
            "1.0",

          scope:
            scope(),

          entries,
        }),

      discoveredAt:
        Date.now(),
    };

    assert.equal(
      first.manifestId,
      second.manifestId,
    );

    assert.notEqual(
      first.discoveredAt,
      second.discoveredAt,
    );
  },
);

test(
  "manifest identity changes when source checksum changes",
  () => {
    const original =
      historicalSourceToManifestEntry(
        firstSource,
      );

    const mutated = {
      ...original,

      sourceChecksum:
        "sha256:changed",
    };

    assert.notEqual(
      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          original,
        ],
      }),

      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          mutated,
        ],
      }),
    );
  },
);

test(
  "manifest identity changes when replay scope changes",
  () => {
    const entries = [
      historicalSourceToManifestEntry(
        firstSource,
      ),
    ];

    const first =
      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries,
      });

    const second =
      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope({
            ref:
              "release/2026",
          }),

        entries,
      });

    assert.notEqual(
      first,
      second,
    );
  },
);

test(
  "manifest identity changes when governance policy version changes",
  () => {
    const entries = [
      historicalSourceToManifestEntry(
        firstSource,
      ),
    ];

    assert.notEqual(
      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries,
      }),

      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope({
            governancePolicyVersion:
              "constitutional-governance-v2",
          }),

        entries,
      }),
    );
  },
);

test(
  "manifest identity is stable when source input order changes",
  () => {
    const first =
      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          historicalSourceToManifestEntry(
            firstSource,
          ),

          historicalSourceToManifestEntry(
            secondSource,
          ),
        ],
      });

    const second =
      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          historicalSourceToManifestEntry(
            secondSource,
          ),

          historicalSourceToManifestEntry(
            firstSource,
          ),
        ],
      });

    assert.equal(
      first,
      second,
    );
  },
);

test(
  "manifest identity is stable when scope list order changes",
  () => {
    const entries = [
      historicalSourceToManifestEntry(
        firstSource,
      ),
    ];

    assert.equal(
      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope({
            includedEvidenceTypes: [
              "commit",
              "ADR",
              "document",
            ],
          }),

        entries,
      }),

      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope({
            includedEvidenceTypes: [
              "document",
              "commit",
              "ADR",
            ],
          }),

        entries,
      }),
    );
  },
);

test(
  "manifest identity is stable when metadata key order changes",
  () => {
    const entry =
      historicalSourceToManifestEntry(
        firstSource,
      );

    const reordered = {
      ...entry,

      metadata: {
        a:
          1,

        b:
          2,
      },
    };

    assert.equal(
      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          entry,
        ],
      }),

      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          reordered,
        ],
      }),
    );
  },
);

test(
  "manifest identity changes when replay eligibility changes",
  () => {
    const entry =
      historicalSourceToManifestEntry(
        firstSource,
      );

    assert.notEqual(
      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          entry,
        ],
      }),

      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          {
            ...entry,

            replayEligibility:
              "excluded",

            exclusionReason:
              "governed exclusion",
          },
        ],
      }),
    );
  },
);


test(
  "manifest entry preserves discovery provenance",
  () => {
    const entry =
      historicalSourceToManifestEntry(
        firstSource,
      );

    assert.equal(
      entry.sourceType,
      "ADR",
    );

    assert.equal(
      entry.discoveredAt,
      5000,
    );

    assert.equal(
      entry.discoveryMethod,
      "deterministic-fixture-discovery",
    );
  },
);

test(
  "entry discovery execution time does not affect manifest identity",
  () => {
    const entry =
      historicalSourceToManifestEntry(
        firstSource,
      );

    const rediscovered = {
      ...entry,

      discoveredAt:
        Date.now(),

      discoveryMethod:
        "second-deterministic-discovery-pass",
    };

    assert.equal(
      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          entry,
        ],
      }),

      createGenesisSourceManifestId({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          rediscovered,
        ],
      }),
    );
  },
);

test(
  "manifest identity rejects contradictory replay contract versions",
  () => {
    assert.throws(
      () =>
        createGenesisSourceManifestId({
          replayContractVersion:
            "1.0",

          scope:
            scope({
              replayContractVersion:
                "2.0",
            }),

          entries: [
            historicalSourceToManifestEntry(
              firstSource,
            ),
          ],
        }),
      /genesis_manifest_replay_contract_version_mismatch/,
    );
  },
);

test(
  "equal historical timestamps are ordered by governed source-class priority",
  () => {
    const commitEntry =
      historicalSourceToManifestEntry(
        source({
          id:
            "commit-same-time",

          evidenceType:
            "commit",

          timestamp:
            100,

          checksum:
            "sha256:commit-same-time",

          locator:
            "aaa:commit",
        }),
      );

    const adrEntry =
      historicalSourceToManifestEntry(
        source({
          id:
            "adr-same-time",

          evidenceType:
            "ADR",

          timestamp:
            100,

          checksum:
            "sha256:adr-same-time",

          locator:
            "zzz:adr",
        }),
      );

    const canonical =
      canonicalizeGenesisSourceManifestIdentityInput({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          commitEntry,
          adrEntry,
        ],
      });

    assert.equal(
      canonical.entries[0]
        .historicalSourceId,
      adrEntry.historicalSourceId,
    );

    assert.equal(
      canonical.entries[1]
        .historicalSourceId,
      commitEntry.historicalSourceId,
    );
  },
);

test(
  "provenance locator breaks ties only after timestamp and source-class priority",
  () => {
    const zEntry =
      historicalSourceToManifestEntry(
        source({
          id:
            "commit-z",

          evidenceType:
            "commit",

          timestamp:
            100,

          checksum:
            "sha256:z",

          locator:
            "git:commit:z",
        }),
      );

    const aEntry =
      historicalSourceToManifestEntry(
        source({
          id:
            "commit-a",

          evidenceType:
            "commit",

          timestamp:
            100,

          checksum:
            "sha256:a",

          locator:
            "git:commit:a",
        }),
      );

    const canonical =
      canonicalizeGenesisSourceManifestIdentityInput({
        replayContractVersion:
          "1.0",

        scope:
          scope(),

        entries: [
          zEntry,
          aEntry,
        ],
      });

    assert.equal(
      canonical.entries[0]
        .historicalSourceId,
      aEntry.historicalSourceId,
    );

    assert.equal(
      canonical.entries[1]
        .historicalSourceId,
      zEntry.historicalSourceId,
    );
  },
);
