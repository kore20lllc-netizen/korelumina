import assert from "node:assert/strict";
import test from "node:test";

import { ExecutiveDecisionService } from "../../decision/index.js";
import {
  ExecutiveApprovalDecisionService,
  ExecutiveApprovalService,
  ExecutiveDecisionApprovalRequestService,
} from "../../approval/index.js";
import { ChiefAgentReasoningDecisionService } from "../../reasoning/ChiefAgentReasoningDecisionService.js";
import { ChiefAgentOperationalStateReader } from "../../reasoning/ChiefAgentOperationalState.js";
import { MissionProposalService, MissionService, readMissionProposal } from "../index.js";

/* MS-3 (ADR-0044 Decision 2): Chief Agent proposals reach Approved only through the owner's approval. */

const OWNER = "human:founder";
const plan = {
  epics: [{ title: "Runtime", tasks: [{ title: "Do it", acceptanceCriteria: ["It is done"] }] }],
  validationPlan: ["npm run build passes"],
};
const newMission = { title: "Retire stale fixtures", objective: "Current policy shows only live knowledge", priority: "high", plan };

/* The production composition, with the same lazy wiring as index.ts. */
function compose() {
  const missions = new MissionService();
  const decisions = new ExecutiveDecisionService();
  const approvals = new ExecutiveApprovalService();
  let proposals!: MissionProposalService;
  const approvalDecisions = new ExecutiveApprovalDecisionService(approvals, decisions, {
    beforeDecided: (approval, outcome, reason) => proposals.beforeApprovalDecided(approval, outcome, reason),
  });
  proposals = new MissionProposalService(missions, () => ({
    get: (id) => approvals.get(id),
    approve: (approvalId) => approvalDecisions.approve({ approvalId }),
    reject: (approvalId, reason) => approvalDecisions.reject({ approvalId, reason }),
  }));
  const reasoningDecisions = new ChiefAgentReasoningDecisionService(decisions);
  const approvalRequests = new ExecutiveDecisionApprovalRequestService(approvals);

  /* What the reasoning adapter does with a completed Chief Agent reply. */
  const reply = (missionProposal: unknown, options: { disposition?: string; approverId?: string } = {}) => {
    const id = `reasoning:event-${Math.random().toString(36).slice(2)}`;
    const reasoning = {
      id,
      sessionId: id,
      title: "Chief Agent proposal",
      question: "What should we do next?",
      conclusion: "Proposed.",
      disposition: options.disposition ?? "review",
      confidence: 0.8,
      evidence: [],
      assumptions: [],
      status: "completed",
      metadata: { missionProposal },
      createdAt: 1,
    } as any;
    const approverId = "approverId" in options ? options.approverId : OWNER;
    const proposed = proposals.fromReasoning(reasoning, approverId);
    const decision = reasoningDecisions.createProposedDecision({ reasoning, requestedBy: "chief-agent", metadata: proposed.metadata });
    let approval;
    if (approverId && decision.status === "proposed") {
      approval = approvalRequests.requestApproval({ decision, approverId, requestedBy: "chief-agent" });
      if (proposed.missionId) proposals.attachApproval(proposed.missionId, approval.id);
    }
    return { proposed, decision, approval, mission: proposed.missionId ? missions.get(proposed.missionId)! : null };
  };

  return { missions, decisions, approvals, approvalDecisions, proposals, reply };
}

test("mission proposals are validated before anything is recorded", () => {
  assert.equal(readMissionProposal(null), null);
  assert.equal(readMissionProposal(undefined), null);
  assert.deepEqual(readMissionProposal("a mission"), { invalid: "mission_proposal_not_an_object" });
  assert.deepEqual(readMissionProposal({ title: "No objective", plan }), { invalid: "mission_proposal_title_and_objective_required" });
  assert.deepEqual(readMissionProposal({ ...newMission, plan: { epics: [{ title: "Empty", tasks: [] }] } }), { invalid: "mission_proposal_plan_needs_a_task" });
  assert.deepEqual(readMissionProposal({ missionId: "MS-26-1", plan }), { invalid: "mission_proposal_invalid_mission_id" });
  assert.deepEqual(readMissionProposal({ ...newMission, type: "magic" }), { invalid: "mission_proposal_invalid_type" });

  const reading = readMissionProposal({ missionId: "MS-2026-0001", plan });
  assert.ok(reading && "proposal" in reading);
  assert.equal(reading.proposal.missionId, "MS-2026-0001");
});

test("a Chief Agent proposal waits for the owner, and the owner's approval approves it", () => {
  const { reply, approvalDecisions, missions } = compose();
  const { mission, approval, decision } = reply(newMission);

  assert.ok(mission && approval);
  assert.equal(mission.state, "awaiting_approval");
  assert.deepEqual(mission.proposedBy, { id: "chief-agent", type: "chief-agent" });
  assert.deepEqual(mission.history.map((step) => [step.to, step.actor.type]), [
    ["draft", "chief-agent"],
    ["planned", "chief-agent"],
    ["awaiting_approval", "chief-agent"],
  ]);
  assert.deepEqual(mission.requiredApprovals, [approval.id]);
  assert.equal(approval.approverId, OWNER);
  assert.equal(approval.metadata.missionId, mission.id);
  assert.equal(decision.metadata.missionProposalKind, "mission");

  approvalDecisions.approve({ approvalId: approval.id });
  const approved = missions.get(mission.id)!;
  assert.equal(approved.state, "approved");
  assert.deepEqual(approved.history.at(-1)?.actor, { id: OWNER, type: "human" });
  assert.equal(approved.history.at(-1)?.reason, `Approved through ${approval.id}`);
});

test("rejecting the approval returns the mission to planned with the owner's reason", () => {
  const { reply, approvalDecisions, missions } = compose();
  const { mission, approval } = reply(newMission);
  approvalDecisions.reject({ approvalId: approval!.id, reason: "Not this quarter" });
  const rejected = missions.get(mission!.id)!;
  assert.equal(rejected.state, "planned");
  assert.match(rejected.history.at(-1)?.reason ?? "", /Not this quarter/);
});

test("nothing is proposed from a deny, without an approver, or from a malformed proposal", () => {
  const { reply, missions } = compose();
  const before = missions.list().length;

  const denied = reply(newMission, { disposition: "deny" });
  assert.equal(denied.proposed.metadata.missionProposalSkipped, "disposition_deny");
  assert.equal(denied.approval, undefined);

  const unaddressed = reply(newMission, { approverId: undefined });
  assert.equal(unaddressed.proposed.metadata.missionProposalSkipped, "no_approver");

  const malformed = reply({ title: "Only a title" });
  assert.equal(malformed.proposed.metadata.missionProposalFailed, "mission_proposal_title_and_objective_required");
  assert.ok(malformed.approval, "the reply's approval still exists, without a mission");
  assert.equal(malformed.approval!.metadata.missionId, undefined);

  assert.equal(missions.list().length, before);
});

test("a plan proposal replans an existing mission and goes back for approval", () => {
  const { reply, missions, proposals } = compose();
  const draft = missions.create({ title: "Owner draft", objective: "Owner idea" }, { id: OWNER, type: "human" });

  const { mission, approval } = reply({ missionId: draft.id, plan });
  assert.equal(mission!.id, draft.id);
  assert.equal(mission!.state, "awaiting_approval");
  assert.equal(mission!.plan?.epics[0].tasks[0].title, "Do it");
  assert.equal(approval!.metadata.missionProposalKind, "plan");

  const unknown = reply({ missionId: "MS-2099-9999", plan });
  assert.equal(unknown.proposed.metadata.missionProposalFailed, "mission_not_found");

  /* An approved mission cannot be replanned by a proposal. */
  proposals.decide(draft.id, "approve", { id: OWNER, type: "human" });
  const late = reply({ missionId: draft.id, plan });
  assert.equal(late.proposed.metadata.missionProposalFailed, "mission_cannot_plan_from_approved");
  assert.equal(missions.get(draft.id)!.state, "approved");
});

test("deciding from the mission route decides its approval, and only its approver may", () => {
  const { reply, proposals, approvals, decisions } = compose();
  const { mission, approval } = reply(newMission);

  assert.throws(
    () => proposals.decide(mission!.id, "approve", { id: "human:someone-else", type: "human" }),
    /mission_approval_not_allowed_for_this_approver/,
  );
  assert.equal(approvals.get(approval!.id)!.status, "pending");

  const approved = proposals.decide(mission!.id, "approve", { id: OWNER, type: "human" });
  assert.equal(approved.state, "approved");
  assert.equal(approvals.get(approval!.id)!.status, "approved");
  assert.equal(decisions.get(approval!.decisionId)!.status, "approved");
});

test("cancelling a proposed mission rejects its pending approval", () => {
  const { reply, proposals, approvals } = compose();
  const { mission, approval } = reply(newMission);
  const cancelled = proposals.decide(mission!.id, "cancel", { id: OWNER, type: "human" }, "Superseded");
  assert.equal(cancelled.state, "cancelled");
  const rejected = approvals.get(approval!.id)!;
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.comments, "Mission cancelled: Superseded");
});

test("a mission that cannot be approved leaves its approval undecided", () => {
  const { reply, approvalDecisions, proposals, approvals, decisions } = compose();
  const { mission, approval } = reply(newMission);
  proposals.decide(mission!.id, "block", { id: OWNER, type: "human" }, "Waiting on legal");

  assert.throws(() => approvalDecisions.approve({ approvalId: approval!.id }), /mission_cannot_approve_from_blocked/);
  assert.equal(approvals.get(approval!.id)!.status, "pending");
  assert.equal(decisions.get(approval!.decisionId)!.status, "proposed");
});

test("an approval addressed to an agent can never approve a mission", () => {
  const { missions, proposals } = compose();
  const reading = readMissionProposal(newMission);
  assert.ok(reading && "proposal" in reading);
  const mission = proposals.propose(reading.proposal);

  assert.throws(
    () => proposals.beforeApprovalDecided({ id: "approval:x", approverId: "chief-agent", metadata: { missionId: mission.id } }, "approved"),
    /mission_human_actor_required/,
  );
  assert.equal(missions.get(mission.id)!.state, "awaiting_approval");
});

test("the Chief Agent sees open missions in its operational state", () => {
  const { missions } = compose();
  const sources = {
    activation: () => ({ state: "ACTIVE", autonomyLevel: "PROPOSE_ONLY" }),
    learning: () => ({ checkpoint: null, pendingCommits: [], nonOwnerPendingCommits: [], running: false, cycles: [] }),
    approvals: () => [],
    decisions: () => [],
    canonicalReviews: () => [],
  };
  const created = missions.create({ ...newMission, title: "Visible mission" }, { id: OWNER, type: "human" });
  const state = new ChiefAgentOperationalStateReader({ ...sources, missions: () => missions.list() }).read();
  const entry = state.entries.find((candidate) => candidate.id === `operational:mission:${created.id}`);
  assert.ok(entry);
  assert.match(entry.title, /planned: Visible mission/);
  assert.match(entry.detail, /Plan: 1 task/);

  const without = new ChiefAgentOperationalStateReader(sources).read();
  assert.equal(without.entries.some((candidate) => candidate.kind === "mission"), false);
});
