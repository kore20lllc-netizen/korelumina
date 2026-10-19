import assert from "node:assert/strict";
import test from "node:test";

import {
  ChiefAgentOperationalStateReader,
} from "../ChiefAgentOperationalState.js";
import {
  TextGenerationChiefAgentReasoningProvider,
} from "../TextGenerationChiefAgentReasoningProvider.js";

/*
 * EW-2 (F-24): the Chief Agent sees what is happening now, cites it, and
 * cannot invent it.
 */

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 19, 13, 0, 0);

function reader(overrides: Partial<ConstructorParameters<typeof ChiefAgentOperationalStateReader>[0]> = {}) {
  return new ChiefAgentOperationalStateReader({
    now: () => NOW,
    activation: () => ({ state: "ACTIVE", autonomyLevel: "PROPOSE_ONLY" }),
    learning: () => ({
      checkpoint: { commit: "a3e61d8422aa", committedAt: NOW - DAY },
      pendingCommits: [{ sha: "b1", subject: "feat: voice" }],
      nonOwnerPendingCommits: [],
      running: false,
      cycles: [
        { cycleId: "learning-cycle:old", outcome: "FAILED", startedAt: NOW - 3 * DAY, commits: [], reasons: ["capture_failed"] },
        { cycleId: "learning-cycle:new", outcome: "CAPTURED", startedAt: NOW - DAY, completedAt: NOW - DAY + 1000, commits: [{ sha: "c1", subject: "feat: EW-1" }], reasons: [], learning: { recordId: "LR-2026-0006" } },
      ],
    }),
    approvals: () => [
      { id: "approval:decision:x", decisionId: "decision:x", status: "pending", requestedBy: "chief-agent", approverId: "human:founder", createdAt: NOW - 2 * DAY, metadata: { decisionTitle: "Ship voice" } },
      { id: "approval:decision:y", decisionId: "decision:y", status: "approved", requestedBy: "chief-agent", approverId: "human:founder", createdAt: NOW - 5 * DAY },
    ],
    decisions: () => [
      { id: "decision:x", title: "Ship voice", status: "proposed", createdAt: NOW - 2 * DAY, updatedAt: NOW - 2 * DAY },
    ],
    canonicalReviews: () => [
      { id: "KP-2026-000055", title: "ADR-0042 — Continuous Learning v1", classification: "individual", createdAt: NOW - 2 * DAY, updatedAt: NOW - 2 * DAY },
      { id: "KP-2026-000040", title: "CA-006 — Platform Constitution Identity", classification: "batch_candidate", createdAt: NOW - 54 * DAY, updatedAt: NOW - 54 * DAY },
    ],
    ...overrides,
  });
}

test("reads activation, learning, pending approvals, decisions and the review queue", () => {
  const state = reader().read();
  const ids = state.entries.map((entry) => entry.id);

  assert.equal(state.capturedAt, new Date(NOW).toISOString());
  assert.deepEqual(state.unavailable, []);
  assert.ok(ids.includes("operational:activation"));
  assert.ok(ids.includes("operational:learning"));
  assert.ok(ids.includes("operational:approval:decision:x"));
  assert.ok(!ids.includes("operational:approval:decision:y"), "only pending approvals are listed");
  assert.ok(ids.includes("operational:decision:x"));

  const reviews = state.entries.filter((entry) => entry.kind === "canonical-review");
  assert.deepEqual(
    reviews.map((entry) => entry.id),
    ["operational:canonical-review:KP-2026-000040", "operational:canonical-review:KP-2026-000055"],
    "oldest waiting review first",
  );
  assert.match(reviews[0].detail, /batch candidate; waiting 54 days/);

  const cycles = state.entries.filter((entry) => entry.kind === "learning-cycle");
  assert.equal(cycles[0].id, "operational:learning-cycle:new", "newest learning cycle first");
  assert.match(cycles[0].title, /CAPTURED, wrote LR-2026-0006/);
});

test("a part that cannot be read is reported unavailable, not guessed", () => {
  const state = reader({
    canonicalReviews: () => {
      throw new Error("package store offline");
    },
  }).read();

  assert.deepEqual(state.unavailable, ["canonical reviews: package store offline"]);
  assert.ok(!state.entries.some((entry) => entry.kind === "canonical-review"));
  assert.ok(state.entries.some((entry) => entry.id === "operational:activation"));
});

test("an empty queue says so explicitly", () => {
  const state = reader({ approvals: () => [], canonicalReviews: () => [] }).read();
  assert.ok(state.entries.some((entry) => entry.id === "operational:approvals"));
  assert.ok(state.entries.some((entry) => entry.id === "operational:canonical-reviews"));
});

const knowledge = {
  canonicalKnowledge: [],
  organizationalMemory: [],
};

function provider(answer: Record<string, unknown>, seen: { prompt: string }) {
  return new TextGenerationChiefAgentReasoningProvider({
    async generateText(request) {
      seen.prompt = request.prompt;
      return { text: JSON.stringify(answer), model: "test-model" };
    },
  });
}

const answer = {
  title: "Review order",
  disposition: "review",
  conclusion: "Start with KP-2026-000040: it has waited longest.",
  confidence: 0.8,
  evidence: ["operational:canonical-review:KP-2026-000040"],
  assumptions: [],
};

test("the prompt carries live state and the Chief Agent may cite it", async () => {
  const seen = { prompt: "" };
  const result = await provider(answer, seen).reason({
    eventId: "event:ew2",
    eventType: "chief-agent.question",
    query: "Which pending canonical review should I handle first?",
    knowledge,
    operationalState: reader().read(),
  });

  assert.match(seen.prompt, /Live operational state \(read-only, captured 2026-10-19T13:00:00.000Z\)/);
  assert.match(seen.prompt, /operational:canonical-review:KP-2026-000040/);
  assert.match(seen.prompt, /never authorizes an action by itself/);
  assert.deepEqual(result.evidence, ["operational:canonical-review:KP-2026-000040"]);
});

test("an operational id that was not in the snapshot is refused", async () => {
  await assert.rejects(
    provider({ ...answer, evidence: ["operational:canonical-review:KP-2026-999999"] }, { prompt: "" }).reason({
      eventId: "event:ew2-invented",
      eventType: "chief-agent.question",
      query: "Which review first?",
      knowledge,
      operationalState: reader().read(),
    }),
    /chief_agent_reasoning_unauthorized_evidence:operational:canonical-review:KP-2026-999999/,
  );
});

test("without a snapshot the prompt is unchanged and operational ids are refused", async () => {
  const seen = { prompt: "" };
  await assert.rejects(
    provider(answer, seen).reason({
      eventId: "event:ew2-none",
      eventType: "chief-agent.question",
      query: "Which review first?",
      knowledge,
    }),
    /unauthorized_evidence/,
  );
  assert.doesNotMatch(seen.prompt, /Live operational state/);
});
