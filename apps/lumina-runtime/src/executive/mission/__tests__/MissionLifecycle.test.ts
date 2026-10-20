import assert from "node:assert/strict";
import test from "node:test";

import { MissionService, MissionTransitionError, type MissionActor } from "../index.js";

/* MS-1 (ADR-0044 Decision 2): the mission lifecycle and who may take each step. */

const owner: MissionActor = { id: "human:founder", type: "human" };
const chief: MissionActor = { id: "chief-agent", type: "chief-agent" };
const system: MissionActor = { id: "runtime", type: "system" };

const plan = {
  epics: [{ title: "Records", tasks: [{ title: "Mission store", acceptanceCriteria: ["Missions persist"] }] }],
  validationPlan: ["npm run build passes"],
  requiredDocuments: [],
};

let clock = Date.UTC(2026, 9, 19, 23, 0, 0);
const service = () => new MissionService(undefined, () => (clock += 1000));

function rejects(run: () => unknown, code: string) {
  assert.throws(run, (error: unknown) => error instanceof MissionTransitionError && error.code === code);
}

test("a Chief Agent proposal goes draft, planned, awaiting approval, and only the owner approves", () => {
  const missions = service();
  const created = missions.create({ title: "Mission system", objective: "Missions become records" }, chief);
  assert.match(created.id, /^MS-2026-\d{4}$/);
  assert.equal(created.state, "draft");
  assert.equal(created.owner, "chief-agent");

  const planned = missions.setPlan(created.id, plan, chief);
  assert.equal(planned.state, "planned");
  assert.equal(planned.plan?.epics[0].tasks[0].id, "E1.T1");

  const submitted = missions.transition(created.id, "submit", chief);
  assert.equal(submitted.state, "awaiting_approval");

  rejects(() => missions.transition(created.id, "approve", chief), "mission_approve_not_allowed_for_chief-agent");
  const approved = missions.transition(created.id, "approve", owner);
  assert.equal(approved.state, "approved");

  assert.deepEqual(
    approved.history.map((step) => [step.from, step.to, step.actor.type]),
    [
      [null, "draft", "chief-agent"],
      ["draft", "planned", "chief-agent"],
      ["planned", "awaiting_approval", "chief-agent"],
      ["awaiting_approval", "approved", "human"],
    ],
  );
});

test("execution, validation, completion and knowledge extraction are system steps on evidence", () => {
  const missions = service();
  const { id } = missions.create({ title: "T", objective: "O", plan }, owner);
  missions.transition(id, "submit", owner);
  missions.transition(id, "approve", owner);

  for (const actor of [owner, chief]) {
    rejects(() => missions.transition(id, "start", actor), `mission_start_not_allowed_for_${actor.type}`);
  }
  for (const step of ["start", "validate", "complete", "extract_knowledge"] as const) {
    missions.transition(id, step, system);
  }
  assert.equal(missions.get(id)?.state, "knowledge_extracted");
  rejects(() => missions.transition(id, "archive", chief), "mission_archive_not_allowed_for_chief-agent");
  assert.equal(missions.transition(id, "archive", owner).state, "archived");
});

test("a mission cannot be submitted without a plan with at least one task", () => {
  const missions = service();
  const { id } = missions.create({ title: "T", objective: "O" }, owner);
  rejects(() => missions.transition(id, "submit", owner), "mission_cannot_submit_from_draft");
});

test("submit requires a plan, and an empty plan is refused", () => {
  const missions = service();
  const { id } = missions.create({ title: "T", objective: "O" }, owner);
  rejects(() => missions.setPlan(id, { epics: [{ title: "Empty", tasks: [] }] }, owner), "mission_plan_needs_a_task");
});

test("rejecting, blocking and cancelling need a reason; unblock returns to where it was", () => {
  const missions = service();
  const { id } = missions.create({ title: "T", objective: "O", plan }, chief);
  missions.transition(id, "submit", chief);
  rejects(() => missions.transition(id, "reject", owner, " "), "mission_reject_reason_required");
  assert.equal(missions.transition(id, "reject", owner, "Narrow the scope").state, "planned");

  missions.transition(id, "submit", chief);
  missions.transition(id, "approve", owner);
  rejects(() => missions.transition(id, "block", owner), "mission_block_reason_required");
  assert.equal(missions.transition(id, "block", owner, "Waiting for the provider key").state, "blocked");
  assert.equal(missions.transition(id, "unblock", owner, "Key added").state, "approved");

  assert.equal(missions.transition(id, "cancel", owner, "Superseded by MS-2026-0009").state, "cancelled");
  rejects(() => missions.transition(id, "approve", owner), "mission_cannot_approve_from_cancelled");
});

test("only a real human identity counts as the owner", () => {
  const missions = service();
  const { id } = missions.create({ title: "T", objective: "O", plan }, chief);
  missions.transition(id, "submit", chief);
  rejects(() => missions.transition(id, "approve", { id: "someone", type: "human" }), "mission_human_actor_required");
  rejects(() => missions.create({ title: "T", objective: "O" }, { id: "agent:other", type: "chief-agent" }), "mission_chief_agent_actor_required");
  rejects(() => missions.create({ title: "T", objective: "O" }, system), "mission_create_not_allowed_for_system");
});

test("missions persist, and ids are sequential within the year", () => {
  const missions = service();
  const first = missions.create({ title: "A", objective: "O" }, owner);
  const second = missions.create({ title: "B", objective: "O" }, owner);
  const number = (id: string) => Number(id.slice("MS-2026-".length));
  assert.equal(number(second.id), number(first.id) + 1);
  assert.equal(new MissionService().get(first.id)?.title, "A");
});
