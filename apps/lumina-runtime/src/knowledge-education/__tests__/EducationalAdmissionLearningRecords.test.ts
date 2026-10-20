import assert from "node:assert/strict";
import test from "node:test";

import { isEducationallyAdmissible } from "../admission/index.js";
import { KnowledgeEducationProjectionService } from "../KnowledgeEducationProjectionService.js";

/* ADR-0045: Learning Records are knowledge, not curriculum. */

function canonical(id: string, authorityClass: string, contentRef: string) {
  return {
    id,
    type: "CandidateDecision",
    title: id,
    summary: `${id} summary.`,
    confidence: 0.99,
    evidenceRefs: [`evidence:${id}`],
    relationships: {},
    createdAt: 100,
    updatedAt: 200,
    status: "canonical",
    metadata: {
      authorityClass,
      owner: "Founder, Kore20 LLC",
      scope: "platform",
      version: "1.0",
      source: "genesis-historical-replay",
      approvalState: "Approved",
      contentRef,
      sourceLocation: contentRef,
    },
  } as any;
}

const foundation = canonical("canonical:document:architecture", "architecture", "docs/architecture/CHIEF_AGENT_ARCHITECTURE.md");
const learningRecord = canonical("canonical:document:lr-2026-0003", "learning", "docs/learning/LR-2026-0003-cited-learning-records.md");

test("a canonical Learning Record is not admitted to the curriculum; foundational knowledge still is", () => {
  assert.equal(isEducationallyAdmissible(foundation), true);
  assert.equal(isEducationallyAdmissible(learningRecord), false);
  assert.equal(isEducationallyAdmissible(canonical("canonical:document:lr-x", " Learning ", "docs/learning/x.md")), false);
});

test("new Learning Records do not change the education snapshot the certifications are built on", () => {
  const before = new KnowledgeEducationProjectionService({ list: () => [foundation] }).snapshot();
  const after = new KnowledgeEducationProjectionService({ list: () => [foundation, learningRecord] }).snapshot();
  assert.deepEqual(after.artifacts.map((artifact) => artifact.id), before.artifacts.map((artifact) => artifact.id));
  assert.equal(after.artifacts.some((artifact) => artifact.id === learningRecord.id), false);
});
