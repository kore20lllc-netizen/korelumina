import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  checkLearningRecord,
  isBookkeepingCommit,
  LearningRecordService,
  LearningRecordSynthesizer,
  LearningRecordWriter,
  parseLearningRecordDraft,
  type LearningEvidence,
} from "../index.js";

const SHA_A = "a".repeat(40);
const SHA_B = "b1" + "0".repeat(38);

const evidence: LearningEvidence = {
  fromCommit: "f".repeat(40),
  toCommit: SHA_B,
  commits: [
    { sha: SHA_A, subject: "feat: a", authorName: "o", committedAt: 1, detail: "feat: a", files: ["src/a.ts"] },
    { sha: SHA_B, subject: "fix: b", authorName: "o", committedAt: 2, detail: "fix: b", files: ["src/b.ts"] },
  ],
  bookkeepingCommits: [],
  changedFiles: ["src/a.ts", "src/b.ts"],
  executiveRecords: [{ id: "decision:reasoning:x", kind: "decision", title: "X", status: "proposed", at: 2 }],
};

const draftJson = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    title: "Work",
    summary: "Summary.",
    changes: [
      { statement: "Built A.", citations: [SHA_A] },
      { statement: "Invented C.", citations: ["c".repeat(40)] },
    ],
    decisions: [{ statement: "Chose B.", citations: ["b10000000", "decision:reasoning:x"] }],
    lessons: [{ statement: "No source.", citations: [] }],
    risks: [{ statement: "File risk.", citations: ["src/b.ts"] }],
    conflictsWithGoverningKnowledge: false,
    conflictNotes: "",
    confidence: 0.8,
    ...overrides,
  });

test("keeps only statements that cite sources in the window", () => {
  const check = checkLearningRecord(parseLearningRecordDraft(draftJson()), evidence, 0.6);
  assert.equal(check.passed, true);
  assert.equal(check.keptStatements, 3);
  assert.equal(check.removedStatements, 2);
  assert.deepEqual(check.record.changes.map((s) => s.statement), ["Built A."]);
  assert.deepEqual(check.record.decisions[0].citations, [SHA_B, "decision:reasoning:x"]);
  assert.deepEqual(check.record.lessons, []);
});

test("holds a record that conflicts with governing knowledge or has low confidence", () => {
  const conflict = checkLearningRecord(
    parseLearningRecordDraft(draftJson({ conflictsWithGoverningKnowledge: true, conflictNotes: "contradicts CA-005" })),
    evidence,
    0.6,
  );
  assert.equal(conflict.passed, false);
  assert.deepEqual(conflict.reasons, ["conflict_with_governing_knowledge:contradicts CA-005"]);

  const low = checkLearningRecord(parseLearningRecordDraft(draftJson({ confidence: 0.4 })), evidence, 0.6);
  assert.deepEqual(low.reasons, ["confidence_below_threshold:0.4<0.6"]);
});

test("holds a record with no cited statement", () => {
  const check = checkLearningRecord(
    parseLearningRecordDraft(draftJson({ changes: [], decisions: [], risks: [] })),
    evidence,
    0.6,
  );
  assert.deepEqual(check.reasons, ["no_cited_statements"]);
});

test("an ambiguous short SHA is not a citation", () => {
  const ambiguous: LearningEvidence = {
    ...evidence,
    commits: [
      { ...evidence.commits[0], sha: "abc1234" + "0".repeat(33) },
      { ...evidence.commits[1], sha: "abc1234" + "1".repeat(33) },
    ],
  };
  const check = checkLearningRecord(
    parseLearningRecordDraft(draftJson({ changes: [{ statement: "x", citations: ["abc1234"] }], decisions: [], risks: [] })),
    ambiguous,
    0.6,
  );
  assert.equal(check.keptStatements, 0);
});

test("invalid model output is rejected", () => {
  assert.throws(() => parseLearningRecordDraft("not json"), /learning_record_invalid_json/);
  assert.equal(parseLearningRecordDraft("```json\n" + draftJson() + "\n```").title, "Work");
});

test("bookkeeping-only commits are not learned from", () => {
  assert.equal(isBookkeepingCommit(["docs/learning/LR-2026-0001-x.md", "runtime/knowledge/evidence/e.json"]), true);
  assert.equal(isBookkeepingCommit(["docs/learning/LR-2026-0001-x.md", "src/a.ts"]), false);
  assert.equal(isBookkeepingCommit([]), false);
});

test("writes a governed, numbered Learning Record and never overwrites", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lr-"));
  const writer = new LearningRecordWriter(root);
  const check = checkLearningRecord(parseLearningRecordDraft(draftJson()), evidence, 0.6);
  const at = Date.UTC(2026, 9, 19);
  const first = writer.write({ record: check.record, evidence, cycleId: "learning-cycle:1", model: "m", writtenAt: at });
  const second = writer.write({ record: check.record, evidence, cycleId: "learning-cycle:2", model: "m", writtenAt: at });
  assert.equal(first.recordId, "LR-2026-0001");
  assert.equal(second.recordId, "LR-2026-0002");
  assert.equal(first.repositoryPath, "docs/learning/LR-2026-0001-work.md");
  const text = fs.readFileSync(path.join(root, first.repositoryPath), "utf8");
  for (const line of ["Status: Approved", "Version: 1.0", "Owner: Founder, Kore20 LLC", "Scope:", "Approval Date: 2026-10-19", "## What changed", "- Built A. (`aaaaaaaa`)"]) {
    assert.ok(text.includes(line), line);
  }
  assert.ok(!text.includes("Invented C."));
});

test("the service writes, holds, skips, or fails, and says which", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lr-svc-"));
  const make = (text: string | Error, collected = evidence) =>
    new LearningRecordService(
      { collect: () => collected },
      new LearningRecordSynthesizer({
        generateText: async () => {
          if (text instanceof Error) throw text;
          return { text, model: "test-model" };
        },
      }),
      new LearningRecordWriter(root),
      () => Date.UTC(2026, 9, 19),
    );
  const request = { cycleId: "c", fromCommit: "f", commits: [], windowStart: 0, windowEnd: 1, attempts: 1 };

  const written = await make(draftJson()).learn(request);
  assert.equal(written.state, "WRITTEN");
  assert.equal(written.model, "test-model");

  assert.equal((await make(draftJson({ confidence: 0.1 })).learn(request)).state, "HELD");
  assert.equal((await make(new Error("down")).learn(request)).state, "FAILED");
  assert.equal((await make(draftJson(), { ...evidence, commits: [] }).learn(request)).state, "SKIPPED");
});
