import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayCheckpointDisposition,
  GenesisSourceManifestEntry,
  HistoricalSourceId,
} from "../index.js";

import {
  buildGenesisHistoricalAdmissionGovernanceProjection,
} from "../index.js";

function source(
  input: {
    id:
      string;

    sourceType:
      GenesisSourceManifestEntry["sourceType"];

    evidenceType:
      GenesisSourceManifestEntry["evidenceType"];

    authorityClass:
      string;

    approvalState?:
      string;

    authorityOwner?:
      string;

    authorityScope?:
      string;

    authorityVersion?:
      string;
  },
): GenesisSourceManifestEntry {
  return {
    historicalSourceId:
      input.id as HistoricalSourceId,

    sourceType:
      input.sourceType,

    evidenceType:
      input.evidenceType,

    authorityClass:
      input.authorityClass,

    approvalState:
      input.approvalState,

    authorityOwner:
      input.authorityOwner,

    authorityScope:
      input.authorityScope,

    authorityVersion:
      input.authorityVersion,

    provenanceLocator:
      `fixture:${input.id}`,

    sourceChecksum:
      `sha256:${input.id}`,

    historicalTimestamp:
      100,

    historicalTimestampSource:
      "fixture",

    discoveredAt:
      200,

    discoveryMethod:
      "fixture",

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

function admitted(
  historicalSourceId:
    string,

  evidenceId:
    string,
): GenesisReplayCheckpointDisposition {
  return {
    historicalSourceId:
      historicalSourceId as HistoricalSourceId,

    disposition:
      "ADMITTED",

    evidenceId,
  };
}

test(
  "projects current Replay governance independently from pre-existing Knowledge lineage",
  () => {
    const commit =
      source({
        id:
          "genesis-source:commit:legacy-manufactured",

        sourceType:
          "commit",

        evidenceType:
          "commit",

        authorityClass:
          "repository-history",
      });

    const approvedAdr =
      source({
        id:
          "genesis-source:ADR:approved",

        sourceType:
          "ADR",

        evidenceType:
          "ADR",

        authorityClass:
          "architecture-decision",

        approvalState:
          "approved",

        authorityOwner:
          "Architecture Council",

        authorityScope:
          "KoreLumina",

        authorityVersion:
          "1.0",
      });

    const projection =
      buildGenesisHistoricalAdmissionGovernanceProjection({
        manifestEntries: [
          commit,
          approvedAdr,
        ],

        dispositions: [
          admitted(
            commit.historicalSourceId,
            "genesis-evidence:commit",
          ),

          admitted(
            approvedAdr.historicalSourceId,
            "genesis-evidence:adr",
          ),
        ],
      });

    assert.equal(
      projection.records.length,
      2,
    );

    const commitRecord =
      projection.records.find(
        record =>
          record.evidenceId ===
          "genesis-evidence:commit",
      );

    assert.ok(
      commitRecord,
    );

    assert.equal(
      commitRecord.classification,
      "historical-correlation-eligible",
    );

    assert.equal(
      commitRecord.correlationEligible,
      true,
    );

    assert.equal(
      commitRecord.knowledgeManufacturingAuthorized,
      false,
    );

    const adrRecord =
      projection.records.find(
        record =>
          record.evidenceId ===
          "genesis-evidence:adr",
      );

    assert.ok(
      adrRecord,
    );

    assert.equal(
      adrRecord.classification,
      "knowledge-seeding-eligible",
    );

    assert.equal(
      adrRecord.knowledgeManufacturingAuthorized,
      true,
    );

    assert.deepEqual(
      projection.summary,
      {
        admittedEvidence:
          2,

        historicalEvidenceOnly:
          0,

        historicalCorrelationEligible:
          1,

        knowledgeSeedingEligible:
          1,

        requiresGovernanceReview:
          0,

        knowledgeManufacturingAuthorized:
          1,
      },
    );
  },
);

test(
  "ignores Replay dispositions that were not admitted",
  () => {
    const entry =
      source({
        id:
          "genesis-source:commit:skipped",

        sourceType:
          "commit",

        evidenceType:
          "commit",

        authorityClass:
          "repository-history",
      });

    const projection =
      buildGenesisHistoricalAdmissionGovernanceProjection({
        manifestEntries: [
          entry,
        ],

        dispositions: [
          {
            historicalSourceId:
              entry.historicalSourceId,

            disposition:
              "SKIPPED",

            reason:
              "outside scope",
          },
        ],
      });

    assert.equal(
      projection.records.length,
      0,
    );

    assert.equal(
      projection.summary.admittedEvidence,
      0,
    );
  },
);
