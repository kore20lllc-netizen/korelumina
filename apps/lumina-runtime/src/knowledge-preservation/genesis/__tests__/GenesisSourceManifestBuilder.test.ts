import assert from "node:assert/strict";
import test from "node:test";

import {
  execFileSync,
} from "node:child_process";

import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import type {
  GenesisReplayScope,
  HistoricalSource,
  HistoricalSourceDiscoverer,
} from "../index.js";

import {
  assertGenesisSourceManifestBuildReady,
  buildDefaultGenesisSourceManifest,
  buildGenesisSourceManifest,
  canonicalizeGenesisSourceManifestIdentityInput,
  createHistoricalSourceId,
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
      "document",
      "commit",
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

    type:
      "document" |
      "commit";

    sourceClass:
      "architecture-document" |
      "commit";

    timestamp:
      number;

    locator:
      string;

    checksum:
      string;
  },
): HistoricalSource {
  return {
    historicalSourceId:
      createHistoricalSourceId(
        input.type,
        input.id,
      ),

    sourceClass:
      input.sourceClass,

    evidenceType:
      input.type,

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
      9000,

    discoveryMethod:
      "fixture",

    authority: {
      authorityClass:
        input.type ===
          "commit"
          ? "repository-history"
          : "architecture",
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

    sourceClass:
      HistoricalSource[
        "sourceClass"
      ];

    sources:
      readonly HistoricalSource[];
  },
): HistoricalSourceDiscoverer {
  return {
    id:
      input.id,

    sourceClasses: [
      input.sourceClass,
    ],

    async discover() {
      return {
        discovererId:
          input.id,

        sources:
          input.sources,

        errors:
          [],
      };
    },
  };
}

test(
  "manifest builder converts aggregated Historical Sources into manifest entries",
  async () => {
    const result =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoveredAt:
          5000,

        discoverers: [
          discoverer({
            id:
              "docs",

            sourceClass:
              "architecture-document",

            sources: [
              source({
                id:
                  "docs/a.md",

                type:
                  "document",

                sourceClass:
                  "architecture-document",

                timestamp:
                  100,

                locator:
                  "docs/a.md",

                checksum:
                  "sha256:doc",
              }),
            ],
          }),
        ],
      });

    assert.equal(
      result.manifest.entries.length,
      1,
    );

    assert.equal(
      result.manifest.entries[0]
        .provenanceLocator,
      "docs/a.md",
    );

    assert.equal(
      result.manifest.discoveredAt,
      5000,
    );

    assert.match(
      result.manifest.manifestId,
      /^genesis-manifest:[a-f0-9]{64}$/,
    );
  },
);

test(
  "manifest entries use governed chronological ordering rather than discoverer order",
  async () => {
    const result =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoverers: [
          discoverer({
            id:
              "git",

            sourceClass:
              "commit",

            sources: [
              source({
                id:
                  "commit-b",

                type:
                  "commit",

                sourceClass:
                  "commit",

                timestamp:
                  200,

                locator:
                  "git:commit:b",

                checksum:
                  "sha256:b",
              }),
            ],
          }),

          discoverer({
            id:
              "docs",

            sourceClass:
              "architecture-document",

            sources: [
              source({
                id:
                  "doc-a",

                type:
                  "document",

                sourceClass:
                  "architecture-document",

                timestamp:
                  100,

                locator:
                  "docs/a.md",

                checksum:
                  "sha256:a",
              }),
            ],
          }),
        ],
      });

    assert.deepEqual(
      result.manifest.entries.map(
        (
          entry,
        ) =>
          entry.historicalSourceId,
      ),
      [
        createHistoricalSourceId(
          "document",
          "doc-a",
        ),

        createHistoricalSourceId(
          "commit",
          "commit-b",
        ),
      ],
    );
  },
);

test(
  "same discovered sources and scope produce the same manifest identity",
  async () => {
    const shared =
      source({
        id:
          "commit-a",

        type:
          "commit",

        sourceClass:
          "commit",

        timestamp:
          100,

        locator:
          "git:commit:a",

        checksum:
          "sha256:a",
      });

    const first =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoveredAt:
          1000,

        discoverers: [
          discoverer({
            id:
              "git",

            sourceClass:
              "commit",

            sources: [
              shared,
            ],
          }),
        ],
      });

    const second =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoveredAt:
          9999,

        discoverers: [
          discoverer({
            id:
              "git",

            sourceClass:
              "commit",

            sources: [
              shared,
            ],
          }),
        ],
      });

    assert.equal(
      first.manifest.manifestId,
      second.manifest.manifestId,
    );

    assert.notEqual(
      first.manifest.discoveredAt,
      second.manifest.discoveredAt,
    );
  },
);

test(
  "source checksum mutation changes manifest identity",
  async () => {
    const first =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoverers: [
          discoverer({
            id:
              "git",

            sourceClass:
              "commit",

            sources: [
              source({
                id:
                  "commit-a",

                type:
                  "commit",

                sourceClass:
                  "commit",

                timestamp:
                  100,

                locator:
                  "git:commit:a",

                checksum:
                  "sha256:first",
              }),
            ],
          }),
        ],
      });

    const second =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoverers: [
          discoverer({
            id:
              "git",

            sourceClass:
              "commit",

            sources: [
              source({
                id:
                  "commit-a",

                type:
                  "commit",

                sourceClass:
                  "commit",

                timestamp:
                  100,

                locator:
                  "git:commit:a",

                checksum:
                  "sha256:second",
              }),
            ],
          }),
        ],
      });

    assert.notEqual(
      first.manifest.manifestId,
      second.manifest.manifestId,
    );
  },
);

test(
  "discovery diagnostics remain outside deterministic manifest identity",
  async () => {
    const good =
      source({
        id:
          "commit-a",

        type:
          "commit",

        sourceClass:
          "commit",

        timestamp:
          100,

        locator:
          "git:commit:a",

        checksum:
          "sha256:a",
      });

    const noisy:
      HistoricalSourceDiscoverer =
      {
        id:
          "git",

        sourceClasses: [
          "commit",
        ],

        async discover() {
          return {
            discovererId:
              "git",

            sources: [
              good,
            ],

            errors: [
              {
                code:
                  "SOURCE_UNAVAILABLE",

                discovererId:
                  "git",

                message:
                  "secondary source unavailable",
              },
            ],
          };
        },
      };

    const result =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoverers: [
          noisy,
        ],
      });

    assert.equal(
      result.errors.length,
      1,
    );

    assert.equal(
      "errors" in
      result.manifest,
      false,
    );
  },
);

test(
  "discovery observations are exposed beside rather than embedded into manifest identity",
  async () => {
    const shared =
      source({
        id:
          "commit-a",

        type:
          "commit",

        sourceClass:
          "commit",

        timestamp:
          100,

        locator:
          "git:commit:a",

        checksum:
          "sha256:a",
      });

    const result =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoverers: [
          discoverer({
            id:
              "git-a",

            sourceClass:
              "commit",

            sources: [
              shared,
            ],
          }),

          discoverer({
            id:
              "git-b",

            sourceClass:
              "commit",

            sources: [
              shared,
            ],
          }),
        ],
      });

    assert.deepEqual(
      result.observations,
      [
        {
          historicalSourceId:
            shared.historicalSourceId,

          discovererIds: [
            "git-a",
            "git-b",
          ],
        },
      ],
    );
  },
);

test(
  "default builder combines governed documentation and Git history discovery",
  async () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-genesis-manifest-",
        ),
      );

    execFileSync(
      "git",
      [
        "init",
        "-q",
        "-b",
        "main",
      ],
      {
        cwd:
          root,
      },
    );

    execFileSync(
      "git",
      [
        "config",
        "user.name",
        "Genesis Test",
      ],
      {
        cwd:
          root,
      },
    );

    execFileSync(
      "git",
      [
        "config",
        "user.email",
        "genesis@example.com",
      ],
      {
        cwd:
          root,
      },
    );

    mkdirSync(
      path.join(
        root,
        "docs",
        "architecture",
      ),
      {
        recursive:
          true,
      },
    );

    writeFileSync(
      path.join(
        root,
        "docs",
        "architecture",
        "PLATFORM.md",
      ),
      "# Platform Architecture",
      "utf8",
    );

    execFileSync(
      "git",
      [
        "add",
        ".",
      ],
      {
        cwd:
          root,
      },
    );

    execFileSync(
      "git",
      [
        "commit",
        "-q",
        "-m",
        "initial architecture",
      ],
      {
        cwd:
          root,

        env: {
          ...process.env,

          GIT_AUTHOR_DATE:
            "2026-01-01T00:00:00Z",

          GIT_COMMITTER_DATE:
            "2026-01-01T00:00:00Z",
        },
      },
    );

    const result =
      await buildDefaultGenesisSourceManifest({
        repositoryRoot:
          root,

        scope:
          scope(),

        discoveredAt:
          9000,
      });

    assert.equal(
      result.discovererIds.includes(
        "documentation-v1",
      ),
      true,
    );

    assert.equal(
      result.discovererIds.includes(
        "git-history-v1",
      ),
      true,
    );

    assert.equal(
      result.manifest.entries.some(
        (
          entry,
        ) =>
          entry.sourceType ===
          "architecture-document",
      ),
      true,
    );

    assert.equal(
      result.manifest.entries.some(
        (
          entry,
        ) =>
          entry.sourceType ===
          "commit",
      ),
      true,
    );
  },
);

test(
  "manifest builder does not admit Evidence",
  async () => {
    const result =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoverers:
          [],
      });

    assert.equal(
      result.manifest.entries.length,
      0,
    );

    assert.equal(
      result.errors.length,
      0,
    );
  },
);


test(
  "builder entry order is exactly the canonical manifest identity order",
  async () => {
    const replayScope =
      scope();

    const result =
      await buildGenesisSourceManifest({
        scope:
          replayScope,

        discoverers: [
          discoverer({
            id:
              "git",

            sourceClass:
              "commit",

            sources: [
              source({
                id:
                  "commit-z",

                type:
                  "commit",

                sourceClass:
                  "commit",

                timestamp:
                  100,

                locator:
                  "git:commit:z",

                checksum:
                  "sha256:z",
              }),

              source({
                id:
                  "commit-a",

                type:
                  "commit",

                sourceClass:
                  "commit",

                timestamp:
                  100,

                locator:
                  "git:commit:a",

                checksum:
                  "sha256:a",
              }),
            ],
          }),

          discoverer({
            id:
              "docs",

            sourceClass:
              "architecture-document",

            sources: [
              source({
                id:
                  "doc-z",

                type:
                  "document",

                sourceClass:
                  "architecture-document",

                timestamp:
                  100,

                locator:
                  "docs/z.md",

                checksum:
                  "sha256:doc-z",
              }),
            ],
          }),
        ],
      });

    const canonical =
      canonicalizeGenesisSourceManifestIdentityInput({
        replayContractVersion:
          replayScope.replayContractVersion,

        scope:
          replayScope,

        entries:
          result.manifest.entries,
      });

    assert.deepEqual(
      result.manifest.entries.map(
        (
          entry,
        ) =>
          entry.historicalSourceId,
      ),

      canonical.entries.map(
        (
          entry,
        ) =>
          entry.historicalSourceId,
      ),
    );
  },
);

test(
  "manifest build with no discovery errors is READY for replay",
  async () => {
    const result =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoverers:
          [],
      });

    assert.equal(
      result.readiness,
      "READY",
    );

    assert.doesNotThrow(
      () =>
        assertGenesisSourceManifestBuildReady(
          result,
        ),
    );
  },
);

test(
  "any discovery error BLOCKS manifest replay readiness",
  async () => {
    const incomplete:
      HistoricalSourceDiscoverer =
      {
        id:
          "git",

        sourceClasses: [
          "commit",
        ],

        async discover() {
          return {
            discovererId:
              "git",

            sources: [
              source({
                id:
                  "commit-a",

                type:
                  "commit",

                sourceClass:
                  "commit",

                timestamp:
                  100,

                locator:
                  "git:commit:a",

                checksum:
                  "sha256:a",
              }),
            ],

            errors: [
              {
                code:
                  "PROVENANCE_INCOMPLETE",

                discovererId:
                  "git",

                message:
                  "one reachable commit could not be reconstructed",
              },
            ],
          };
        },
      };

    const result =
      await buildGenesisSourceManifest({
        scope:
          scope(),

        discoverers: [
          incomplete,
        ],
      });

    assert.equal(
      result.manifest.entries.length,
      1,
    );

    assert.equal(
      result.readiness,
      "BLOCKED",
    );

    assert.equal(
      result.errors.length,
      1,
    );

    assert.throws(
      () =>
        assertGenesisSourceManifestBuildReady(
          result,
        ),
      /genesis_source_manifest_discovery_incomplete/,
    );
  },
);
