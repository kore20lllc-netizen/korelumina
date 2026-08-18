import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayAdmissionRequest,
  GenesisReplayPlanEntry,
  GenesisSourceManifestEntry,
} from "../index.js";

import {
  GenesisSyntheticReplayAdmissionAdapter,
  createGenesisReplayAdmissionIdentity,
  createGenesisSyntheticEvidenceId,
  genesisAdmissionRequestToSyntheticEvidence,
} from "../index.js";

function request(
  overrides: {
    executionTimestamp?:
      number;

    checksum?:
      string;

    historicalTimestamp?:
      number;
  } = {},
): GenesisReplayAdmissionRequest {
  const planEntry:
    GenesisReplayPlanEntry =
      {
        manifestIndex:
          0,

        historicalSourceId:
          "genesis-source:commit:abc",

        sourceChecksum:
          overrides.checksum ??
          "sha256:abc",

        action:
          "ADMIT",
      };

  const manifestEntry:
    GenesisSourceManifestEntry =
      {
        historicalSourceId:
          planEntry
            .historicalSourceId,

        sourceType:
          "commit",

        evidenceType:
          "commit",

        authorityClass:
          "repository-history",

        provenanceLocator:
          "git:commit:abc",

        sourceChecksum:
          planEntry
            .sourceChecksum,

        historicalTimestamp:
          overrides
            .historicalTimestamp ??
          100,

        historicalTimestampSource:
          "git-committer-time",

        discoveredAt:
          9000,

        discoveryMethod:
          "fixture",

        replayEligibility:
          "eligible",

        supersedes:
          [],

        conflictsWith:
          [],

        metadata: {
          subject:
            "Genesis commit",
        },
      };

  const base = {
    replayId:
      "genesis-replay:fixture" as const,

    manifestId:
      "genesis-manifest:fixture",

    repository:
      "kore20lllc-netizen/korelumina",

    manifestIndex:
      0,

    planEntry,

    manifestEntry,
  };

  return {
    ...base,

    admissionIdentity:
      createGenesisReplayAdmissionIdentity(
        base,
      ),

    executionTimestamp:
      overrides
        .executionTimestamp ??
      1000,
  };
}

test(
  "admission identity is deterministic for the same replay source and checksum",
  () => {
    const first =
      request();

    const second =
      request({
        executionTimestamp:
          999999,
      });

    assert.equal(
      first.admissionIdentity,
      second.admissionIdentity,
    );

    assert.match(
      first.admissionIdentity,
      /^genesis-admission:[a-f0-9]{64}$/,
    );
  },
);

test(
  "admission identity changes when source checksum changes",
  () => {
    const first =
      request({
        checksum:
          "sha256:first",
      });

    const second =
      request({
        checksum:
          "sha256:second",
      });

    assert.notEqual(
      first.admissionIdentity,
      second.admissionIdentity,
    );
  },
);

test(
  "synthetic Evidence identity is deterministic from admission identity",
  () => {
    const admission =
      request()
        .admissionIdentity;

    assert.equal(
      createGenesisSyntheticEvidenceId(
        admission,
      ),
      createGenesisSyntheticEvidenceId(
        admission,
      ),
    );

    assert.match(
      createGenesisSyntheticEvidenceId(
        admission,
      ),
      /^genesis-evidence:[a-f0-9]{64}$/,
    );
  },
);

test(
  "synthetic Evidence preserves historical observation time and execution capture time separately",
  () => {
    const record =
      genesisAdmissionRequestToSyntheticEvidence(
        request({
          historicalTimestamp:
            100,

          executionTimestamp:
            1000,
        }),
      );

    assert.equal(
      record.evidence
        .observedAt,
      100,
    );

    assert.equal(
      record.evidence
        .capturedAt,
      1000,
    );
  },
);

test(
  "synthetic Evidence transfers source type checksum provenance and Genesis lineage",
  () => {
    const input =
      request();

    const record =
      genesisAdmissionRequestToSyntheticEvidence(
        input,
      );

    assert.equal(
      record.evidence.type,
      "commit",
    );

    assert.equal(
      record.evidence.checksum,
      "sha256:abc",
    );

    assert.equal(
      record.evidence.contentRef,
      "git:commit:abc",
    );

    assert.equal(
      record.evidence.metadata
        .historicalSourceId,
      "genesis-source:commit:abc",
    );

    assert.deepEqual(
      record.evidence
        .relationships
        .genesisReplay,
      [
        "genesis-replay:fixture",
      ],
    );

    assert.deepEqual(
      record.evidence
        .relationships
        .genesisHistoricalSource,
      [
        "genesis-source:commit:abc",
      ],
    );
  },
);

test(
  "synthetic Evidence satisfies the existing production Evidence contract",
  () => {
    assert.doesNotThrow(
      () =>
        genesisAdmissionRequestToSyntheticEvidence(
          request(),
        ),
    );
  },
);

test(
  "synthetic admission rejects tampered deterministic admission identity",
  () => {
    const input =
      request();

    assert.throws(
      () =>
        genesisAdmissionRequestToSyntheticEvidence({
          ...input,

          admissionIdentity:
            "genesis-admission:tampered",
        }),
      /genesis_replay_admission_identity_mismatch/,
    );
  },
);

test(
  "synthetic admission does not invent a capture time before historical observation",
  () => {
    assert.throws(
      () =>
        genesisAdmissionRequestToSyntheticEvidence(
          request({
            historicalTimestamp:
              2000,

            executionTimestamp:
              1000,
          }),
        ),
      /genesis_replay_admission_capture_precedes_observation/,
    );
  },
);

test(
  "synthetic adapter is idempotent for the same admission identity",
  async () => {
    const adapter =
      new GenesisSyntheticReplayAdmissionAdapter();

    const input =
      request();

    const first =
      await adapter.admit(
        input,
      );

    const second =
      await adapter.admit(
        input,
      );

    assert.equal(
      first.evidenceId,
      second.evidenceId,
    );

    assert.equal(
      adapter.listRecords()
        .length,
      1,
    );
  },
);

test(
  "synthetic adapter retains the admitted Evidence record for inspection",
  async () => {
    const adapter =
      new GenesisSyntheticReplayAdmissionAdapter();

    const input =
      request();

    const result =
      await adapter.admit(
        input,
      );

    const records =
      adapter.listRecords();

    assert.equal(
      records.length,
      1,
    );

    assert.equal(
      records[0].evidence.id,
      result.evidenceId,
    );

    assert.equal(
      records[0]
        .admissionIdentity,
      input.admissionIdentity,
    );
  },
);

test(
  "same Historical Source version has the same admission identity across replay manifests and positions",
  () => {
    const first =
      request();

    const secondBase = {
      ...first,

      replayId:
        "genesis-replay:second" as const,

      manifestId:
        "genesis-manifest:second",

      manifestIndex:
        27,
    };

    const second = {
      ...secondBase,

      admissionIdentity:
        createGenesisReplayAdmissionIdentity(
          secondBase,
        ),
    };

    assert.equal(
      first.admissionIdentity,
      second.admissionIdentity,
    );
  },
);

test(
  "same source path and identity in a different repository does not collide",
  () => {
    const first =
      request();

    const secondBase = {
      ...first,

      repository:
        "another-owner/another-repository",
    };

    const second = {
      ...secondBase,

      admissionIdentity:
        createGenesisReplayAdmissionIdentity(
          secondBase,
        ),
    };

    assert.notEqual(
      first.admissionIdentity,
      second.admissionIdentity,
    );
  },
);

test(
  "changed Historical Source checksum produces a new admission identity across replays",
  () => {
    const first =
      request({
        checksum:
          "sha256:first-version",
      });

    const second =
      request({
        checksum:
          "sha256:second-version",
      });

    assert.notEqual(
      first.admissionIdentity,
      second.admissionIdentity,
    );
  },
);

test(
  "synthetic adapter reuses Evidence across replay manifests while retaining both replay occurrences",
  async () => {
    const adapter =
      new GenesisSyntheticReplayAdmissionAdapter();

    const first =
      request();

    const secondBase = {
      ...first,

      replayId:
        "genesis-replay:second" as const,

      manifestId:
        "genesis-manifest:second",

      manifestIndex:
        9,

      executionTimestamp:
        2000,
    };

    const second = {
      ...secondBase,

      admissionIdentity:
        createGenesisReplayAdmissionIdentity(
          secondBase,
        ),
    };

    const firstResult =
      await adapter.admit(
        first,
      );

    const secondResult =
      await adapter.admit(
        second,
      );

    assert.equal(
      firstResult.evidenceId,
      secondResult.evidenceId,
    );

    const records =
      adapter.listRecords();

    assert.equal(
      records.length,
      1,
    );

    assert.equal(
      records[0]
        .occurrences.length,
      2,
    );

    assert.deepEqual(
      records[0]
        .occurrences.map(
          (
            occurrence,
          ) =>
            occurrence.replayId,
        ),
      [
        "genesis-replay:fixture",
        "genesis-replay:second",
      ],
    );
  },
);
