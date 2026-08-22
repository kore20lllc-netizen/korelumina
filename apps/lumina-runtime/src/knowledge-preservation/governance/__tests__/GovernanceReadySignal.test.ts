import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type {
  EvidenceItem,
} from "../../evidence/index.js";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/index.js";

import type {
  GovernanceReadySignal,
  GovernanceReadySignalPublisher,
} from "../GovernanceReadySignal.js";

class RecordingPublisher
implements GovernanceReadySignalPublisher {
  readonly signals:
    GovernanceReadySignal[] =
      [];

  publish(
    signal:
      GovernanceReadySignal,
  ): void {
    this.signals.push(
      signal,
    );
  }
}

function controlledEvidence(
  id:
    string,

  contentRef:
    string,
): EvidenceItem {
  return {
    id,

    type:
      "document",

    title:
      "Vision 2050 Governance Ready Signal Certification",

    source:
      "phase51-controlled-test",

    capturedAt:
      1000,

    observedAt:
      1000,

    contentRef,

    metadata: {
      authorityClass:
        "architecture",

      approvalState:
        "approved",

      owner:
        "Knowledge Governance",

      scope:
        "platform",

      version:
        "1.0.0",

      sourceLocation:
        contentRef,

      destination:
        "canonical-knowledge",

      lineage: [
        id,
      ],

      dependencies:
        [],

      documentClassification:
        "controlled-certification",
    },

    relationships:
      {},
  };
}

test(
  "successful manufacturing emits one governance-ready signal after package reaches Canonical Review",
  async () => {
    const tempRoot =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-phase51-",
        ),
      );

    const contentRef =
      path.join(
        tempRoot,
        "governance-ready.md",
      );

    fs.writeFileSync(
      contentRef,
      [
        "# Governance Ready Certification",
        "",
        "Authority: architecture",
        "Scope: platform",
        "Owner: Knowledge Governance",
        "Version: 1.0.0",
        "",
        "Controlled governed architecture evidence.",
      ].join("\n"),
      "utf8",
    );

    const publisher =
      new RecordingPublisher();

    const platform =
      createKnowledgePreservationPlatform(
        publisher,
        () => 5000,
      );

    const evidence =
      controlledEvidence(
        `phase51-ready-${Date.now()}`,
        contentRef,
      );

    await platform.preserve(
      evidence,
    );

    assert.equal(
      publisher.signals.length,
      1,
    );

    const signal =
      publisher.signals[0];

    assert.ok(
      signal,
    );

    assert.equal(
      signal.evidenceId,
      evidence.id,
    );

    assert.equal(
      signal.packageVersion,
      "1.0.0",
    );

    assert.equal(
      signal.emittedAt,
      5000,
    );

    const knowledgePackage =
      platform.packageService
        .get(
          signal.packageId,
        );

    assert.ok(
      knowledgePackage,
    );

    assert.equal(
      knowledgePackage.state,
      "awaiting_review",
    );

    assert.equal(
      knowledgePackage.approvalState,
      "pending_review",
    );

    assert.equal(
      knowledgePackage.version,
      signal.packageVersion,
    );

    const run =
      platform
        .manufacturingRunService
        .get(
          signal.manufacturingRunId,
        );

    assert.ok(
      run,
    );

    assert.equal(
      run.packageId,
      signal.packageId,
    );

    assert.equal(
      run.evidenceId,
      evidence.id,
    );

    assert.equal(
      run.currentStage,
      "Canonical Review",
    );

    /*
     * Signal emission itself must not cross governance.
     */
    assert.notEqual(
      knowledgePackage.state,
      "approved",
    );

    assert.notEqual(
      knowledgePackage.state,
      "canonical",
    );

    assert.equal(
      knowledgePackage
        .metadata
        .canonicalReviewPolicy,
      undefined,
    );
  },
);

test(
  "default preservation composition remains inert at governance boundary",
  async () => {
    const tempRoot =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-phase51-noop-",
        ),
      );

    const contentRef =
      path.join(
        tempRoot,
        "noop.md",
      );

    fs.writeFileSync(
      contentRef,
      [
        "# No-op Publisher Certification",
        "",
        "Architecture governance evidence.",
      ].join("\n"),
      "utf8",
    );

    const platform =
      createKnowledgePreservationPlatform();

    const evidence =
      controlledEvidence(
        `phase51-noop-${Date.now()}`,
        contentRef,
      );

    await platform.preserve(
      evidence,
    );

    const packages =
      platform.packageService
        .list()
        .filter(
          (item) =>
            item.sourceEvidenceRefs
              .includes(
                evidence.id,
              ),
        );

    assert.equal(
      packages.length,
      1,
    );

    assert.equal(
      packages[0]
        ?.state,
      "awaiting_review",
    );

    assert.equal(
      packages[0]
        ?.approvalState,
      "pending_review",
    );

    assert.equal(
      packages[0]
        ?.metadata
        .canonicalReviewPolicy,
      undefined,
    );
  },
);
