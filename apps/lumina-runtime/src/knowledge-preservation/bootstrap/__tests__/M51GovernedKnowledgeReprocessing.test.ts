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
} from "../createKnowledgePreservationPlatform.js";


function approvedEvidence(
  id:
    string,
): EvidenceItem {
  return {
    id,

    type:
      "document",

    title:
      "Governed reprocessing test document",

    source:
      "m51-governed-reprocessing-test",

    capturedAt:
      200,

    observedAt:
      100,

    contentRef:
      "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

    checksum:
      "sha256:m51-governed-reprocessing-test",

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

      confidence:
        1,

      content:
        "Mission Ownership governed reprocessing test.",
    },

    relationships:
      {},
  };
}


function blockedPriorItem(
  evidenceId:
    string,
): KnowledgeIRItem {
  return {
    id:
      `document:${evidenceId}:prior`,

    candidateType:
      "CandidateArtifact",

    title:
      "Prior blocked Mission Ownership result",

    summary:
      "Historical blocked result retained for remediation lineage.",

    confidence:
      1,

    evidenceRefs: [
      evidenceId,
    ],

    proposedRelationships:
      {},

    extractedAt:
      150,

    compiler: {
      compilerName:
        "documentation-compiler",

      compilerVersion:
        "1.0.0",

      evidenceSourceType:
        "document",

      extractedAt:
        150,

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

        issues: [
          {
            code:
              "historical-validator-defect",
          },
        ],
      },
    },
  };
}


test(
  "M51.5i4 reprocesses the same Evidence identity as a new manufacturing attempt while preserving failed history",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const evidence =
      approvedEvidence(
        `evidence:m51-reprocess:${Date.now()}`,
      );

    const priorPackage =
      platform.packageService
        .packageValidated([
          blockedPriorItem(
            evidence.id,
          ),
        ]);

    assert.ok(
      priorPackage,
    );

    assert.equal(
      priorPackage.state,
      "validated",
    );

    assert.equal(
      priorPackage.approvalState,
      "remediation_required",
    );

    const priorRunId =
      `KMR-M51-PRIOR-${Date.now()}`;

    platform.manufacturingRunService
      .create({
        id:
          priorRunId,

        evidenceId:
          evidence.id,
      });

    platform.manufacturingRunService
      .linkPackage(
        priorRunId,
        priorPackage.id,
      );

    const priorPackageSnapshot =
      JSON.stringify(
        platform.packageService.get(
          priorPackage.id,
        ),
      );

    const priorRunSnapshot =
      JSON.stringify(
        platform.manufacturingRunService.get(
          priorRunId,
        ),
      );

    await platform.reprocess(
      evidence,
      {
        attemptId:
          "validator-fix-1dc1f2f3",

        priorManufacturingRunId:
          priorRunId,

        priorPackageId:
          priorPackage.id,

        reason:
          "Reprocess after documentation approval normalization defect correction.",
      },
    );

    const matchingRuns =
      platform.manufacturingRunService
        .list()
        .filter(
          run =>
            run.evidenceId ===
            evidence.id,
        );

    assert.equal(
      matchingRuns.length,
      2,
    );

    const newRun =
      matchingRuns.find(
        run =>
          run.id !==
          priorRunId,
      );

    assert.ok(
      newRun,
    );

    assert.notEqual(
      newRun.id,
      priorRunId,
    );

    assert.equal(
      newRun.evidenceId,
      evidence.id,
    );

    assert.ok(
      newRun.packageId,
    );

    assert.notEqual(
      newRun.packageId,
      priorPackage.id,
    );

    const newPackage =
      platform.packageService.get(
        newRun.packageId,
      );

    assert.ok(
      newPackage,
    );

    assert.equal(
      newPackage.state,
      "awaiting_review",
    );

    assert.equal(
      newPackage.approvalState,
      "pending_review",
    );

    assert.equal(
      newPackage.remediation.required,
      false,
    );

    assert.ok(
      newPackage.lineage.includes(
        priorPackage.id,
      ),
    );

    assert.ok(
      newPackage.supersession
        .supersedes
        .includes(
          priorPackage.id,
        ),
    );

    const item =
      newPackage.items[0];

    assert.ok(
      item,
    );

    assert.deepEqual(
      item.metadata.reprocessing,
      {
        attemptId:
          "validator-fix-1dc1f2f3",

        priorManufacturingRunId:
          priorRunId,

        priorPackageId:
          priorPackage.id,

        reason:
          "Reprocess after documentation approval normalization defect correction.",
      },
    );

    assert.equal(
      JSON.stringify(
        platform.packageService.get(
          priorPackage.id,
        ),
      ),
      priorPackageSnapshot,
      "prior package must remain immutable",
    );

    assert.equal(
      JSON.stringify(
        platform.manufacturingRunService.get(
          priorRunId,
        ),
      ),
      priorRunSnapshot,
      "prior manufacturing run must remain immutable",
    );

    assert.deepEqual(
      platform.canonicalKnowledgeStore
        .list(),
      [],
    );
  },
);


test(
  "M51.5i4 refuses reprocessing unless prior package requires remediation",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const evidence =
      approvedEvidence(
        `evidence:m51-reprocess-guard:${Date.now()}`,
      );

    await platform.preserve(
      evidence,
    );

    const priorRun =
      platform.manufacturingRunService
        .list()
        .find(
          run =>
            run.evidenceId ===
            evidence.id,
        );

    assert.ok(
      priorRun,
    );

    assert.ok(
      priorRun.packageId,
    );

    await assert.rejects(
      platform.reprocess(
        evidence,
        {
          attemptId:
            "should-not-run",

          priorManufacturingRunId:
            priorRun.id,

          priorPackageId:
            priorRun.packageId,

          reason:
            "Invalid reprocess attempt.",
        },
      ),
      /knowledge_reprocessing_prior_package_not_remediation_required/,
    );
  },
);
