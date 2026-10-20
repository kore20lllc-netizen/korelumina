import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { isHumanOnlyExecutivePath } from "../../../routes/runtimeBoundary.js";
import {
  MissionService,
  MissionValidationService,
  MissionWorkLinker,
  gitDocumentCommitted,
  type MissionActor,
  type MissionValidationPorts,
} from "../index.js";

/* MS-4 (ADR-0044 Decision 5): validation is evidence, not a claim. */

const owner: MissionActor = { id: "human:founder", type: "human" };
const agent: MissionActor = { id: "chief-agent", type: "chief-agent" };
const SHA1 = "1111111111111111111111111111111111111111";
const SHA2 = "2222222222222222222222222222222222222222";

function setup(overrides: Partial<MissionValidationPorts> = {}) {
  const missions = new MissionService();
  const completed: string[] = [];
  const approvals = new Map<string, string>();
  const documents = new Set<string>(["docs/adr/ADR-0044-mission-system-v1.md"]);
  const validation = new MissionValidationService(missions, {
    approvalStatus: (id) => approvals.get(id),
    documentCommitted: (file) => documents.has(file),
    afterCompleted: (id) => completed.push(id),
    ...overrides,
  });
  const created = missions.create(
    {
      title: "Validated mission",
      objective: "Complete only on evidence",
      plan: {
        epics: [{ title: "E", tasks: [{ title: "First" }, { title: "Second" }] }],
        requiredDocuments: ["docs/adr/ADR-0044-mission-system-v1.md"],
      },
    },
    owner,
  );
  missions.transition(created.id, "submit", owner);
  missions.transition(created.id, "approve", owner);
  missions.linkWork(created.id, { sha: SHA1, subject: "feat: the work", committedAt: 1 });
  return { missions, validation, id: created.id, completed, approvals, documents };
}

const failing = (validation: MissionValidationService, id: string) =>
  validation.checks(id).filter((check) => !check.passed).map((check) => check.id);

test("a mission completes only when every check passes, and Runtime takes each step", () => {
  const { missions, validation, id, completed } = setup();
  assert.equal(missions.get(id)!.state, "executing");
  assert.deepEqual(failing(validation, id), ["tasks", "build"]);

  validation.setTaskStatus(id, "E1.T1", "done", owner);
  assert.equal(missions.get(id)!.state, "executing", "one task is still to do");

  const dropped = validation.setTaskStatus(id, "E1.T2", "dropped", owner, "Folded into MS-5");
  assert.equal(dropped.state, "validating", "resolved work moves to validation, not completion");
  assert.deepEqual(dropped.validation?.checks.filter((check) => !check.passed).map((check) => check.id), ["build"]);

  const done = validation.recordVerification(id, { check: "build", result: "passed", note: "npm run build" }, owner);
  assert.equal(done.state, "completed");
  assert.deepEqual(done.history.slice(-3).map((step) => [step.to, step.actor.type]), [
    ["executing", "system"],
    ["validating", "system"],
    ["completed", "system"],
  ]);
  assert.match(done.history.at(-1)!.reason!, /All validation checks passed at 11111111/);
  assert.deepEqual(completed, [id]);
});

test("a failed build keeps the mission validating, and a new commit needs its own verification", () => {
  const { missions, validation, id } = setup();
  validation.setTaskStatus(id, "E1.T1", "done", owner);
  validation.setTaskStatus(id, "E1.T2", "done", owner);
  assert.equal(validation.recordVerification(id, { result: "failed" }, owner).state, "validating");
  assert.equal(validation.recordVerification(id, { result: "passed", sha: SHA1.slice(0, 8) }, owner).state, "completed");

  /* A fix lands after the failure: the new commit needs its own verification. */
  const second = setup();
  second.validation.setTaskStatus(second.id, "E1.T1", "done", owner);
  second.validation.setTaskStatus(second.id, "E1.T2", "done", owner);
  second.validation.recordVerification(second.id, { result: "failed" }, owner);
  second.missions.linkWork(second.id, { sha: SHA2, subject: "fix: the build", committedAt: 2 });
  assert.equal(second.validation.evaluate(second.id).state, "validating");
  assert.match(second.validation.checks(second.id).find((check) => check.id === "build")!.detail, /No build verification for 22222222/);
  assert.equal(second.validation.recordVerification(second.id, { result: "passed" }, owner).state, "completed");
  assert.equal(missions.get(id)!.state, "completed");
});

test("a pending linked approval or an uncommitted required document blocks completion", () => {
  const { missions, validation, id, approvals, documents } = setup();
  approvals.set("approval:pending", "pending");
  documents.clear();
  missions.attachApproval(id, "approval:pending");

  validation.setTaskStatus(id, "E1.T1", "done", owner);
  validation.setTaskStatus(id, "E1.T2", "done", owner);
  const blocked = validation.recordVerification(id, { result: "passed" }, owner);
  assert.equal(blocked.state, "validating");
  assert.deepEqual(failing(validation, id), ["approvals", "documents"]);

  approvals.set("approval:pending", "approved");
  documents.add("docs/adr/ADR-0044-mission-system-v1.md");
  assert.equal(validation.evaluate(id).state, "completed");
});

test("task status and build verification are the owner's evidence only", () => {
  const { validation, id, missions } = setup();
  assert.throws(() => validation.setTaskStatus(id, "E1.T1", "done", agent), /mission_validation_not_allowed_for_chief-agent/);
  assert.throws(() => validation.recordVerification(id, { result: "passed" }, agent), /mission_validation_not_allowed_for_chief-agent/);
  assert.throws(() => validation.setTaskStatus(id, "E1.T1", "dropped", owner), /mission_task_drop_reason_required/);
  assert.throws(() => validation.setTaskStatus(id, "E9.T9", "done", owner), /mission_task_not_found/);
  assert.throws(() => validation.recordVerification(id, { result: "passed", sha: SHA2 }, owner), /mission_verification_commit_not_linked/);
  assert.throws(() => validation.recordVerification(id, {}, owner), /mission_verification_result_required/);

  const planned = missions.create({ title: "Not started", objective: "x", plan: { epics: [{ title: "E", tasks: [{ title: "T" }] }] } }, owner);
  assert.throws(() => validation.setTaskStatus(planned.id, "E1.T1", "done", owner), /mission_tasks_locked_while_planned/);
  assert.throws(() => validation.recordVerification(planned.id, { result: "passed" }, owner), /mission_cannot_verify_while_planned/);
  assert.equal(validation.evaluate(planned.id).state, "planned");
});

test("after each learning cycle, missions in execution are re-evaluated", () => {
  const { missions, validation, id } = setup();
  validation.setTaskStatus(id, "E1.T1", "done", owner);
  const mission = missions.get(id)!;
  missions.save({
    ...mission,
    plan: { ...mission.plan!, epics: mission.plan!.epics.map((epic) => ({ ...epic, tasks: epic.tasks.map((task) => ({ ...task, status: "done" as const })) })) },
  });
  let evaluated = 0;
  new MissionWorkLinker(missions, () => false, () => {
    evaluated += 1;
    validation.evaluateAll();
  }).afterCycle({
    cycleId: "c", trigger: "automatic", startedAt: 1, completedAt: 2, fromCommit: "a", toCommit: null,
    commits: [], outcome: "NO_NEW_WORK", reasons: [], replayId: null, admittedSources: null,
  } as any);
  assert.equal(evaluated, 1);
  assert.equal(missions.get(id)!.state, "validating");
});

test("a required document counts only when committed at HEAD inside the repository", () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "korelumina-docs-"));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  git("init", "-q");
  git("config", "user.email", "kore20lllc@gmail.com");
  git("config", "user.name", "Owner");
  fs.mkdirSync(path.join(repo, "docs"));
  fs.writeFileSync(path.join(repo, "docs/plan.md"), "plan");
  git("add", ".");
  git("commit", "-q", "-m", "docs");
  fs.writeFileSync(path.join(repo, "docs/draft.md"), "not committed");

  const committed = gitDocumentCommitted(repo);
  assert.equal(committed("docs/plan.md"), true);
  assert.equal(committed("./docs/plan.md"), true);
  assert.equal(committed("docs/draft.md"), false);
  assert.equal(committed("../outside.md"), false);
  assert.equal(committed("/etc/passwd"), false);
});

test("task and verification routes are owner-only at the Runtime boundary", () => {
  assert.equal(isHumanOnlyExecutivePath("/missions/MS-2026-0001/tasks/E1.T1"), true);
  assert.equal(isHumanOnlyExecutivePath("/missions/MS-2026-0001/verifications"), true);
  assert.equal(isHumanOnlyExecutivePath("/missions/MS-2026-0001/evaluate"), false);
});
