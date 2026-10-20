import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { GitLearningWindowSource, parseMissionTrailers } from "../../../continuous-learning/GitLearningWindow.js";
import type { LearningCycleRecord, LearningWindowCommit } from "../../../continuous-learning/ContinuousLearningLedger.js";
import { MissionService, MissionWorkLinker, type MissionActor } from "../index.js";

/* MS-2 (ADR-0044 Decision 3): owner commits with a Mission trailer are the mission's execution. */

const owner: MissionActor = { id: "human:founder", type: "human" };
const system: MissionActor = { id: "runtime", type: "system" };
const plan = { epics: [{ title: "E", tasks: [{ title: "T", acceptanceCriteria: [] }] }] };

test("Mission trailers are parsed, normalised and deduplicated", () => {
  assert.deepEqual(parseMissionTrailers("MS-2026-0001,ms-2026-0002, MS-2026-0001"), ["MS-2026-0001", "MS-2026-0002"]);
  assert.deepEqual(parseMissionTrailers("EW-1, MS-26-1, none"), []);
});

test("the learning window reads Mission trailers from real git commits", () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "korelumina-trailers-"));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  git("init", "-q");
  git("config", "user.email", "kore20lllc@gmail.com");
  git("config", "user.name", "Owner");
  fs.writeFileSync(path.join(repo, "a.txt"), "a");
  git("add", ".");
  git("commit", "-q", "-m", "base");
  const base = git("rev-parse", "HEAD").trim();
  fs.writeFileSync(path.join(repo, "b.txt"), "b");
  git("add", ".");
  git("commit", "-q", "-m", "feat: mission work", "-m", "Why it matters.", "-m", "Mission: MS-2026-0007\nCo-Authored-By: Someone <s@example.com>");
  fs.writeFileSync(path.join(repo, "c.txt"), "c");
  git("add", ".");
  git("commit", "-q", "-m", "chore: no mission");

  const commits = new GitLearningWindowSource(repo).commitsAfter(base);
  assert.deepEqual(commits.map((commit) => commit.missions ?? []), [["MS-2026-0007"], []]);
  assert.equal(commits[0].subject, "feat: mission work");
});

function cycle(commits: LearningWindowCommit[], overrides: Partial<LearningCycleRecord> = {}): LearningCycleRecord {
  return {
    cycleId: `learning-cycle:${Math.random()}`,
    trigger: "automatic",
    startedAt: 1,
    completedAt: 2,
    fromCommit: "base",
    toCommit: commits.at(-1)?.sha ?? null,
    commits,
    outcome: "CAPTURED",
    reasons: [],
    replayId: null,
    admittedSources: 1,
    ...overrides,
  };
}

const commit = (sha: string, missions: string[]): LearningWindowCommit => ({
  sha, authorName: "Owner", authorEmail: "kore20lllc@gmail.com", committedAt: 1_000, subject: `work ${sha}`, missions,
});

function approvedMission(missions: MissionService) {
  const { id } = missions.create({ title: "T", objective: "O", plan }, owner);
  missions.transition(id, "submit", owner);
  missions.transition(id, "approve", owner);
  return id;
}

test("the first linked commit starts an approved mission and becomes its recovery anchor", () => {
  const missions = new MissionService();
  const id = approvedMission(missions);
  const linker = new MissionWorkLinker(missions, () => false);

  const first = linker.afterCycle(cycle([commit("aaa111", [id])], { learning: { recordId: "LR-2026-0099" } as never }));
  assert.deepEqual(first, [{ missionId: id, sha: "aaa111", result: "started" }]);

  let mission = missions.get(id)!;
  assert.equal(mission.state, "executing");
  assert.equal(mission.recoveryAnchor, "aaa111");
  assert.deepEqual(mission.producedKnowledge, ["LR-2026-0099"]);
  assert.match(mission.history.at(-1)!.reason!, /First linked commit aaa111/);

  linker.afterCycle(cycle([commit("bbb222", [id])]));
  mission = missions.get(id)!;
  assert.deepEqual(mission.linkedCommits.map((linked) => linked.sha), ["aaa111", "bbb222"]);
  assert.equal(mission.recoveryAnchor, "bbb222");
  assert.equal(mission.state, "executing");
});

test("commits never attach to an unapproved, finished or unknown mission, or from a held window", () => {
  const missions = new MissionService();
  const draft = missions.create({ title: "Draft", objective: "O" }, owner).id;
  const approved = approvedMission(missions);
  const linker = new MissionWorkLinker(missions, () => false);

  const outcomes = linker.afterCycle(cycle([commit("ccc333", [draft, "MS-2099-0001"])]));
  assert.deepEqual(outcomes.map((outcome) => outcome.reason), ["mission_draft", "mission_not_found"]);

  const held = linker.afterCycle(cycle([commit("ddd444", [approved])], { outcome: "HELD" }));
  assert.deepEqual(held, []);
  assert.equal(missions.get(approved)!.state, "approved");
  assert.deepEqual(missions.get(approved)!.linkedCommits, []);
});

test("a completed mission's knowledge is extracted once its Learning Record is canonical", () => {
  const missions = new MissionService();
  const id = approvedMission(missions);
  let canonical = false;
  const linker = new MissionWorkLinker(missions, (recordId) => canonical && recordId === "LR-2026-0100");

  linker.afterCycle(cycle([commit("eee555", [id])], { learning: { recordId: "LR-2026-0100" } as never }));
  missions.transition(id, "validate", system);
  missions.transition(id, "complete", system);

  linker.afterCycle(cycle([], { outcome: "NO_NEW_WORK" }));
  assert.equal(missions.get(id)!.state, "completed", "not yet canonical");

  canonical = true;
  linker.afterCycle(cycle([], { outcome: "NO_NEW_WORK" }));
  const mission = missions.get(id)!;
  assert.equal(mission.state, "knowledge_extracted");
  assert.equal(mission.history.at(-1)!.reason, "LR-2026-0100 is canonical");
});

/* F-36: a commit belongs to its mission whenever the mission is approved. */
const at = (sha: string, missions: string[], committedAt: number): LearningWindowCommit => ({ ...commit(sha, missions), committedAt });

test("a commit learned before its mission was approved links once the mission is approved", () => {
  const missions = new MissionService();
  const { id } = missions.create({ title: "F-33", objective: "O", plan }, owner);
  missions.transition(id, "submit", owner);
  const ledger: LearningCycleRecord[] = [];
  const linker = new MissionWorkLinker(missions, () => false, undefined, () => ledger);

  const learnedEarly = cycle([at("f33aaa", [id], 1_000)], { startedAt: 10, learning: { recordId: "LR-2026-0018" } as never });
  assert.deepEqual(linker.afterCycle(learnedEarly).map((outcome) => outcome.reason), ["mission_awaiting_approval"]);
  ledger.push(learnedEarly);

  missions.transition(id, "approve", owner);
  const next = linker.afterCycle(cycle([], { outcome: "NO_NEW_WORK", startedAt: 20 }));

  assert.deepEqual(next, [{ missionId: id, sha: "f33aaa", result: "started", fromCycleId: learnedEarly.cycleId }]);
  const mission = missions.get(id)!;
  assert.equal(mission.state, "executing");
  assert.equal(mission.recoveryAnchor, "f33aaa");
  assert.deepEqual(mission.producedKnowledge, ["LR-2026-0018"]);

  ledger.push(cycle([], { outcome: "NO_NEW_WORK", startedAt: 20 }));
  assert.deepEqual(linker.afterCycle(cycle([], { outcome: "NO_NEW_WORK", startedAt: 30 })), [], "linked once");
});

test("an older commit linked late never moves the recovery anchor back", () => {
  const missions = new MissionService();
  const id = approvedMission(missions);
  missions.linkWork(id, { sha: "new222", subject: "newer", committedAt: 2_000 });
  missions.linkWork(id, { sha: "old111", subject: "older", committedAt: 1_000 });
  assert.equal(missions.get(id)!.recoveryAnchor, "new222");
});

test("held or failed windows link nothing later either", () => {
  const missions = new MissionService();
  const id = approvedMission(missions);
  const ledger = [
    cycle([at("held01", [id], 1_000)], { outcome: "HELD", startedAt: 1 }),
    cycle([at("fail01", [id], 1_100)], { outcome: "FAILED", startedAt: 2 }),
  ];
  const linker = new MissionWorkLinker(missions, () => false, undefined, () => ledger);
  assert.deepEqual(linker.afterCycle(cycle([], { outcome: "NO_NEW_WORK", startedAt: 3 })), []);
  assert.deepEqual(missions.get(id)!.linkedCommits, []);
});
