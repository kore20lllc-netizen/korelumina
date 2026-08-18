import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayScope,
  GenesisSourceManifestBuildResult,
  GenesisSourceManifestEntry,
} from "../index.js";

import {
  assertGenesisReplayPlanReady,
  createGenesisReplayId,
  createGenesisReplayPlan,
  createGenesisSourceManifestId,
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

function entry(
  input: {
    id:
      string;

    eligibility:
      "eligible" |
      "excluded" |
      "blocked";

    timestamp:
      number;

    checksum?:
      string;

    exclusionReason?:
      string;
  },
): GenesisSourceManifestEntry {
  return {
    historicalSourceId:
      `genesis-source:commit:${input.id}`,

    sourceType:
      "commit",

    evidenceType:
      "commit",

    authorityClass:
      "repository-history",

    provenanceLocator:
      `git:commit:${input.id}`,

    sourceChecksum:
      input.checksum ??
      `sha256:${input.id}`,

    historicalTimestamp:
      input.timestamp,

    historicalTimestampSource:
      "fixture",

    discoveredAt:
      9000,

    discoveryMethod:
      "fixture",

    replayEligibility:
      input.eligibility,

    exclusionReason:
      input.exclusionReason,

    supersedes:
      [],

    conflictsWith:
      [],

    metadata:
      {},
  };
}

function buildResult(
  input: {
    entries:
      readonly GenesisSourceManifestEntry[];

    readiness?:
      "READY" |
      "BLOCKED";

    errors?:
      GenesisSourceManifestBuildResult[
        "errors"
      ];
  },
): GenesisSourceManifestBuildResult {
  const replayScope =
    scope();

  const manifestId =
    createGenesisSourceManifestId({
      replayContractVersion:
        replayScope.replayContractVersion,

      scope:
        replayScope,

      entries:
        input.entries,
    });

  return {
    manifest: {
      manifestId,

      replayContractVersion:
        "1.0",

      scope:
        replayScope,

      entries:
        input.entries,

      discoveredAt:
        9000,
    },

    readiness:
      input.readiness ??
      "READY",

    errors:
      input.errors ??
      [],

    observations:
      [],

    discovererIds: [
      "fixture",
    ],
  };
}

test(
  "replay plan derives existing deterministic replay identity from manifest scope and contract",
  () => {
    const build =
      buildResult({
        entries: [
          entry({
            id:
              "a",

            eligibility:
              "eligible",

            timestamp:
              100,
          }),
        ],
      });

    const plan =
      createGenesisReplayPlan(
        build,
      );

    assert.equal(
      plan.replayId,
      createGenesisReplayId({
        manifestId:
          build.manifest
            .manifestId,

        replayContractVersion:
          build.manifest
            .replayContractVersion,

        scope:
          build.manifest.scope,
      }),
    );
  },
);

test(
  "replay plan preserves manifest order exactly",
  () => {
    const build =
      buildResult({
        entries: [
          entry({
            id:
              "first",

            eligibility:
              "eligible",

            timestamp:
              100,
          }),

          entry({
            id:
              "second",

            eligibility:
              "eligible",

            timestamp:
              200,
          }),

          entry({
            id:
              "third",

            eligibility:
              "eligible",

            timestamp:
              300,
          }),
        ],
      });

    const plan =
      createGenesisReplayPlan(
        build,
      );

    assert.deepEqual(
      plan.entries.map(
        (
          planned,
        ) =>
          planned
            .historicalSourceId,
      ),
      build.manifest.entries.map(
        (
          manifestEntry,
        ) =>
          manifestEntry
            .historicalSourceId,
      ),
    );

    assert.deepEqual(
      plan.entries.map(
        (
          planned,
        ) =>
          planned.manifestIndex,
      ),
      [
        0,
        1,
        2,
      ],
    );
  },
);

test(
  "eligible manifest source is classified ADMIT",
  () => {
    const plan =
      createGenesisReplayPlan(
        buildResult({
          entries: [
            entry({
              id:
                "a",

              eligibility:
                "eligible",

              timestamp:
                100,
            }),
          ],
        }),
      );

    assert.equal(
      plan.entries[0].action,
      "ADMIT",
    );

    assert.equal(
      plan.readiness,
      "READY",
    );
  },
);

test(
  "excluded manifest source is classified SKIP_SCOPE with governed scope reason",
  () => {
    const plan =
      createGenesisReplayPlan(
        buildResult({
          entries: [
            entry({
              id:
                "a",

              eligibility:
                "excluded",

              exclusionReason:
                "before_replay_scope",

              timestamp:
                100,
            }),
          ],
        }),
      );

    assert.equal(
      plan.entries[0].action,
      "SKIP_SCOPE",
    );

    assert.equal(
      plan.entries[0].reason,
      "before_replay_scope",
    );

    assert.equal(
      plan.readiness,
      "READY",
    );
  },
);

test(
  "blocked manifest source is classified BLOCK and blocks replay plan readiness",
  () => {
    const plan =
      createGenesisReplayPlan(
        buildResult({
          entries: [
            entry({
              id:
                "a",

              eligibility:
                "blocked",

              exclusionReason:
                "historical_timestamp_unavailable",

              timestamp:
                0,
            }),
          ],
        }),
      );

    assert.equal(
      plan.entries[0].action,
      "BLOCK",
    );

    assert.equal(
      plan.readiness,
      "BLOCKED",
    );

    assert.equal(
      plan.summary.block,
      1,
    );

    assert.throws(
      () =>
        assertGenesisReplayPlanReady(
          plan,
        ),
      /genesis_replay_plan_blocked/,
    );
  },
);

test(
  "mixed replay plan reports truthful action counts",
  () => {
    const plan =
      createGenesisReplayPlan(
        buildResult({
          entries: [
            entry({
              id:
                "a",

              eligibility:
                "eligible",

              timestamp:
                100,
            }),

            entry({
              id:
                "b",

              eligibility:
                "excluded",

              exclusionReason:
                "explicit_source_exclusion",

              timestamp:
                200,
            }),

            entry({
              id:
                "c",

              eligibility:
                "blocked",

              exclusionReason:
                "provenance_incomplete",

              timestamp:
                300,
            }),
          ],
        }),
      );

    assert.deepEqual(
      plan.summary,
      {
        totalSources:
          3,

        admit:
          1,

        skipScope:
          1,

        block:
          1,
      },
    );

    assert.equal(
      plan.readiness,
      "BLOCKED",
    );
  },
);

test(
  "BLOCKED manifest build cannot create a replay plan",
  () => {
    const build =
      buildResult({
        entries: [
          entry({
            id:
              "a",

            eligibility:
              "eligible",

            timestamp:
              100,
          }),
        ],

        readiness:
          "BLOCKED",

        errors: [
          {
            code:
              "PROVENANCE_INCOMPLETE",

            discovererId:
              "fixture",

            message:
              "incomplete discovery",
          },
        ],
      });

    assert.throws(
      () =>
        createGenesisReplayPlan(
          build,
        ),
      /genesis_source_manifest_discovery_incomplete/,
    );
  },
);

test(
  "replay plan rejects manifest identity tampering",
  () => {
    const build =
      buildResult({
        entries: [
          entry({
            id:
              "a",

            eligibility:
              "eligible",

            timestamp:
              100,
          }),
        ],
      });

    const tampered:
      GenesisSourceManifestBuildResult =
      {
        ...build,

        manifest: {
          ...build.manifest,

          manifestId:
            "genesis-manifest:tampered",
        },
      };

    assert.throws(
      () =>
        createGenesisReplayPlan(
          tampered,
        ),
      /genesis_replay_plan_manifest_identity_mismatch/,
    );
  },
);

test(
  "source checksum is retained in the replay plan for later execution integrity",
  () => {
    const plan =
      createGenesisReplayPlan(
        buildResult({
          entries: [
            entry({
              id:
                "a",

              eligibility:
                "eligible",

              timestamp:
                100,

              checksum:
                "sha256:expected",
            }),
          ],
        }),
      );

    assert.equal(
      plan.entries[0]
        .sourceChecksum,
      "sha256:expected",
    );
  },
);

test(
  "empty READY manifest produces deterministic empty READY plan",
  () => {
    const build =
      buildResult({
        entries:
          [],
      });

    const plan =
      createGenesisReplayPlan(
        build,
      );

    assert.equal(
      plan.entries.length,
      0,
    );

    assert.deepEqual(
      plan.summary,
      {
        totalSources:
          0,

        admit:
          0,

        skipScope:
          0,

        block:
          0,
      },
    );

    assert.equal(
      plan.readiness,
      "READY",
    );

    assert.doesNotThrow(
      () =>
        assertGenesisReplayPlanReady(
          plan,
        ),
    );
  },
);

test(
  "excluded source without a governed scope reason cannot be planned as an automatic skip",
  () => {
    assert.throws(
      () =>
        createGenesisReplayPlan(
          buildResult({
            entries: [
              entry({
                id:
                  "a",

                eligibility:
                  "excluded",

                timestamp:
                  100,
              }),
            ],
          }),
        ),
      /genesis_replay_plan_scope_exclusion_reason_required/,
    );
  },
);
