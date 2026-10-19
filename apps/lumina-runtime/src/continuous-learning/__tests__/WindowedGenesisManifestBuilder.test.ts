import assert from "node:assert/strict";
import test from "node:test";

import { isInLearningWindow } from "../index.js";

const entry = (overrides: Record<string, unknown>) =>
  ({ evidenceType: "commit", replayEligibility: "eligible", ...overrides }) as never;

test("keeps only sources inside the learning window", () => {
  const types = ["commit", "document", "ADR"];
  assert.equal(isInLearningWindow(entry({}), types), true);
  assert.equal(isInLearningWindow(entry({ evidenceType: "ADR" }), types), true);
  assert.equal(isInLearningWindow(entry({ replayEligibility: "excluded", exclusionReason: "before_replay_scope" }), types), false);
  assert.equal(isInLearningWindow(entry({ replayEligibility: "excluded", exclusionReason: "explicit_source_exclusion" }), types), false);
  assert.equal(isInLearningWindow(entry({ evidenceType: "conversation" }), types), false);
});

test("keeps window sources excluded for governance reasons, so the replay records why", () => {
  assert.equal(
    isInLearningWindow(entry({ replayEligibility: "excluded", exclusionReason: "unapproved_document" }), ["commit"]),
    true,
  );
});

import { isUncommittedDocumentError } from "../index.js";

test("a document that is not committed yet does not block learning", () => {
  assert.equal(isUncommittedDocumentError({ code: "TIMESTAMP_UNAVAILABLE", historicalSourceId: "genesis-source:document:x" }), true);
  assert.equal(isUncommittedDocumentError({ code: "SOURCE_UNAVAILABLE" }), false);
  assert.equal(isUncommittedDocumentError({ code: "TIMESTAMP_UNAVAILABLE" }), false);
});
