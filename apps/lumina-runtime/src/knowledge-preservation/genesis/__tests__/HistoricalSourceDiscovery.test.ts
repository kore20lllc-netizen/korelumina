import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayScope,
  HistoricalSource,
  HistoricalSourceDiscoverer,
} from "../index.js";

import {
  aggregateHistoricalSourceDiscovery,
  createHistoricalSourceId,
  orderHistoricalSourcesForDiscovery,
} from "../index.js";

function scope():
  GenesisReplayScope {
  return {
    mode:
      "partial",

    repository:
      "kore20lllc-netizen/korelumina",

    ref:
      "main",

    includedEvidenceTypes: [
      "ADR",
      "document",
      "commit",
      "conversation",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],

    governancePolicyVersion:
      "governance-v1",

    replayContractVersion:
      "1.0",
  };
}

function source(
  input: {
    id:
      string;

    sourceClass:
      HistoricalSource[
        "sourceClass"
      ];

    evidenceType:
      HistoricalSource[
        "evidenceType"
      ];

    locator:
      string;

    checksum?:
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
      input.sourceClass,

    evidenceType:
      input.evidenceType,

    stableSourceKey:
      input.id,

    sourceChecksum:
      input.checksum ??
      `sha256:${input.id}`,

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
        100,

      source:
        "fixture",
    },

    discoveredAt:
      1000,

    discoveryMethod:
      "fixture",

    authority: {
      authorityClass:
        "fixture",
    },

    replayEligibility:
      "eligible",

    supersedes:
      [],

    conflictsWith:
      [],

    metadata:
      {},
  };
}

function discoverer(
  input: {
    id:
      string;

    sourceClasses:
      HistoricalSourceDiscoverer[
        "sourceClasses"
      ];

    sources?:
      readonly HistoricalSource[];

    throws?:
      boolean;
  },
): HistoricalSourceDiscoverer {
  return {
    id:
      input.id,

    sourceClasses:
      input.sourceClasses,

    async discover() {
      if (
        input.throws
      ) {
        throw new Error(
          "fixture discovery failure",
        );
      }

      return {
        discovererId:
          input.id,

        sources:
          input.sources ??
          [],

        errors:
          [],
      };
    },
  };
}

test(
  "discovery ordering follows recovery source-class priority before locator",
  () => {
    const commit =
      source({
        id:
          "commit-a",

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        locator:
          "aaa:commit",
      });

    const adr =
      source({
        id:
          "adr-a",

        sourceClass:
          "ADR",

        evidenceType:
          "ADR",

        locator:
          "zzz:adr",
      });

    const ordered =
      orderHistoricalSourcesForDiscovery([
        commit,
        adr,
      ]);

    assert.equal(
      ordered[0]
        .historicalSourceId,
      adr.historicalSourceId,
    );

    assert.equal(
      ordered[1]
        .historicalSourceId,
      commit.historicalSourceId,
    );
  },
);

test(
  "discovery order is independent from source input order",
  () => {
    const a =
      source({
        id:
          "a",

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        locator:
          "git:a",
      });

    const b =
      source({
        id:
          "b",

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        locator:
          "git:b",
      });

    assert.deepEqual(
      orderHistoricalSourcesForDiscovery([
        b,
        a,
      ]).map(
        (
          item,
        ) =>
          item.historicalSourceId,
      ),

      orderHistoricalSourcesForDiscovery([
        a,
        b,
      ]).map(
        (
          item,
        ) =>
          item.historicalSourceId,
      ),
    );
  },
);

test(
  "discoverers execute according to recovery priority rather than registration order",
  async () => {
    const aggregate =
      await aggregateHistoricalSourceDiscovery({
        scope:
          scope(),

        discoverers: [
          discoverer({
            id:
              "git",

            sourceClasses: [
              "commit",
            ],
          }),

          discoverer({
            id:
              "adr",

            sourceClasses: [
              "ADR",
            ],
          }),
        ],
      });

    assert.deepEqual(
      aggregate.discovererIds,
      [
        "adr",
        "git",
      ],
    );
  },
);

test(
  "discoverers with the same priority are ordered by stable discoverer identity",
  async () => {
    const aggregate =
      await aggregateHistoricalSourceDiscovery({
        scope:
          scope(),

        discoverers: [
          discoverer({
            id:
              "zeta",

            sourceClasses: [
              "commit",
            ],
          }),

          discoverer({
            id:
              "alpha",

            sourceClasses: [
              "commit",
            ],
          }),
        ],
      });

    assert.deepEqual(
      aggregate.discovererIds,
      [
        "alpha",
        "zeta",
      ],
    );
  },
);

test(
  "aggregate preserves errors without discarding successfully discovered sources",
  async () => {
    const commit =
      source({
        id:
          "commit-a",

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        locator:
          "git:a",
      });

    const aggregate =
      await aggregateHistoricalSourceDiscovery({
        scope:
          scope(),

        discoverers: [
          discoverer({
            id:
              "git",

            sourceClasses: [
              "commit",
            ],

            sources: [
              commit,
            ],
          }),

          discoverer({
            id:
              "conversation",

            sourceClasses: [
              "conversation",
            ],

            throws:
              true,
          }),
        ],
      });

    assert.equal(
      aggregate.sources.length,
      1,
    );

    assert.equal(
      aggregate.errors.length,
      1,
    );

    assert.equal(
      aggregate.errors[0].code,
      "DISCOVERY_FAILED",
    );

    assert.equal(
      aggregate.errors[0]
        .discovererId,
      "conversation",
    );
  },
);

test(
  "identical source identity and checksum from multiple discoverers is deduplicated",
  async () => {
    const shared =
      source({
        id:
          "commit-a",

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        locator:
          "git:a",
      });

    const aggregate =
      await aggregateHistoricalSourceDiscovery({
        scope:
          scope(),

        discoverers: [
          discoverer({
            id:
              "git-primary",

            sourceClasses: [
              "commit",
            ],

            sources: [
              shared,
            ],
          }),

          discoverer({
            id:
              "git-secondary",

            sourceClasses: [
              "commit",
            ],

            sources: [
              shared,
            ],
          }),
        ],
      });

    assert.equal(
      aggregate.sources.length,
      1,
    );
  },
);

test(
  "same source identity with a different checksum is rejected as a mutation conflict",
  async () => {
    const original =
      source({
        id:
          "commit-a",

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        locator:
          "git:a",

        checksum:
          "sha256:first",
      });

    const mutated =
      source({
        id:
          "commit-a",

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        locator:
          "git:a",

        checksum:
          "sha256:second",
      });

    await assert.rejects(
      () =>
        aggregateHistoricalSourceDiscovery({
          scope:
            scope(),

          discoverers: [
            discoverer({
              id:
                "first",

              sourceClasses: [
                "commit",
              ],

              sources: [
                original,
              ],
            }),

            discoverer({
              id:
                "second",

              sourceClasses: [
                "commit",
              ],

              sources: [
                mutated,
              ],
            }),
          ],
        }),
      /genesis_discovery_source_identity_checksum_conflict/,
    );
  },
);

test(
  "same source identity with incompatible provenance is rejected",
  async () => {
    const first =
      source({
        id:
          "commit-a",

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        locator:
          "git:first",
      });

    const second =
      source({
        id:
          "commit-a",

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        locator:
          "git:second",
      });

    await assert.rejects(
      () =>
        aggregateHistoricalSourceDiscovery({
          scope:
            scope(),

          discoverers: [
            discoverer({
              id:
                "first",

              sourceClasses: [
                "commit",
              ],

              sources: [
                first,
              ],
            }),

            discoverer({
              id:
                "second",

              sourceClasses: [
                "commit",
              ],

              sources: [
                second,
              ],
            }),
          ],
        }),
      /genesis_discovery_source_identity_contract_conflict/,
    );
  },
);

test(
  "discoverer may only return source classes it declares ownership of",
  async () => {
    await assert.rejects(
      () =>
        aggregateHistoricalSourceDiscovery({
          scope:
            scope(),

          discoverers: [
            discoverer({
              id:
                "bad",

              sourceClasses: [
                "ADR",
              ],

              sources: [
                source({
                  id:
                    "commit-a",

                  sourceClass:
                    "commit",

                  evidenceType:
                    "commit",

                  locator:
                    "git:a",
                }),
              ],
            }),
          ],
        }),
      /genesis_discovery_source_class_not_owned/,
    );
  },
);

test(
  "duplicate discoverer identity is rejected",
  async () => {
    await assert.rejects(
      () =>
        aggregateHistoricalSourceDiscovery({
          scope:
            scope(),

          discoverers: [
            discoverer({
              id:
                "same",

              sourceClasses: [
                "ADR",
              ],
            }),

            discoverer({
              id:
                "same",

              sourceClasses: [
                "commit",
              ],
            }),
          ],
        }),
      /genesis_duplicate_discoverer_id/,
    );
  },
);

test(
  "discoverer identity is required",
  async () => {
    await assert.rejects(
      () =>
        aggregateHistoricalSourceDiscovery({
          scope:
            scope(),

          discoverers: [
            discoverer({
              id:
                " ",

              sourceClasses: [
                "ADR",
              ],
            }),
          ],
        }),
      /genesis_discoverer_id_required/,
    );
  },
);

test(
  "discoverer must declare at least one source class",
  async () => {
    await assert.rejects(
      () =>
        aggregateHistoricalSourceDiscovery({
          scope:
            scope(),

          discoverers: [
            discoverer({
              id:
                "empty",

              sourceClasses:
                [],
            }),
          ],
        }),
      /genesis_discoverer_source_class_required/,
    );
  },
);

test(
  "discovery result must retain the producing discoverer identity",
  async () => {
    const bad:
      HistoricalSourceDiscoverer =
      {
        id:
          "expected",

        sourceClasses: [
          "ADR",
        ],

        async discover() {
          return {
            discovererId:
              "different",

            sources:
              [],

            errors:
              [],
          };
        },
      };

    await assert.rejects(
      () =>
        aggregateHistoricalSourceDiscovery({
          scope:
            scope(),

          discoverers: [
            bad,
          ],
        }),
      /genesis_discovery_result_discoverer_id_mismatch/,
    );
  },
);

test(
  "discovery errors are returned in deterministic canonical order",
  async () => {
    const unordered:
      HistoricalSourceDiscoverer =
      {
        id:
          "document-discovery",

        sourceClasses: [
          "document",
        ],

        async discover() {
          return {
            discovererId:
              "document-discovery",

            sources:
              [],

            errors: [
              {
                code:
                  "TIMESTAMP_UNAVAILABLE",

                discovererId:
                  "document-discovery",

                provenanceLocator:
                  "docs/z.md",

                message:
                  "z timestamp unavailable",
              },

              {
                code:
                  "PROVENANCE_INCOMPLETE",

                discovererId:
                  "document-discovery",

                provenanceLocator:
                  "docs/a.md",

                message:
                  "a provenance incomplete",
              },

              {
                code:
                  "PROVENANCE_INCOMPLETE",

                discovererId:
                  "document-discovery",

                provenanceLocator:
                  "docs/b.md",

                message:
                  "b provenance incomplete",
              },
            ],
          };
        },
      };

    const first =
      await aggregateHistoricalSourceDiscovery({
        scope:
          scope(),

        discoverers: [
          unordered,
        ],
      });

    const second =
      await aggregateHistoricalSourceDiscovery({
        scope:
          scope(),

        discoverers: [
          unordered,
        ],
      });

    assert.deepEqual(
      first.errors,
      second.errors,
    );

    assert.deepEqual(
      first.errors.map(
        (
          error,
        ) => [
          error.code,
          error.provenanceLocator,
        ],
      ),
      [
        [
          "PROVENANCE_INCOMPLETE",
          "docs/a.md",
        ],
        [
          "PROVENANCE_INCOMPLETE",
          "docs/b.md",
        ],
        [
          "TIMESTAMP_UNAVAILABLE",
          "docs/z.md",
        ],
      ],
    );
  },
);

test(
  "deduplicated sources retain every discoverer that independently observed them",
  async () => {
    const shared =
      source({
        id:
          "commit-shared",

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        locator:
          "git:commit:shared",
      });

    const aggregate =
      await aggregateHistoricalSourceDiscovery({
        scope:
          scope(),

        discoverers: [
          discoverer({
            id:
              "secondary-git",

            sourceClasses: [
              "commit",
            ],

            sources: [
              shared,
            ],
          }),

          discoverer({
            id:
              "primary-git",

            sourceClasses: [
              "commit",
            ],

            sources: [
              shared,
            ],
          }),
        ],
      });

    assert.equal(
      aggregate.sources.length,
      1,
    );

    assert.deepEqual(
      aggregate.observations,
      [
        {
          historicalSourceId:
            shared.historicalSourceId,

          discovererIds: [
            "primary-git",
            "secondary-git",
          ],
        },
      ],
    );
  },
);
