import assert from "node:assert/strict";
import test from "node:test";

import {
  createGenesisReplayAdmissionIdentity,
  genesisReplayAdmissionRequestToEvidence,
} from "../GenesisReplayAdmission.js";

test(
  "preserves governed documentation authority metadata on the Evidence envelope",
  () => {
    const manifestEntry = {
      historicalSourceId:
        "genesis-source:document:architecture",

      sourceType:
        "architecture-document",

      evidenceType:
        "document",

      authorityClass:
        "architecture",

      approvalState:
        "approved",

      authorityOwner:
        "Platform Architecture",

      authorityScope:
        "KoreLumina",

      authorityVersion:
        "1.0",

      effectiveFrom:
        "2026-01-01",

      effectiveTo:
        undefined,

      provenanceLocator:
        "docs/architecture/PLATFORM.md",

      sourceChecksum:
        "sha256:abc123",

      historicalTimestamp:
        1_700_000_000_000,

      historicalTimestampSource:
        "git-last-change-time",

      discoveredAt:
        1_700_000_100_000,

      discoveryMethod:
        "documentation-v1",

      replayEligibility:
        "eligible",

      exclusionReason:
        undefined,

      supersedes:
        [],

      conflictsWith:
        [],

      metadata: {
        title:
          "Platform Architecture",

        documentClassification:
          "architecture",

        sourceLocation:
          "docs/architecture/PLATFORM.md",
      },
    } as const;

    const planEntry = {
      manifestIndex:
        0,

      historicalSourceId:
        manifestEntry.historicalSourceId,

      sourceChecksum:
        manifestEntry.sourceChecksum,

      action:
        "ADMIT",
    } as const;

    const requestBase = {
      replayId:
        "genesis-replay:test",

      manifestId:
        "genesis-manifest:test",

      repository:
        "kore20lllc-netizen/korelumina",

      manifestIndex:
        0,

      planEntry,

      manifestEntry,
    } as const;

    const admissionIdentity =
      createGenesisReplayAdmissionIdentity(
        requestBase as never,
      );

    const evidence =
      genesisReplayAdmissionRequestToEvidence({
        ...requestBase,

        admissionIdentity,

        executionTimestamp:
          1_700_000_200_000,
      } as never);

    assert.equal(
      evidence.metadata
        .authorityClass,
      "architecture",
    );

    assert.equal(
      evidence.metadata
        .approvalState,
      "approved",
    );

    assert.equal(
      evidence.metadata.owner,
      "Platform Architecture",
    );

    assert.equal(
      evidence.metadata.scope,
      "KoreLumina",
    );

    assert.equal(
      evidence.metadata.version,
      "1.0",
    );

    assert.equal(
      evidence.metadata
        .effectiveFrom,
      "2026-01-01",
    );

    assert.equal(
      evidence.metadata
        .sourceLocation,
      "docs/architecture/PLATFORM.md",
    );

    assert.equal(
      evidence.metadata
        .documentClassification,
      "architecture",
    );

    assert.deepEqual(
      evidence.metadata
        .sourceMetadata,
      manifestEntry.metadata,
    );
  },
);

test(
  "falls back to the provenance locator when documentation sourceLocation metadata is absent",
  () => {
    const manifestEntry = {
      historicalSourceId:
        "genesis-source:document:fallback",

      sourceType:
        "document",

      evidenceType:
        "document",

      authorityClass:
        "documentation",

      approvalState:
        "approved",

      authorityOwner:
        "Knowledge Operations",

      authorityScope:
        "Runtime",

      authorityVersion:
        "1",

      provenanceLocator:
        "docs/governance/FALLBACK.md",

      sourceChecksum:
        "sha256:def456",

      historicalTimestamp:
        1_700_000_000_000,

      historicalTimestampSource:
        "git-last-change-time",

      discoveredAt:
        1_700_000_100_000,

      discoveryMethod:
        "documentation-v1",

      replayEligibility:
        "eligible",

      supersedes:
        [],

      conflictsWith:
        [],

      metadata: {
        title:
          "Fallback",
      },
    } as const;

    const planEntry = {
      manifestIndex:
        0,

      historicalSourceId:
        manifestEntry.historicalSourceId,

      sourceChecksum:
        manifestEntry.sourceChecksum,

      action:
        "ADMIT",
    } as const;

    const requestBase = {
      replayId:
        "genesis-replay:test-fallback",

      manifestId:
        "genesis-manifest:test-fallback",

      repository:
        "kore20lllc-netizen/korelumina",

      manifestIndex:
        0,

      planEntry,

      manifestEntry,
    } as const;

    const admissionIdentity =
      createGenesisReplayAdmissionIdentity(
        requestBase as never,
      );

    const evidence =
      genesisReplayAdmissionRequestToEvidence({
        ...requestBase,

        admissionIdentity,

        executionTimestamp:
          1_700_000_200_000,
      } as never);

    assert.equal(
      evidence.metadata
        .sourceLocation,
      manifestEntry
        .provenanceLocator,
    );
  },
);
