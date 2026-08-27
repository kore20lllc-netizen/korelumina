import assert from "node:assert/strict";
import test from "node:test";

import {
  createGenesisReplayAdmissionIdentity,
  genesisAdmissionRequestToSyntheticEvidence,
} from "../GenesisReplayAdmission.js";

import type {
  GenesisReplayAdmissionRequest,
} from "../GenesisReplayExecution.js";

import type {
  GenesisReplayId,
} from "../GenesisReplayIdentity.js";

import type {
  HistoricalSourceId,
} from "../HistoricalSource.js";


function request():
  GenesisReplayAdmissionRequest {
  const historicalSourceId =
    "genesis-source:document:section-test" as
      HistoricalSourceId;

  const replayId =
    "genesis-replay:m51.5c3" as
      GenesisReplayId;

  const repository =
    "/tmp/korelumina";

  const manifestId =
    "manifest:m51.5c3";

  const sourceChecksum =
    "sha256:section-test";

  const manifestIndex =
    0;

  const manifestEntry = {
    historicalSourceId,

    sourceType:
      "document" as const,

    evidenceType:
      "document" as const,

    authorityClass:
      "governance",

    approvalState:
      "approved",

    provenanceLocator:
      "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md#section:delegation:145-170",

    sourceChecksum,

    historicalTimestamp:
      1_700_000_000_000,

    historicalTimestampSource:
      "m51.5c3-test",

    discoveredAt:
      1_700_000_000_001,

    discoveryMethod:
      "documentation-section-v1",

    replayEligibility:
      "eligible" as const,

    supersedes:
      [],

    conflictsWith:
      [],

    metadata: {
      sourceLocation:
        "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md",

      lineStart:
        145,

      lineEnd:
        170,

      sectionTitle:
        "Delegation",

      sectionSlug:
        "delegation",

      parentHistoricalSourceId:
        "genesis-source:document:parent",

      content:
        [
          "## Delegation",
          "",
          "The Chief Agent owns missions.",
          "",
          "The Chief Agent never delegates mission ownership.",
        ].join(
          "\n",
        ),

      documentClassification:
        "governance-document",
    },
  };

  const planEntry = {
    manifestIndex,

    historicalSourceId,

    sourceChecksum,

    action:
      "ADMIT" as const,
  };

  const admissionIdentity =
    createGenesisReplayAdmissionIdentity({
      replayId,
      manifestId,
      repository,
      manifestIndex,
      planEntry,
      manifestEntry,
    });

  return {
    replayId,

    manifestId,

    repository,

    manifestIndex,

    planEntry,

    manifestEntry,

    admissionIdentity,

    executionTimestamp:
      1_700_000_000_100,
  };
}


test(
  "M51.5c3 promotes section provenance and inline content into admitted Evidence metadata",
  () => {
    const result =
      genesisAdmissionRequestToSyntheticEvidence(
        request(),
      );

    const evidence =
      result.evidence;

    assert.equal(
      evidence.contentRef,
      "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md#section:delegation:145-170",
    );

    assert.equal(
      evidence.metadata.sourceLocation,
      "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md",
    );

    assert.equal(
      evidence.metadata.lineStart,
      145,
    );

    assert.equal(
      evidence.metadata.lineEnd,
      170,
    );

    assert.equal(
      evidence.metadata.sectionTitle,
      "Delegation",
    );

    assert.equal(
      evidence.metadata.sectionSlug,
      "delegation",
    );

    assert.equal(
      evidence.metadata.parentHistoricalSourceId,
      "genesis-source:document:parent",
    );

    assert.match(
      String(
        evidence.metadata.content,
      ),
      /Chief Agent owns missions/,
    );
  },
);


test(
  "M51.5c3 preserves section identity without manufacturing canonical relationships",
  () => {
    const result =
      genesisAdmissionRequestToSyntheticEvidence(
        request(),
      );

    assert.deepEqual(
      result.evidence
        .relationships
        .genesisHistoricalSource,
      [
        "genesis-source:document:section-test",
      ],
    );

    assert.equal(
      result.evidence
        .metadata
        .parentHistoricalSourceId,
      "genesis-source:document:parent",
    );

    assert.match(
      result.admissionIdentity,
      /^genesis-admission:/,
    );
  },
);
