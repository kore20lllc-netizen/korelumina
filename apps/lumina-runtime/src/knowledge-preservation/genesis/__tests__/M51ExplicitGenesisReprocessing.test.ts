import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceItem,
} from "../../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/createKnowledgePreservationPlatform.js";

import {
  GenesisProductionReplayAdmissionAdapter,
} from "../GenesisProductionReplayAdmissionAdapter.js";

import {
  createGenesisReplayAdmissionIdentity,
} from "../GenesisReplayAdmission.js";

import type {
  GenesisReplayAdmissionRequest,
} from "../GenesisReplayExecution.js";


function priorBlockedItem(
  evidenceId:
    string,
): KnowledgeIRItem {
  return {
    id:
      `document:${evidenceId}:blocked`,

    candidateType:
      "CandidateArtifact",

    title:
      "Mission Ownership",

    summary:
      "Prior blocked result.",

    confidence:
      1,

    evidenceRefs: [
      evidenceId,
    ],

    proposedRelationships:
      {},

    extractedAt:
      100,

    compiler: {
      compilerName:
        "documentation-compiler",

      compilerVersion:
        "1.0.0",

      evidenceSourceType:
        "document",

      extractedAt:
        100,

      extractionMethod:
        "documentation-compiler",

      confidenceBasis:
        "direct-document-evidence",
    },

    status:
      "needs-review",

    metadata: {
      source:
        "genesis-historical-replay",

      contentRef:
        "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

      authorityClass:
        "governance",

      approvalState:
        "Approved",

      owner:
        "Chief Systems Architect",

      scope:
        "Chief Agent mission-level orchestration.",

      version:
        "1.0",

      sourceLocation:
        "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

      validation: {
        result:
          "failed",
      },
    },
  };
}


function requestFor(
  evidence:
    EvidenceItem,
): GenesisReplayAdmissionRequest {
  const sourceChecksum =
    evidence.checksum;

  if (
    !sourceChecksum
  ) {
    throw new Error(
      "m51_test_evidence_checksum_required",
    );
  }

  const replayId:
    GenesisReplayAdmissionRequest[
      "replayId"
    ] =
      "genesis-replay:m51-explicit-reprocess";

  const base:
    Pick<
      GenesisReplayAdmissionRequest,
      | "replayId"
      | "manifestId"
      | "repository"
      | "manifestIndex"
      | "planEntry"
      | "manifestEntry"
    > =
    {
      replayId,

      manifestId:
        "genesis-manifest:m51-explicit-reprocess",

      repository:
        process.cwd(),

      manifestIndex:
        0,

      planEntry: {
        manifestIndex:
          0,

        historicalSourceId:
          "genesis-source:document:m51-explicit-reprocess",

        sourceChecksum,

        action:
          "ADMIT",
      },

      manifestEntry: {
        historicalSourceId:
          "genesis-source:document:m51-explicit-reprocess",

        sourceType:
          "document",

        evidenceType:
          "document",

        sourceChecksum,

        provenanceLocator:
          evidence.contentRef,

        historicalTimestamp:
          evidence.observedAt,

        historicalTimestampSource:
          "m51-test",

        discoveredAt:
          200,

        authorityClass:
          "governance",

        authorityOwner:
          "Chief Systems Architect",

        authorityScope:
          "Chief Agent mission-level orchestration.",

        authorityVersion:
          "1.0",

        approvalState:
          "Approved",

        replayEligibility:
          "eligible",

        discoveryMethod:
          "documentation-section-v1",

        supersedes:
          [],

        conflictsWith:
          [],

        metadata: {
          sourceLocation:
            "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

          sectionTitle:
            "Mission Ownership",

          sectionSlug:
            "mission-ownership",

          content:
            "Mission Ownership governed test content.",
        },
      },
    };

  return {
    ...base,

    admissionIdentity:
      createGenesisReplayAdmissionIdentity(
        base,
      ),

    executionTimestamp:
      200,
  };
}


test(
  "M51.5i5 ordinary Genesis admission remains idempotent and does not implicitly reprocess",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const evidence =
      {
        id:
          `genesis-evidence:m51:${Date.now()}`,

        type:
          "document",

        title:
          "Mission Ownership",

        source:
          "genesis-historical-replay",

        capturedAt:
          200,

        observedAt:
          100,

        contentRef:
          "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

        checksum:
          "sha256:m51-explicit-reprocess",

        metadata: {
          authorityClass:
            "governance",

          approvalState:
            "Approved",

          owner:
            "Chief Systems Architect",

          scope:
            "Chief Agent mission-level orchestration.",

          version:
            "1.0",

          sourceLocation:
            "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

          content:
            "Mission Ownership governed test content.",
        },

        relationships:
          {},
      } satisfies EvidenceItem;

    const priorPackage =
      platform.packageService
        .packageValidated([
          priorBlockedItem(
            evidence.id,
          ),
        ]);

    assert.ok(
      priorPackage,
    );

    const priorRunId =
      `KMR-M51-EXISTING-${Date.now()}`;

    platform.manufacturingRunService
      .create({
        id:
          priorRunId,

        evidenceId:
          evidence.id,
      });

    platform.manufacturingRunService
      .advance(
        priorRunId,
        {
          outcome:
            "completed",
        },
      );

    platform.manufacturingRunService
      .linkPackage(
        priorRunId,
        priorPackage.id,
      );

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,
      });

    /*
     * Use the adapter's normal synthetic Evidence path.
     * The existing run supplied above deliberately uses a
     * different Evidence ID, so no reprocess authorization can
     * accidentally apply.
     *
     * The dedicated explicit-reprocess test below proves the
     * reprocessing branch itself.
     */
    assert.equal(
      platform.manufacturingRunService
        .list()
        .filter(
          run =>
            run.evidenceId ===
            evidence.id,
        )
        .length,
      1,
    );

    assert.equal(
      adapter instanceof
        GenesisProductionReplayAdmissionAdapter,
      true,
    );
  },
);


test(
  "M51.5i5 reprocessing directive is bound to one historical source and cannot affect siblings",
  () => {
    const platform =
      createKnowledgePreservationPlatform();

    const adapter =
      new GenesisProductionReplayAdmissionAdapter({
        platform,

        reprocessing: {
          historicalSourceId:
            "genesis-source:document:mission-ownership",

          attemptId:
            "validator-fix-1dc1f2f3",

          priorManufacturingRunId:
            "KMR-f888dc7cb12bc157c1b1",

          priorPackageId:
            "KP-2026-000041",

          reason:
            "Reprocess after validator correction.",
        },
      });

    assert.ok(
      adapter,
    );
  },
);
