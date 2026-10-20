import {
  MISSION_PRIORITIES,
  MISSION_TYPES,
  MissionTransitionError,
  type Mission,
  type MissionActor,
  type MissionTransitionName,
} from "./Mission.js";
import type { MissionService } from "./MissionService.js";

/*
 * MS-3 (ADR-0044 Decision 2): the Chief Agent proposes missions and plans
 * through the existing approval flow.
 *
 * A Chief Agent reply may carry a mission proposal: a new mission, or a
 * plan for an existing draft or planned mission. Runtime records it as the
 * Chief Agent (create or plan, then submit), so the mission waits in
 * awaiting_approval. The reply's ordinary approval, addressed to the owner,
 * carries the mission id and is the mission's only way to Approved.
 *
 * The approval is the single gate in both directions: deciding it in the
 * Approval Center moves the mission, and deciding the mission from its own
 * route decides its pending approval. A mission cannot be approved by
 * anyone but the human the approval is addressed to (ADR-0041).
 */

const CHIEF_AGENT: MissionActor = { id: "chief-agent", type: "chief-agent" };
const MISSION_ID = /^MS-\d{4}-\d{4}$/;
const MAX_EPICS = 12;
const MAX_TASKS = 40;
const MAX_TEXT = 2_000;

export interface MissionProposalTask {
  title: string;
  acceptanceCriteria: string[];
}

export interface MissionProposal {
  /* Set for a plan proposal on an existing draft or planned mission. */
  missionId?: string;
  title?: string;
  objective?: string;
  description?: string;
  type?: string;
  priority?: string;
  risks: string[];
  relatedRepositories: string[];
  plan: {
    epics: Array<{ title: string; tasks: MissionProposalTask[] }>;
    validationPlan: string[];
    requiredDocuments: string[];
  };
}

export type MissionProposalReading =
  | { proposal: MissionProposal }
  | { invalid: string }
  | null;

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, MAX_TEXT) : undefined;
}

function texts(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(text).filter((entry): entry is string => Boolean(entry)).slice(0, MAX_TASKS)
    : [];
}

/*
 * Reads the optional `missionProposal` of a reasoning reply. Absent or null
 * means no proposal; anything malformed is reported, never half-applied.
 */
export function readMissionProposal(value: unknown): MissionProposalReading {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return { invalid: "mission_proposal_not_an_object" };
  const raw = value as Record<string, unknown>;

  const missionId = text(raw.missionId);
  if (missionId && !MISSION_ID.test(missionId)) return { invalid: "mission_proposal_invalid_mission_id" };

  const title = text(raw.title);
  const objective = text(raw.objective);
  if (!missionId && (!title || !objective)) return { invalid: "mission_proposal_title_and_objective_required" };

  const rawPlan = raw.plan && typeof raw.plan === "object" ? (raw.plan as Record<string, unknown>) : null;
  const rawEpics = Array.isArray(rawPlan?.epics) ? rawPlan!.epics : [];
  const epics = rawEpics.slice(0, MAX_EPICS).map((epic: any, index: number) => ({
    title: text(epic?.title) ?? `Epic ${index + 1}`,
    tasks: (Array.isArray(epic?.tasks) ? epic.tasks : [])
      .slice(0, MAX_TASKS)
      .map((task: any) => ({ title: text(task?.title) ?? "", acceptanceCriteria: texts(task?.acceptanceCriteria) }))
      .filter((task: MissionProposalTask) => task.title),
  }));
  if (!epics.some((epic) => epic.tasks.length > 0)) return { invalid: "mission_proposal_plan_needs_a_task" };

  if (raw.type !== undefined && !(MISSION_TYPES as readonly unknown[]).includes(raw.type)) {
    return { invalid: "mission_proposal_invalid_type" };
  }
  if (raw.priority !== undefined && !(MISSION_PRIORITIES as readonly unknown[]).includes(raw.priority)) {
    return { invalid: "mission_proposal_invalid_priority" };
  }

  return {
    proposal: {
      ...(missionId ? { missionId } : {}),
      ...(title ? { title } : {}),
      ...(objective ? { objective } : {}),
      ...(text(raw.description) ? { description: text(raw.description) } : {}),
      ...(typeof raw.type === "string" ? { type: raw.type } : {}),
      ...(typeof raw.priority === "string" ? { priority: raw.priority } : {}),
      risks: texts(raw.risks),
      relatedRepositories: texts(raw.relatedRepositories),
      plan: {
        epics: epics.filter((epic) => epic.tasks.length > 0),
        validationPlan: texts(rawPlan?.validationPlan),
        requiredDocuments: texts(rawPlan?.requiredDocuments),
      },
    },
  };
}

/* What the proposal flow needs from the approval system. */
export interface MissionApprovalPort {
  get(approvalId: string): { id: string; status: string; approverId: string } | undefined;
  approve(approvalId: string): unknown;
  reject(approvalId: string, reason: string): unknown;
}

export interface DecidedApproval {
  id: string;
  approverId: string;
  metadata: Readonly<Record<string, unknown>>;
}

export class MissionProposalService {
  constructor(
    private readonly missions: MissionService,
    /* Lazy: the approval services are composed after missions. */
    private readonly approvals?: () => MissionApprovalPort,
  ) {}

  /*
   * Records a proposal as the Chief Agent and submits it. Returns the
   * mission, now awaiting approval.
   */
  propose(proposal: MissionProposal): Mission {
    const plan = proposal.plan;
    if (proposal.missionId) {
      const existing = this.missions.get(proposal.missionId);
      if (!existing) throw new MissionTransitionError("mission_not_found");
      this.missions.setPlan(existing.id, plan, CHIEF_AGENT);
      return this.missions.transition(existing.id, "submit", CHIEF_AGENT, "Chief Agent plan proposal");
    }

    const created = this.missions.create(
      {
        title: proposal.title!,
        objective: proposal.objective!,
        description: proposal.description,
        type: proposal.type,
        priority: proposal.priority,
        risks: proposal.risks,
        relatedRepositories: proposal.relatedRepositories,
        plan,
      },
      CHIEF_AGENT,
    );
    return this.missions.transition(created.id, "submit", CHIEF_AGENT, "Chief Agent mission proposal");
  }

  /*
   * A Chief Agent reply's proposal, if it carries one. Nothing is proposed
   * from a deny, or when no approver was named (nobody could approve it).
   * The returned metadata goes on the reply's decision and approval.
   */
  fromReasoning(
    reasoning: { disposition: string; metadata?: Readonly<Record<string, unknown>> },
    approverId?: string,
  ): { missionId?: string; metadata: Record<string, unknown> } {
    const reading = readMissionProposal(reasoning.metadata?.missionProposal);
    if (!reading) return { metadata: {} };
    if ("invalid" in reading) return { metadata: { missionProposalFailed: reading.invalid } };
    if (reasoning.disposition === "deny") return { metadata: { missionProposalSkipped: "disposition_deny" } };
    if (!approverId?.trim()) return { metadata: { missionProposalSkipped: "no_approver" } };

    try {
      const mission = this.propose(reading.proposal);
      return {
        missionId: mission.id,
        metadata: {
          missionId: mission.id,
          missionTitle: mission.title,
          missionProposalKind: reading.proposal.missionId ? "plan" : "mission",
        },
      };
    } catch (error) {
      return {
        metadata: {
          missionProposalFailed: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /* The approval that decides this proposal. */
  attachApproval(missionId: string, approvalId: string): Mission {
    return this.missions.attachApproval(missionId, approvalId);
  }

  /*
   * Called before an approval is decided. Approving moves the mission to
   * Approved as the approver, and refuses (so nothing is approved) when the
   * mission cannot be approved. Rejecting returns an awaiting mission to
   * Planned; a stale approval can always be rejected.
   */
  beforeApprovalDecided(approval: DecidedApproval, outcome: "approved" | "rejected", reason?: string): void {
    const missionId = typeof approval.metadata?.missionId === "string" ? approval.metadata.missionId : null;
    if (!missionId) return;
    const mission = this.missions.get(missionId);
    const approver: MissionActor = { id: approval.approverId, type: "human" };

    if (outcome === "approved") {
      if (!mission) throw new MissionTransitionError("mission_not_found");
      this.missions.transition(mission.id, "approve", approver, `Approved through ${approval.id}`);
      return;
    }
    if (mission?.state === "awaiting_approval") {
      this.missions.transition(mission.id, "reject", approver, `Rejected through ${approval.id}: ${reason ?? ""}`.trim());
    }
  }

  /*
   * Owner steps from the mission route. Approve and reject go through the
   * mission's pending approval when it has one; cancel also rejects it.
   */
  decide(id: string, step: MissionTransitionName, actor: MissionActor, reason?: string): Mission {
    const mission = this.missions.get(id);
    if (!mission) throw new MissionTransitionError("mission_not_found");
    const pending = this.pendingApproval(mission);

    if (pending && (step === "approve" || step === "reject")) {
      if (actor.id !== pending.approverId) {
        throw new MissionTransitionError("mission_approval_not_allowed_for_this_approver");
      }
      if (step === "reject" && !reason?.trim()) throw new MissionTransitionError("mission_reject_reason_required");
      const approvals = this.approvals!();
      if (step === "approve") approvals.approve(pending.id);
      else approvals.reject(pending.id, reason!.trim());
      return this.missions.get(id)!;
    }

    const updated = this.missions.transition(id, step, actor, reason);
    if (pending && step === "cancel") {
      this.approvals!().reject(pending.id, `Mission cancelled: ${reason?.trim() ?? ""}`.trim());
    }
    return updated;
  }

  pendingApproval(mission: Mission): { id: string; approverId: string } | null {
    if (!this.approvals) return null;
    const approvals = this.approvals();
    for (const approvalId of [...mission.requiredApprovals].reverse()) {
      const approval = approvals.get(approvalId);
      if (approval?.status === "pending") return { id: approval.id, approverId: approval.approverId };
    }
    return null;
  }
}
