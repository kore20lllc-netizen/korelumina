import assert from "node:assert/strict";
import test from "node:test";

import {
  createKnowledgePreservationPlatform,
} from "../../bootstrap/index.js";

import {
  CanonicalReviewService,
} from "../../review/index.js";

import {
  GovernedCanonicalPromotionService,
} from "../../promotion/index.js";

test(
  "one persistent capsule follows its applicable governed manufacturing route",
  async () => {
    const platform =
      createKnowledgePreservationPlatform();

    const reviewService =
      new CanonicalReviewService(
        platform.packageService,
        platform.manufacturingRunService,
      );

    const promotionService =
      new GovernedCanonicalPromotionService(
        platform.packageService,
        platform.canonicalKnowledgeStore,
        platform.manufacturingRunService,
      );

    const evidence = {
      id:
        `DOC-E2E-${Date.now()}`,

      type:
        "document" as const,

      title:
        "Knowledge Manufacturing End-to-End Certification",

      source:
        "knowledge-flow-engine-certification",

      capturedAt:
        Date.now(),

      observedAt:
        Date.now(),

      contentRef:
        "docs/constitution/KNOWLEDGE_PHILOSOPHY.md",

      metadata: {
        certification:
          true,

        authorityClass:
          "Architecture",

        approvalState:
          "approved",

        owner:
          "Knowledge Operations",

        scope:
          "Knowledge Preservation Platform",

        version:
          "1.0.0",

        sourceLocation:
          "docs/constitution/KNOWLEDGE_PHILOSOPHY.md",

        destination:
          "Canonical Knowledge",

        lineage: [
          "Knowledge Operations",
          "Knowledge Preservation Platform",
        ],

        dependencies:
          [],
      },

      relationships:
        {},
    };

    await platform.preserve(
      evidence,
    );

    const runs =
      platform
        .manufacturingRunService
        .list();

    const run =
      runs.find(
        (candidate) =>
          candidate.evidenceId ===
          evidence.id,
      );

    assert.ok(
      run,
      "manufacturing run must exist",
    );

    const stableRunId =
      run.id;

    assert.equal(
      run.currentStage,
      "Canonical Review",
    );

    assert.equal(
      run.status,
      "active",
    );

    assert.ok(
      run.packageId,
      "package must be linked before Canonical Review",
    );

    const packageId =
      run.packageId;

    const preReviewStageSequence =
      run.stageHistory
        .filter(
          (event) =>
            event.outcome ===
            "entered",
        )
        .map(
          (event) =>
            event.stage,
        );

    assert.deepEqual(
      preReviewStageSequence,
      [
        "Evidence Intake",
        "Documentation Compiler",
        "Knowledge IR",
        "Validation",
        "Knowledge Package Assembly",
        "Canonical Review",
      ],
      "document evidence must bypass unrelated compiler stations",
    );

    const documentationOutcome =
      run.stageHistory.find(
        (event) =>
          event.stage ===
            "Documentation Compiler" &&
          event.outcome ===
            "completed",
      );

    assert.ok(
      documentationOutcome,
      "Documentation Compiler must execute for document evidence",
    );

    for (
      const station
      of [
        "Conversation Compiler",
        "Git Compiler",
        "Runtime Compiler",
        "Mission Compiler",
        "Execution Compiler",
      ] as const
    ) {
      assert.ok(
        run.stageHistory.some(
          (event) =>
            event.stage ===
              station &&
            event.outcome ===
              "not_applicable",
        ),
        `${station} must be explicitly not_applicable`,
      );

      assert.equal(
        run.stageHistory.some(
          (event) =>
            event.stage ===
              station &&
            event.outcome ===
              "entered",
        ),
        false,
        `${station} must never be occupied by document evidence`,
      );
    }

    assert.ok(
      run.stageHistory.some(
        (event) =>
          event.stage ===
            "Canonical Review" &&
          event.outcome ===
            "awaiting_human_review",
      ),
      "Canonical Review must wait for explicit human governance",
    );

    /*
     * GOVERNANCE ACTION 1:
     * explicit human approval.
     */
    reviewService.review({
      packageId,

      decision:
        "approved",

      reviewerId:
        "knowledge-flow-certification-human",

      evidenceConsidered: [
        evidence.id,
      ],

      reason:
        "Controlled end-to-end Knowledge Operations certification.",
    });

    const approvedRun =
      platform
        .manufacturingRunService
        .get(
          stableRunId,
        );

    assert.ok(
      approvedRun,
    );

    assert.equal(
      approvedRun.id,
      stableRunId,
      "capsule identity must remain stable after approval",
    );

    assert.equal(
      approvedRun.currentStage,
      "Canonical Knowledge",
    );

    assert.equal(
      approvedRun.status,
      "active",
    );

    assert.ok(
      approvedRun.stageHistory.some(
        (event) =>
          event.stage ===
            "Canonical Review" &&
          event.outcome ===
            "approved",
      ),
      "Canonical Review must record explicit approval",
    );

    /*
     * GOVERNANCE ACTION 2:
     * explicit governed canonical publication.
     */
    const promotion =
      promotionService
        .promoteApprovedPackage(
          packageId,
        );

    assert.ok(
      promotion.canonicalItems.length >
        0,
      "governed promotion must create canonical knowledge",
    );

    const completedRun =
      platform
        .manufacturingRunService
        .get(
          stableRunId,
        );

    assert.ok(
      completedRun,
    );

    assert.equal(
      completedRun.id,
      stableRunId,
      "capsule identity must remain stable through publication",
    );

    assert.equal(
      completedRun.currentStage,
      "Canonical Knowledge",
    );

    assert.equal(
      completedRun.status,
      "completed",
    );

    assert.equal(
      completedRun.packageId,
      packageId,
    );

    assert.deepEqual(
      completedRun.canonicalKnowledgeIds,
      promotion.canonicalItems.map(
        (item) =>
          item.id,
      ),
    );

    assert.ok(
      completedRun.stageHistory.some(
        (event) =>
          event.stage ===
            "Canonical Knowledge" &&
          event.outcome ===
            "published",
      ),
      "Canonical Knowledge must record governed publication",
    );

    const enteredStages =
      completedRun.stageHistory
        .filter(
          (event) =>
            event.outcome ===
            "entered",
        )
        .map(
          (event) =>
            event.stage,
        );

    assert.deepEqual(
      enteredStages,
      [
        "Evidence Intake",
        "Documentation Compiler",
        "Knowledge IR",
        "Validation",
        "Knowledge Package Assembly",
        "Canonical Review",
        "Canonical Knowledge",
      ],
      "document evidence must enter only its actual manufacturing route",
    );

    assert.equal(
      new Set(
        completedRun.stageHistory.map(
          () =>
            completedRun.id,
        ),
      ).size,
      1,
      "one stable Manufacturing Run identity must own the complete lifecycle",
    );

    console.log(
      JSON.stringify(
        {
          certification:
            "PASS",

          capsuleId:
            completedRun.id,

          evidenceId:
            completedRun.evidenceId,

          packageId:
            completedRun.packageId,

          canonicalKnowledgeIds:
            completedRun.canonicalKnowledgeIds,

          finalStatus:
            completedRun.status,

          stages:
            completedRun.stageHistory.map(
              (event) => ({
                stage:
                  event.stage,

                outcome:
                  event.outcome,
              }),
            ),
        },
        null,
        2,
      ),
    );
  },
);
