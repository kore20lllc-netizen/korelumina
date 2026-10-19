import assert from "node:assert/strict";
import test from "node:test";

import {
  ContinuousLearningCycleService,
  type ContinuousLearningLedgerState,
  type LearningCaptureRequest,
  type LearningWindowCommit,
  type LearningWindowSource,
} from "../index.js";

const OWNER = "owner@example.com";

function commit(sha: string, at: number, email = OWNER): LearningWindowCommit {
  return { sha, authorName: "x", authorEmail: email, committedAt: at, subject: sha };
}

function fixture(options: {
  history: LearningWindowCommit[];
  capture?: (request: LearningCaptureRequest) => Promise<{ replayId: string | null; admittedSources: number }>;
  day0?: number | null;
}) {
  let stored: ContinuousLearningLedgerState | null = null;
  const writes: ContinuousLearningLedgerState[] = [];
  const captures: LearningCaptureRequest[] = [];
  const history = options.history;

  const window: LearningWindowSource = {
    head: () => ({ sha: history[history.length - 1].sha, committedAt: history[history.length - 1].committedAt, branch: "main" }),
    commitAt: (sha) => history.find((c) => c.sha === sha) ?? null,
    lastCommitAtOrBefore: (t) => [...history].reverse().find((c) => c.committedAt <= t) ?? null,
    commitsAfter: (sha) => history.slice(history.findIndex((c) => c.sha === sha) + 1),
    commitsSince: (t) => history.filter((c) => c.committedAt >= t).map((c) => c.sha),
    repositoryName: () => "owner/repo",
  };

  const service = new ContinuousLearningCycleService({
    ledger: {
      read: () => stored,
      write: (state) => {
        stored = structuredClone(state);
        writes.push(stored);
      },
    },
    window,
    ownerEmails: [OWNER.toUpperCase()],
    initialCheckpointTime: () => (options.day0 === undefined ? 2500 : options.day0),
    capture:
      options.capture ??
      (async (request) => {
        captures.push(request);
        return { replayId: "genesis-replay:test", admittedSources: 3 };
      }),
    now: () => 9000,
  });

  return { service, captures, writes, ledger: () => stored, history };
}

test("first checkpoint is the last commit at or before the Day-0 certification", () => {
  const f = fixture({ history: [commit("a", 1000), commit("b", 2000), commit("c", 3000)] });
  const status = f.service.status();
  assert.equal(status.checkpoint?.commit, "b");
  assert.deepEqual(status.pendingCommits.map((c) => c.sha), ["c"]);
});

test("captures owner work since the checkpoint and advances the checkpoint", async () => {
  const f = fixture({ history: [commit("a", 1000), commit("b", 2000), commit("c", 3000), commit("d", 4000)] });
  const cycle = await f.service.run("manual");
  assert.equal(cycle.outcome, "CAPTURED");
  assert.deepEqual(cycle.commits.map((c) => c.sha), ["c", "d"]);
  assert.equal(f.captures.length, 1);
  assert.equal(f.captures[0].historicalStart, 3000);
  assert.deepEqual(f.captures[0].explicitlyExcludedSourceIds, []);
  assert.equal(f.ledger()?.checkpoint.commit, "d");
  assert.equal(f.ledger()?.cycles.length, 1);
});

test("older commits in the same second are excluded from the capture", async () => {
  const ledger: ContinuousLearningLedgerState = {
    version: "continuous-learning-ledger:v1",
    checkpoint: { commit: "b2", committedAt: 3000, establishedAt: 1, basis: "test" },
    cycles: [],
  };
  let request: LearningCaptureRequest | undefined;
  const service = new ContinuousLearningCycleService({
    ledger: { read: () => structuredClone(ledger), write: () => undefined },
    window: {
      head: () => ({ sha: "c", committedAt: 3000, branch: "main" }),
      commitAt: () => null,
      lastCommitAtOrBefore: () => null,
      commitsAfter: () => [commit("c", 3000)],
      commitsSince: () => ["c", "b2"],
      repositoryName: () => "owner/repo",
    },
    ownerEmails: [OWNER],
    initialCheckpointTime: () => 3000,
    capture: async (received) => {
      request = received;
      return { replayId: null, admittedSources: 1 };
    },
  });
  assert.equal((await service.run("manual")).outcome, "CAPTURED");
  assert.deepEqual(request?.explicitlyExcludedSourceIds, ["genesis-source:commit:b2"]);
});

test("work by anyone other than the owner is held and the checkpoint stays", async () => {
  const f = fixture({ history: [commit("a", 1000), commit("b", 2000), commit("c", 3000, "someone@else.com")] });
  const cycle = await f.service.run("automatic");
  assert.equal(cycle.outcome, "HELD");
  assert.deepEqual(cycle.reasons, ["non_owner_commit:c:someone@else.com"]);
  assert.equal(f.captures.length, 0);
  assert.equal(f.ledger()?.checkpoint.commit, "b");
});

test("a failed capture is recorded and the checkpoint stays", async () => {
  const f = fixture({
    history: [commit("a", 1000), commit("b", 2000), commit("c", 3000)],
    capture: async () => {
      throw new Error("boom");
    },
  });
  const cycle = await f.service.run("automatic");
  assert.equal(cycle.outcome, "FAILED");
  assert.deepEqual(cycle.reasons, ["capture_failed:boom"]);
  assert.equal(f.ledger()?.checkpoint.commit, "b");
  assert.equal(f.ledger()?.cycles.length, 1);
});

test("no new work is not recorded as a cycle", async () => {
  const f = fixture({ history: [commit("a", 1000), commit("b", 2000)] });
  const cycle = await f.service.run("automatic");
  assert.equal(cycle.outcome, "NO_NEW_WORK");
  assert.equal(f.ledger()?.cycles.length, 0);
});

test("concurrent requests share one cycle", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let calls = 0;
  const f = fixture({
    history: [commit("a", 1000), commit("b", 2000), commit("c", 3000)],
    capture: async () => {
      calls += 1;
      await gate;
      return { replayId: null, admittedSources: 1 };
    },
  });
  const first = f.service.run("automatic");
  const second = f.service.run("manual");
  assert.equal(f.service.isRunning(), true);
  release();
  assert.equal((await first).cycleId, (await second).cycleId);
  assert.equal(calls, 1);
  assert.equal(f.service.isRunning(), false);
});

test("without a Day-0 certification there is no starting point", () => {
  const f = fixture({ history: [commit("a", 1000)], day0: null });
  assert.throws(() => f.service.status(), /continuous_learning_initial_checkpoint_unavailable/);
});

test("after capture the Chief Agent writes the Learning Record; a failed write is retried without capturing again", async () => {
  let stored: ContinuousLearningLedgerState | null = null;
  const history = [commit("a", 1000), commit("b", 2000), commit("c", 3000)];
  let captures = 0;
  const outcomes = ["FAILED", "WRITTEN"] as const;
  const requests: number[] = [];
  const service = new ContinuousLearningCycleService({
    ledger: { read: () => (stored ? structuredClone(stored) : null), write: (s) => (stored = structuredClone(s)) },
    window: {
      head: () => ({ sha: "c", committedAt: 3000, branch: "main" }),
      commitAt: (sha) => history.find((h) => h.sha === sha) ?? null,
      lastCommitAtOrBefore: (t) => [...history].reverse().find((h) => h.committedAt <= t) ?? null,
      commitsAfter: (sha) => history.slice(history.findIndex((h) => h.sha === sha) + 1),
      commitsSince: (t) => history.filter((h) => h.committedAt >= t).map((h) => h.sha),
      repositoryName: () => "owner/repo",
    },
    ownerEmails: [OWNER],
    initialCheckpointTime: () => 2500,
    capture: async () => {
      captures += 1;
      return { replayId: null, admittedSources: 1 };
    },
    learner: {
      learn: async (request) => {
        requests.push(request.attempts);
        const state = outcomes[requests.length - 1];
        return {
          state,
          reasons: state === "FAILED" ? ["synthesis_failed:down"] : [],
          recordId: state === "WRITTEN" ? "LR-2026-0001" : null,
          repositoryPath: null,
          keptStatements: null,
          removedStatements: null,
          model: null,
          attemptedAt: 1,
          attempts: request.attempts,
        };
      },
    },
    now: () => 9000,
  });

  const first = await service.run("automatic");
  assert.equal(first.outcome, "CAPTURED");
  assert.equal(first.learning?.state, "FAILED");
  assert.equal(stored!.checkpoint.commit, "c");

  const second = await service.run("automatic");
  assert.equal(second.outcome, "NO_NEW_WORK");
  assert.equal(captures, 1);
  assert.deepEqual(requests, [1, 2]);
  assert.equal(stored!.cycles[0].learning?.state, "WRITTEN");
  assert.equal(stored!.cycles[0].learning?.recordId, "LR-2026-0001");
});
